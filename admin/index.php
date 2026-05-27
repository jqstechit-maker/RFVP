<?php
/**
 * Painel Administrativo Monolítico do Sistema de Rifas
 * Otimizado para Hospedagem Compartilhada cPanel (PHP 8.2+ & Bootstrap 5)
 */

session_start();
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../app/models/Rifa.php';
require_once __DIR__ . '/../app/models/Pagamento.php';

$db = Database::getConnection();
$error_msg = "";
$success_msg = "";

// 1. Processo de Autenticação / Sessão Segura
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header("Location: index.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_admin'])) {
    $user = trim($_POST['usuario']);
    $pass = $_POST['senha'];

    $stmt = $db->prepare("SELECT * FROM admins WHERE usuario = :usuario LIMIT 1");
    $stmt->execute([':usuario' => $user]);
    $admin = $stmt->fetch();

    $password_hash = isset($admin['senha']) ? $admin['senha'] : (isset($admin['senha_hash']) ? $admin['senha_hash'] : '');

    if ($admin && password_verify($pass, $password_hash)) {
        $_SESSION['admin_logado'] = true;
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_nome'] = isset($admin['nome']) ? $admin['nome'] : (isset($admin['usuario']) ? $admin['usuario'] : 'Administrador');
        
        try {
            $stmtUp = $db->prepare("UPDATE admins SET ultimo_login = NOW() WHERE id = :id");
            $stmtUp->execute([':id' => $admin['id']]);
        } catch (PDOException $e) {
            // Ignora silenciosamente se o campo ultimo_login não existir no banco importado
        }

        header("Location: index.php");
        exit;
    } else {
        $error_msg = "Usuário ou senha incorretos!";
    }
}

