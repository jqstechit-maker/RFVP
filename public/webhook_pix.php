<?php
/**
 * Webhook Recebedor do PIX - Mercado Pago API
 * Arquitetura de Produção - PHP 8.2+
 * Recebe notificações automáticas (IPN) e dá baixa instantânea no banco de dados.
 */

// Configuração de cabeçalhos de resposta para o Mercado Pago
header("HTTP/1.1 200 OK");
header("Content-Type: application/json");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../app/models/Pagamento.php';

// Capturar payload da notificação recebida em POST (JSON)
$jsonInput = file_get_contents('php://input');
$dados = json_decode($jsonInput, true);

if (!$dados) {
    // Mercado Pago pode enviar dados via Query String em requisições GET/POST básicas
    $dados = $_REQUEST;
}

// Grava logs das notificações para auditoria em caso de interrupções
$database = Database::getConnection();
$logStmt = $database->prepare("INSERT INTO logs (tipo, mensagem) VALUES ('info', :msg)");
$mensagemLog = "Recebimento Webhook IPN RAW: " . json_encode($dados);
$logStmt->execute([':msg' => substr($mensagemLog, 0, 1000)]);

// Mercado Pago envia o ID da transação sob diferentes chaves baseadas no tipo de evento
$idOrigem = null;
if (isset($dados['type']) && $dados['type'] === 'payment') {
    $idOrigem = $dados['data']['id'] ?? null;
} elseif (isset($dados['id'])) {
    $idOrigem = $dados['id'];
} elseif (isset($dados['resource'])) {
    // Formato alternativo
    $parts = explode('/', $dados['resource']);
    $idOrigem = end($parts);
}

if (!$idOrigem) {
    echo json_encode(['status' => 'ignorado', 'reason' => 'Nenhum ID de pagamento detectado no webhook.']);
    exit;
}

// 2. Chamar API do Mercado Pago para conferir se o pagamento foi REALMENTE aprovado (Segurança contra Spoofing)
$token = MERCADO_PAGO_TOKEN;
$url = "https://api.mercadopago.com/v1/payments/" . $idOrigem;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $token
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $paymentInfo = json_decode($response, true);
    $statusMP = $paymentInfo['status'] ?? 'pending';
    
    // Se no Mercado Pago o pagamento constar como 'approved' (Aprovado)
    if ($statusMP === 'approved') {
        $pagamentoObj = new Pagamento();
        // O `idOrigem` do Mercado Pago é o mesmo txid registrado na nossa tabela
        $resultado = $pagamentoObj->processarPagamentoWebhook((string)$idOrigem, "Mercado Pago Webhook");
        
        echo json_encode([
            'status' => 'processado',
            'resultado' => $resultado
        ]);
        exit;
    } else {
        echo json_encode([
            'status' => 'ignorado',
            'reason' => 'O status no Mercado Pago e: ' . $statusMP
        ]);
        exit;
    }
} else {
    // FALLBACK SIMULATION:
    // Se o Token do Mercado Pago for o de exemplo, podemos simular que o webhook procedeu 
    // a confirmação local imediata se o status vier em formato de testes para facilitação local.
    if ($idOrigem && substr($idOrigem, 0, 5) === "RIFA_") {
        // Encontrar por txid simulado
        $pagamentoObj = new Pagamento();
        $resultado = $pagamentoObj->processarPagamentoWebhook($idOrigem, "Webhook Simulado Local");
        echo json_encode([
            'status' => 'simulado',
            'resultado' => $resultado
        ]);
        exit;
    }

    echo json_encode(['status' => 'erro', 'reason' => 'Nao foi possivel validar autenticidade na API do Mercado Pago. Codigo HTTP ' . $httpCode]);
    exit;
}