// Bloqueia acesso se não autenticado
if (!isset($_SESSION['admin_logado']) || $_SESSION['admin_logado'] !== true) {
    ?>
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Painel Rifa VIP Adm</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0f172a; color: #f8fafc; height: 100vh; display: flex; align-items: center; justify-content: center; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 400px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .btn-primary { background: #3b82f6; border: none; }
            .btn-primary:hover { background: #2563eb; }
        </style>
    </head>
    <body>
        <div class="card p-4">
            <div class="text-center mb-4">
                <h3 class="fw-bold text-white">Rifa VIP Admin</h3>
                <p class="text-muted small">Entre com suas credenciais de acesso</p>
            </div>
            
            <?php if ($error_msg): ?>
                <div class="alert alert-danger px-3 py-2 small"><?= $error_msg ?></div>
            <?php endif; ?>

            <form method="POST" action="index.php">
                <input type="hidden" name="login_admin" value="1">
                <div class="mb-3">
                    <label class="form-label col-form-label-sm">Usuário</label>
                    <input type="text" name="usuario" class="form-control text-white bg-dark border-secondary" required placeholder="admin">
                </div>
                <div class="mb-4">
                    <label class="form-label col-form-label-sm">Senha</label>
                    <input type="password" name="senha" class="form-control text-white bg-dark border-secondary" required placeholder="•••••">
                </div>
                <button type="submit" class="btn btn-primary w-full py-2 fw-medium text-white w-100">Acessar Painel</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// 2. Ações CRUD e Sorteios (Com Seguranças e Validações)
$action = $_GET['action'] ?? 'dashboard';

// AÇÃO: Exportar Relatório CSV
if ($action === 'export_csv') {
    $tipo = $_GET['type'] ?? 'pagamentos';
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=relatorio_' . $tipo . '_' . date('Y-m-d') . '.csv');
    $output = fopen('php://output', 'w');
    // Forçar encode UTF-8 correto no Microsoft Excel
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    if ($tipo === 'pagamentos') {
        fputcsv($output, ['ID Pagamento', 'Rifa', 'Cliente', 'CPF', 'Telefone', 'Numero', 'Valor', 'Status', 'Data/Hora']);
        $stmtEx = $db->query("
            SELECT p.id, r.titulo, c.nome, c.cpf, c.telefone, p.numero, p.valor, p.status, p.created_at 
            FROM pagamentos p
            JOIN rifas r ON p.rifa_id = r.id
            JOIN clientes c ON p.cliente_id = c.id
            ORDER BY p.id DESC
        ");
        while ($row = $stmtEx->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($output, $row);
        }
    } elseif ($tipo === 'vendas_rifa') {
        fputcsv($output, ['Rifa ID', 'Titulo', 'Valor Bilhete', 'Total Pagos', 'Total Pendentes', 'Arrecadado (R$)']);
        $stmtEx = $db->query("
            SELECT r.id, r.titulo, r.valor_por_numero,
                   SUM(CASE WHEN p.status = 'pago' THEN 1 ELSE 0 END) as pagos,
                   SUM(CASE WHEN p.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
                   SUM(CASE WHEN p.status = 'pago' THEN p.valor ELSE 0 END) as total_arrecadado
            FROM rifas r
            LEFT JOIN pagamentos p ON r.id = p.rifa_id
            GROUP BY r.id
        ");
        while ($row = $stmtEx->fetch(PDO::FETCH_ASSOC)) {
            fputcsv($output, $row);
        }
    }
    fclose($output);
    exit;
}

// AÇÃO: Criar Rifa
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['criar_rifa'])) {
    $rifaModel = new Rifa();
    $sucesso = $rifaModel->criar([
        'titulo' => trim($_POST['titulo']),
        'descricao' => trim($_POST['descricao']),
        'valor_por_numero' => (float)$_POST['valor'],
        'data_sorteio' => $_POST['data_sorteio'],
        'imagem_url' => trim($_POST['imagem']),
        'total_numeros' => 1000
    ]);
    if ($sucesso) {
        $success_msg = "Rifa criada com sucesso!";
    } else {
        $error_msg = "Falha ao criar rifa.";
    }
}

// AÇÃO: Editar Rifa
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['editar_rifa'])) {
    $rifaModel = new Rifa();
    $sucesso = $rifaModel->atualizar((int)$_POST['rifa_id'], [
        'titulo' => trim($_POST['titulo']),
        'descricao' => trim($_POST['descricao']),
        'valor_por_numero' => (float)$_POST['valor'],
        'data_sorteio' => $_POST['data_sorteio'],
        'imagem_url' => trim($_POST['imagem']),
        'status' => $_POST['status']
    ]);
    if ($sucesso) {
        $success_msg = "Rifa atualizada com sucesso!";
    } else {
        $error_msg = "Falha ao editar.";
    }
}

// AÇÃO: Excluir Rifa
if (isset($_GET['delete_rifa'])) {
    $rifaModel = new Rifa();
    if ($rifaModel->excluir((int)$_GET['delete_rifa'])) {
        $success_msg = "Rifa excluída.";
    } else {
        $error_msg = "Erro ao apagar rifa.";
    }
}

// AÇÃO: Forçar Baixa Manual de Número
if (isset($_GET['pago_manualmente'])) {
    $payId = (int)$_GET['pago_manualmente'];
    $stmtPay = $db->prepare("SELECT txid FROM pagamentos WHERE id = :id LIMIT 1");
    $stmtPay->execute([':id' => $payId]);
    $pData = $stmtPay->fetch();
    if ($pData) {
        $pagamentoObj = new Pagamento();
        $res = $pagamentoObj->processarPagamentoWebhook($pData['txid'], "Administrador (Manual)");
        $success_msg = "Baixa efetuada: " . $res['mensagem'];
    }
}

// AÇÃO: Liberar/Cancelar Pagamento Pendente
if (isset($_GET['cancelando_pagamento'])) {
    $pId = (int)$_GET['cancelando_pagamento'];
    $stmtC = $db->prepare("UPDATE pagamentos SET status = 'reembolsado' WHERE id = :id AND status = 'pendente'");
    if ($stmtC->execute([':id' => $pId])) {
        $success_msg = "Pagamento liberado (cancelado) com sucesso.";
    }
}

// AÇÃO: Realizar Sorteio Manual ou Federal
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['realizar_sorteio'])) {
    $rifaId = (int)$_POST['rifa_id'];
    $metodo = $_POST['metodo'];
    $rifaModel = new Rifa();

    try {
        if ($metodo === 'federal') {
            $numFed = trim($_POST['numero_federal']);
            if (empty($numFed)) {
                throw new Exception("Informe o número extraído da Loteria Federal.");
            }
            $ganhador = $rifaModel->sortearFederal($rifaId, $numFed);
            $success_msg = "Sorteio Federal realizado! Ganhador: " . $ganhador['nome'] . " (" . $ganhador['numero_vencedor'] . ")";
        } else {
            $numSorteado = trim($_POST['numero_sorteado']);
            if ($numSorteado === "") {
                throw new Exception("Informe a dezena sorteada manualmente.");
            }
            $ganhador = $rifaModel->sortearManual($rifaId, $numSorteado);
            $success_msg = "Sorteio Manual realizado! Ganhador: " . $ganhador['nome'] . " (Número: " . $ganhador['numero'] . ")";
        }
    } catch (Exception $e) {
        $error_msg = $e->getMessage();
    }
}

// 3. Consultar Dados para as Telas
$rifas = (new Rifa())->getAtivas(10); // Carrega principais rifas para visualização
$pagModel = new Pagamento();
$todosPagamentos = $pagModel->listarTodos(null, 100);

// Contadores Dashboard KPIs
$countAtivas = $db->query("SELECT COUNT(*) FROM rifas WHERE status = 'ativa'")->fetchColumn();
$totalArrecadado = $db->query("SELECT SUM(valor) FROM pagamentos WHERE status = 'pago'")->fetchColumn() ?: 0.00;
$totalPendentes = $db->query("SELECT COUNT(*) FROM pagamentos WHERE status = 'pendente'")->fetchColumn();
$totalPagos = $db->query("SELECT COUNT(*) FROM pagamentos WHERE status = 'pago'")->fetchColumn();
$totalConflitos = $db->query("SELECT COUNT(*) FROM pagamentos WHERE status = 'conflito'")->fetchColumn();

// Logs recentes
$logsRecentes = $db->query("SELECT * FROM logs ORDER BY id DESC LIMIT 10")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Administrador - RIFA VIP</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: #0f172a; color: #e2e8f0; font-family: 'Segoe UI', system-ui, sans-serif; }
        .sidebar { background: #1e293b; min-height: 100vh; border-right: 1px solid #334155; }
        .sidebar .nav-link { color: #94a3b8; font-weight: 500; padding: 12px 20px; border-radius: 8px; margin: 4px 10px; }
        .sidebar .nav-link:hover, .sidebar .nav-link.active { color: #fff; background: #334155; }
        .card-kpi { background: #1e293b; border: 1px solid #334155; border-radius: 12px; transition: transform 0.2s; }
        .card-kpi:hover { transform: translateY(-4px); }
        .table-custom { background: #1e293b; color: #e2e8f0; border-radius: 12px; border: 1px solid #334155; }
        .table-custom th { background: #334155; color: #fff; border: none; }
        .table-custom td { border-bottom: 1px solid #334155; color: #cbd5e1; }
        .btn-action { padding: 4px 8px; font-size: 0.85rem; border-radius: 6px; }
    </style>
</head>
<body>
<div class="container-fluid">
    <div class="row">
        <!-- Sidebar Navigation -->
        <nav class="col-md-3 col-lg-2 d-md-block sidebar collapse p-0">
            <div class="p-3 text-center border-bottom border-secondary mb-3">
                <h4 class="text-white fw-bold mb-0">Rifa VIP Admin</h4>
                <span class="text-muted small">Ola, <?= htmlspecialchars($_SESSION['admin_nome']) ?></span>
            </div>
            <ul class="nav flex-column mb-auto">
                <li class="nav-item">
                    <a class="nav-link <?= $action === 'dashboard' ? 'active' : '' ?>" href="index.php?action=dashboard">
                        <i class="fa-solid fa-chart-line me-2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= $action === 'rifas' ? 'active' : '' ?>" href="index.php?action=rifas">
                        <i class="fa-solid fa-ticket me-2"></i> Gestão de Rifas
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= $action === 'pagamentos' ? 'active' : '' ?>" href="index.php?action=pagamentos">
                        <i class="fa-solid fa-receipt me-2"></i> Pagamentos
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= $action === 'sorteio' ? 'active' : '' ?>" href="index.php?action=sorteio">
                        <i class="fa-solid fa-trophy me-2"></i> Central de Sorteio
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= $action === 'relatorios' ? 'active' : '' ?>" href="index.php?action=relatorios">
                        <i class="fa-solid fa-file-invoice-dollar me-2"></i> Relatórios
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-danger mt-4" href="index.php?action=logout">
                        <i class="fa-solid fa-right-from-bracket me-2"></i> Sair do Painel
                    </a>
                </li>
            </ul>
        </nav>

        <!-- Main Workspace -->
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            
            <?php if ($success_msg): ?>
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="fa-solid fa-circle-check me-2"></i> <?= htmlspecialchars($success_msg) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            <?php endif; ?>

            <?php if ($error_msg): ?>
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i> <?= htmlspecialchars($error_msg) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            <?php endif; ?>

            <!-- PÁGINA: DASHBOARD -->
            <?php if ($action === 'dashboard'): ?>
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-secondary">
                    <h1 class="h2 text-white fw-bold">Dashboard Geral</h1>
                    <div class="text-muted small">Última atualização: <?= date('d/m/Y H:i:s') ?></div>
                </div>

                <!-- KPI Bento Grid -->
                <div class="row g-3 mb-4">
                    <div class="col-6 col-lg-3">
                        <div class="card-kpi p-3">
                            <div class="text-muted small uppercase fw-semibold">Rifas Simultâneas Ativas</div>
                            <div class="h2 text-primary fw-bold mb-0 mt-1"><?= $countAtivas ?> / 4</div>
                        </div>
                    </div>
                    <div class="col-6 col-lg-3">
                        <div class="card-kpi p-3">
                            <div class="text-muted small uppercase fw-semibold">Total Arrecadado</div>
                            <div class="h2 text-success fw-bold mb-0 mt-1">R$ <?= number_format($totalArrecadado, 2, ',', '.') ?></div>
                        </div>
                    </div>
                    <div class="col-6 col-lg-3">
                        <div class="card-kpi p-3">
                            <div class="text-muted small uppercase fw-semibold">Cotas Pendentes</div>
                            <div class="h2 text-warning fw-bold mb-0 mt-1"><?= $totalPendentes ?></div>
                        </div>
                    </div>
                    <div class="col-6 col-lg-3">
                        <div class="card-kpi p-3">
                            <div class="text-muted small uppercase fw-semibold">Cotas Pagas / Conflitos</div>
                            <div class="h2 text-white fw-bold mb-0 mt-1"><?= $totalPagos ?> <span class="text-danger small">/ <?= $totalConflitos ?></span></div>
                        </div>
                    </div>
                </div>

                <!-- Recents and Logs -->
                <div class="row g-4">
                    <!-- Últimos Pagamentos -->
                    <div class="col-lg-7">
                        <h5 class="text-white fw-semibold mb-3">Últimas Atividades de Compra</h5>
                        <div class="table-responsive">
                            <table class="table table-custom align-middle">
                                <thead>
                                    <tr>
                                        <th>Rifa</th>
                                        <th>Cliente</th>
                                        <th>Cota</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if (empty($todosPagamentos)): ?>
                                        <tr><td colspan="5" class="text-center text-muted">Nenhuma transação registrada.</td></tr>
                                    <?php else: ?>
                                        <?php foreach (array_slice($todosPagamentos, 0, 7) as $tp): ?>
                                            <tr>
                                                <td><?= htmlspecialchars($tp['rifa_titulo']) ?></td>
                                                <td><?= htmlspecialchars($tp['cliente_nome']) ?></td>
                                                <td class="font-mono bg-dark px-2 rounded d-inline-block text-center"><?= $tp['numero'] ?></td>
                                                <td>R$ <?= number_format($tp['valor'], 2, ',', '.') ?></td>
                                                <td>
                                                    <?php if ($tp['status'] === 'pago'): ?>
                                                        <span class="badge bg-success">Pago</span>
                                                    <?php elseif ($tp['status'] === 'pendente'): ?>
                                                        <span class="badge bg-warning text-dark">Pendente</span>
                                                    <?php elseif ($tp['status'] === 'conflito'): ?>
                                                        <span class="badge bg-danger">Conflito</span>
                                                    <?php else: ?>
                                                        <span class="badge bg-secondary">Cancelado</span>
                                                    <?php endif; ?>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Consolidação de Logs do Sistema -->
                    <div class="col-lg-5">
                        <h5 class="text-white fw-semibold mb-3">Logs Técnicos e Webhooks</h5>
                        <div class="p-3 bg-dark rounded border border-secondary font-mono small" style="max-height: 340px; overflow-y: auto;">
                            <?php foreach ($logsRecentes as $l): ?>
                                <div class="mb-2 pb-2 border-bottom border-secondary">
                                    <span class="text-muted small">[<?= date('H:i:s', strtotime($l['created_at'])) ?>]</span>
                                    <?php if ($l['tipo'] === 'sucesso'): ?>
                                        <span class="text-success">[OK]</span>
                                    <?php elseif ($l['tipo'] === 'alerta'): ?>
                                        <span class="text-warning">[WARN]</span>
                                    <?php else: ?>
                                        <span class="text-info">[INFO]</span>
                                    <?php endif; ?>
                                    <span class="text-light"><?= htmlspecialchars($l['mensagem']) ?></span>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

            <!-- PÁGINA: GESTÃO DE RIFAS -->
            <?php elseif ($action === 'rifas'): ?>
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-secondary">
                    <h1 class="h2 text-white fw-bold">Gestão de Rifas</h1>
                    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modalCriarRifa">
                        <i class="fa-solid fa-plus me-1"></i> Nova Rifa (Max 4)
                    </button>
                </div>

                <div class="row row-cols-1 row-cols-md-2 g-4">
                    <?php foreach ($rifas as $r): ?>
                        <div class="col">
                            <div class="card bg-slate h-100 border border-secondary" style="background:#1e293b;">
                                <div class="row g-0 h-100">
                                    <div class="col-md-4">
                                        <img src="<?= htmlspecialchars($r['imagem_url']) ?>" class="img-fluid rounded-start h-100 object-fit-cover" alt="image" style="min-height: 140px;">
                                    </div>
                                    <div class="col-md-8">
                                        <div class="card-body text-white">
                                            <h5 class="card-title fw-bold"><?= htmlspecialchars($r['titulo']) ?></h5>
                                            <p class="card-text text-muted small mb-1">Valor Unitário: R$ <?= number_format($r['valor_por_numero'], 2, ',', '.') ?></p>
                                            <p class="card-text text-muted small mb-2">Data Sorteio: <?= date('d/m/Y H:i', strtotime($r['data_sorteio'])) ?></p>
                                            <div>
                                                <span class="badge bg-<?= $r['status'] === 'ativa' ? 'success' : ($r['status'] === 'sorteada' ? 'info' : 'secondary') ?> mb-2">
                                                    <?= ucfirst($r['status']) ?>
                                                </span>
                                            </div>
                                            <div class="d-flex gap-2">
                                                <button class="btn btn-warning btn-sm btn-action text-white" data-bs-toggle="modal" data-bs-target="#editModal<?= $r['id'] ?>">Editar</button>
                                                <a href="index.php?action=rifas&delete_rifa=<?= $r['id'] ?>" class="btn btn-danger btn-sm btn-action" onclick="return confirm('Deseja excluir permanentemente?')">Excluir</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MODAL EDITAR RIFA -->
                        <div class="modal fade" id="editModal<?= $r['id'] ?>" tabindex="-1">
                            <div class="modal-dialog">
                                <form method="POST" action="index.php?action=rifas" class="modal-content text-white" style="background: #1e293b; border: 1px solid #334155;">
                                    <div class="modal-header border-secondary">
                                        <h5 class="modal-title">Editar Rifa</h5>
                                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body">
                                        <input type="hidden" name="editar_rifa" value="1">
                                        <input type="hidden" name="rifa_id" value="<?= $r['id'] ?>">
                                        <div class="mb-3">
                                            <label class="form-label">Título</label>
                                            <input type="text" name="titulo" class="form-control bg-dark text-white border-secondary" required value="<?= htmlspecialchars($r['titulo']) ?>">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Descrição</label>
                                            <textarea name="descricao" class="form-control bg-dark text-white border-secondary" required rows="3"><?= htmlspecialchars($r['descricao']) ?></textarea>
                                        </div>
                                        <div class="row mb-3">
                                            <div class="col">
                                                <label class="form-label">Valor (R$)</label>
                                                <input type="number" step="0.01" name="valor" class="form-control bg-dark text-white border-secondary" required value="<?= $r['valor_por_numero'] ?>">
                                            </div>
                                            <div class="col">
                                                <label class="form-label">Status</label>
                                                <select name="status" class="form-select bg-dark text-white border-secondary">
                                                    <option value="ativa" <?= $r['status'] === 'ativa'?'selected':'' ?>>Ativa</option>
                                                    <option value="inativa" <?= $r['status'] === 'inativa'?'selected':'' ?>>Inativa</option>
                                                    <option value="sorteada" <?= $r['status'] === 'sorteada'?'selected':'' ?>>Sorteada</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Data Limite Sorteio</label>
                                            <input type="datetime-local" name="data_sorteio" class="form-control bg-dark text-white border-secondary" required value="<?= date('Y-m-d\TH:i', strtotime($r['data_sorteio'])) ?>">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">URL da Imagem</label>
                                            <input type="text" name="imagem" class="form-control bg-dark text-white border-secondary" required value="<?= htmlspecialchars($r['imagem_url']) ?>">
                                        </div>
                                    </div>
                                    <div class="modal-footer border-secondary">
                                        <button type="submit" class="btn btn-warning text-white">Salvar Alterações</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <!-- MODAL CRIAR RIFA -->
                <div class="modal fade" id="modalCriarRifa" tabindex="-1">
                    <div class="modal-dialog">
                        <form method="POST" action="index.php?action=rifas" class="modal-content text-white" style="background: #1e293b; border: 1px solid #334155;">
                            <div class="modal-header border-secondary">
                                <h5 class="modal-title">Cadastrar Novo Sorteio</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <input type="hidden" name="criar_rifa" value="1">
                                <div class="mb-3">
                                    <label class="form-label">Título da Rifa</label>
                                    <input type="text" name="titulo" class="form-control bg-dark text-white border-secondary" required placeholder="Ex: Moto Yamaha 300cc Novinha">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Descrição dos Prêmios</label>
                                    <textarea name="descricao" class="form-control bg-dark text-white border-secondary" required rows="3" placeholder="Insira regulamentos e detalhamentos do envio."></textarea>
                                </div>
                                <div class="row mb-3">
                                    <div class="col">
                                        <label class="form-label">Valor por bilhete (R$)</label>
                                        <input type="number" step="0.01" name="valor" class="form-control bg-dark text-white border-secondary" required placeholder="5.50">
                                    </div>
                                    <div class="col">
                                        <label class="form-label">Total Cotas</label>
                                        <input type="text" class="form-control bg-dark text-white border-secondary" disabled value="1000 (000-999)">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Data Sorteio</label>
                                    <input type="datetime-local" name="data_sorteio" class="form-control bg-dark text-white border-secondary" required value="<?= date('Y-m-d\T20:00') ?>">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">URL da Imagem de Capa</label>
                                    <input type="text" name="imagem" class="form-control bg-dark text-white border-secondary" required placeholder="https://api.site.com/image.jpg">
                                </div>
                            </div>
                            <div class="modal-footer border-secondary">
                                <button type="submit" class="btn btn-primary text-white">Criar Rifa</button>
                            </div>
                        </form>
                    </div>
                </div>

            <!-- PÁGINA: PAGAMENTOS -->
            <?php elseif ($action === 'pagamentos'): ?>
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-secondary">
                    <h1 class="h2 text-white fw-bold">Consulta de Pagamentos</h1>
                    <div class="d-flex gap-2">
                        <a href="index.php?action=pagamentos" class="btn btn-secondary btn-sm">Limpar Filtros</a>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-custom align-middle">
                        <thead>
                            <tr>
                                <th>Rifa</th>
                                <th>Adquirente</th>
                                <th>Cota</th>
                                <th>TXID</th>
                                <th>Preço</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($todosPagamentos as $tp): ?>
                                <tr>
                                    <td><?= htmlspecialchars($tp['rifa_titulo']) ?></td>
                                    <td>
                                        <strong><?= htmlspecialchars($tp['cliente_nome']) ?></strong><br>
                                        <span class="small text-muted"><?= $tp['cliente_telefone'] ?></span>
                                    </td>
                                    <td class="font-mono"><?= $tp['numero'] ?></td>
                                    <td class="font-mono text-xs"><?= htmlspecialchars($tp['txid']) ?></td>
                                    <td>R$ <?= number_format($tp['valor'], 2, ',', '.') ?></td>
                                    <td>
                                        <?php if ($tp['status'] === 'pago'): ?>
                                            <span class="badge bg-success">Aprovado</span>
                                        <?php elseif ($tp['status'] === 'pendente'): ?>
                                            <span class="badge bg-warning text-dark">Pendente</span>
                                        <?php elseif ($tp['status'] === 'conflito'): ?>
                                            <span class="badge bg-danger">Conflito</span>
                                        <?php else: ?>
                                            <span class="badge bg-secondary">Liberado / Canc.</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($tp['status'] === 'pendente'): ?>
                                            <a href="index.php?action=pagamentos&pago_manualmente=<?= $tp['id'] ?>" class="btn btn-success btn-action text-white" onclick="return confirm('Confirmar pagamento manual de R$ <?= $tp['valor'] ?>?')">Dar Baixa</a>
                                            <a href="index.php?action=pagamentos&cancelando_pagamento=<?= $tp['id'] ?>" class="btn btn-outline-danger btn-action text-white">Cancelar</a>
                                        <?php elseif ($tp['status'] === 'conflito'): ?>
                                            <span class="text-danger small">Ajustar/Estornar</span>
                                        <?php else: ?>
                                            <span class="text-muted small">Sem Pendências</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <!-- PÁGINA: CENTRAL DE SORTEIO -->
            <?php elseif ($action === 'sorteio'): ?>
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-secondary">
                    <h1 class="h2 text-white fw-bold">Central de Sorteios</h1>
                </div>

                <div class="row g-4">
                    <div class="col-lg-6">
                        <div class="p-4 rounded border border-secondary" style="background:#1e293b;">
                            <h5 class="text-white fw-semibold mb-3">Realizar Extração de Vencedor</h5>
                            <form method="POST" action="index.php?action=sorteio">
                                <input type="hidden" name="realizar_sorteio" value="1">
                                <div class="mb-3">
                                    <label class="form-label">Selecione Rifa Ativa</label>
                                    <select name="rifa_id" class="form-select bg-dark text-white border-secondary" required>
                                        <?php foreach ($rifas as $ri): ?>
                                            <?php if ($ri['status'] === 'ativa'): ?>
                                                <option value="<?= $ri['id'] ?>"><?= htmlspecialchars($ri['titulo']) ?> (Unitário: R$ <?= $ri['valor_por_numero'] ?>)</option>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Método Sorteado</label>
                                    <select name="metodo" id="selectMetodo" class="form-select bg-dark text-white border-secondary" onchange="verificarFormSorteio()">
                                        <option value="federal">Loteria Federal (Automático com Fallback)</option>
                                        <option value="manual">Manual (Forçar número desejado)</option>
                                    </select>
                                </div>

                                <div class="mb-3 d-block" id="formFederal">
                                    <label class="form-label">Número do Primeiro Prêmio Federal</label>
                                    <input type="text" name="numero_federal" class="form-control bg-dark text-white border-secondary" placeholder="Ex: 85242">
                                    <div class="form-text text-muted small mt-1">O sistema extrairá os 3 últimos dígitos ("242"). Se não vendido, percorre crescentemente (243, 244...) até localizar um comprador!</div>
                                </div>

                                <div class="mb-3 d-none" id="formManual">
                                    <label class="form-label">Defina o Número Vencedor (000-999)</label>
                                    <input type="text" name="numero_sorteado" class="form-control bg-dark text-white border-secondary" placeholder="Ex: 042">
                                </div>

                                <button type="submit" class="btn btn-warning w-100 text-white fw-medium py-2">Calcular e Publicar Resultado</button>
                            </form>
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <div class="p-4 rounded border border-secondary" style="background:#1e293b;">
                            <h5 class="text-white fw-semibold mb-3">Sorteios Concluídos</h5>
                            <div class="table-responsive">
                                <table class="table table-custom text-white">
                                    <thead>
                                        <tr>
                                            <th>Rifa</th>
                                            <th>Dezena Ganhadora</th>
                                            <th>Ganhador</th>
                                            <th>Modo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($rifas as $rf): ?>
                                            <?php if ($rf['status'] === 'sorteada'): ?>
                                                <tr>
                                                    <td><?= htmlspecialchars($rf['titulo']) ?></td>
                                                    <td class="font-mono bg-dark px-2 rounded text-center table-active"><?= $rf['ganhador_numero'] ?></td>
                                                    <td>
                                                        <strong><?= htmlspecialchars($rf['ganhador_nome']) ?></strong><br>
                                                        <span class="small text-muted"><?= $rf['ganhador_telefone'] ?></span>
                                                    </td>
                                                    <td><span class="badge bg-info"><?= ucfirst($rf['metodo_sorteio']) ?></span></td>
                                                </tr>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    function verificarFormSorteio() {
                        const m = document.getElementById('selectMetodo').value;
                        if (m === 'federal') {
                            document.getElementById('formFederal').className = "mb-3 d-block";
                            document.getElementById('formManual').className = "mb-3 d-none";
                        } else {
                            document.getElementById('formFederal').className = "mb-3 d-none";
                            document.getElementById('formManual').className = "mb-3 d-block";
                        }
                    }
                </script>

            <!-- PÁGINA: RELATÓRIOS -->
            <?php elseif ($action === 'relatorios'): ?>
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-secondary">
                    <h1 class="h2 text-white fw-bold">Centro de Relatórios Financeiros</h1>
                </div>

                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="p-4 rounded border border-secondary h-100" style="background: #1e293b;">
                            <h5 class="text-white fw-bold mb-3">Exportações de Conveniência</h5>
                            <p class="text-muted small">Baixe planilhas CSV compatíveis com Office Excel e Google Planilhas estruturadas com tabelas do banco de dados.</p>
                            
                            <div class="d-grid gap-3">
                                <a href="index.php?action=export_csv&type=pagamentos" class="btn btn-success d-flex justify-content-between align-items-center py-3 px-4">
                                    <span><i class="fa-solid fa-file-csv me-2"></i> Relatório de Todos os Pagamentos</span>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </a>
                                <a href="index.php?action=export_csv&type=vendas_rifa" class="btn btn-primary d-flex justify-content-between align-items-center py-3 px-4">
                                    <span><i class="fa-solid fa-file-csv me-2"></i> Consolidação de Arrecadação por Rifa</span>
                                    <i class="fa-solid fa-chevron-right"></i>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="p-4 rounded border border-secondary h-100 text-white" style="background: #1e293b;">
                            <h5 class="fw-bold mb-3">Resumo Contábil por Sorteio</h5>
                            <div class="table-responsive">
                                <table class="table table-custom small">
                                    <thead>
                                        <tr>
                                            <th>Rifa</th>
                                            <th>Unitário</th>
                                            <th>Qtd Vendida</th>
                                            <th>Bruto Arrecadado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        $stmtRes = $db->query("
                                            SELECT r.titulo, r.valor_por_numero,
                                                   COUNT(CASE WHEN p.status = 'pago' THEN 1 END) as pagos
                                            FROM rifas r
                                            LEFT JOIN pagamentos p ON r.id = p.rifa_id
                                            GROUP BY r.id
                                        ")->fetchAll();
                                        foreach ($stmtRes as $sr) {
                                            $total = $sr['pagos'] * $sr['valor_por_numero'];
                                            echo "<tr>
                                                <td>" . htmlspecialchars($sr['titulo']) . "</td>
                                                <td>R$ " . number_format($sr['valor_por_numero'], 2, ',', '.') . "</td>
                                                <td>" . $sr['pagos'] . " cotas</td>
                                                <td class='text-success fw-bold'>R$ " . number_format($total, 2, ',', '.') . "</td>
                                            </tr>";
                                        }
                                        ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

        </main>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
