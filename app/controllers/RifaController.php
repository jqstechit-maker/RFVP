<?php
/**
 * Controller de Rifas e Checkout (MVC)
 * Arquitetura PHP 8.2+ para AJAX Puro
 */

require_once __DIR__ . '/../models/Rifa.php';
require_once __DIR__ . '/../models/Pagamento.php';

class RifaController {
    
    /**
     * Endpoint: Carregar detalhes e grid da rifa (JSON)
     * Rota: GET?action=get_rifa&id=X
     */
    public function getRifa(int $id): void {
        header('Content-Type: application/json');
        
        $rifaModel = new Rifa();
        $rifa = $rifaModel->getById($id);

        if (!$rifa) {
            echo json_encode(['success' => false, 'message' => 'Rifa não encontrada']);
            return;
        }

        $mapa = $rifaModel->getMapaNumeros($id);
        $stats = $rifaModel->getStats($id);

        echo json_encode([
            'success' => true,
            'rifa' => $rifa,
            'mapa' => $mapa, // '256' => ['status' => 'pago', 'nome' => 'J***']
            'stats' => $stats
        ]);
    }

    /**
     * Endpoint: Registrar Checkout e Gerar PIX (JSON POST)
     * Rota: POST?action=checkout
     */
    public function checkout(): void {
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Método inválido']);
            return;
        }

        // Recuperar e validar parâmetros
        $dados = json_decode(file_get_contents('php://input'), true);

        if (empty($dados['rifa_id']) || empty($dados['numero']) || empty($dados['nome']) || empty($dados['telefone']) || empty($dados['cpf'])) {
            echo json_encode(['success' => false, 'message' => 'Preencha todos os campos obrigatórios.']);
            return;
        }

        $rifaId = (int)$dados['rifa_id'];
        $nInput = str_pad(preg_replace('/[^0-9]/', '', $dados['numero']), 3, '0', STR_PAD_LEFT);
        
        $rifaModel = new Rifa();
        $rifa = $rifaModel->getById($rifaId);
        if (!$rifa || $rifa['status'] !== 'ativa') {
            echo json_encode(['success' => false, 'message' => 'A rifa selecionada não está ativa para compra.']);
            return;
        }

        // Verificar se esse número já está permanentemente PAGO por alguém
        $mapa = $rifaModel->getMapaNumeros($rifaId);
        if (isset($mapa[$nInput]) && $mapa[$nInput]['status'] === 'pago') {
            echo json_encode(['success' => false, 'message' => 'Desculpe, este número (' . $nInput . ') acabou de ser comprado e pago por outro cliente. Escolha outro!']);
            return;
        }

        try {
            $pagamentoModel = new Pagamento();
            // 1. Obter ou Criar Cliente
            $clienteId = $pagamentoModel->obterOuCriarCliente([
                'nome' => trim(strip_tags($dados['nome'])),
                'telefone' => $dados['telefone'],
                'cpf' => $dados['cpf'],
                'email' => $dados['email'] ?? ''
            ]);

            // 2. Gerar Cobrança PIX
            $valorNumero = (float)$rifa['valor_por_numero'];
            $pixInfo = $pagamentoModel->criarCobrancaPix($rifaId, $clienteId, $nInput, $valorNumero);

            echo json_encode([
                'success' => true,
                'message' => 'Pix gerado com sucesso! Efetue o pagamento em até 5 minutos.',
                'pagamento_id' => $pixInfo['pagamento_id'],
                'txid' => $pixInfo['txid'],
                'qr_code_base64' => $pixInfo['qr_code'],
                'copia_cola' => $pixInfo['copia_cola'],
                'vencimento' => $pixInfo['vencimento'],
                'numero' => $nInput,
                'valor' => $valorNumero
            ]);

        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Ocorreu um erro interno ao processar a fatura PIX: ' . $e->getMessage()]);
        }
    }

    /**
     * Endpoint: Consultar status do pagamento (Polled de minuto a minuto ou por botão)
     * Rota: GET?action=verificar_pagamento&txid=X
     */
    public function verificarPagamento(string $txid): void {
        header('Content-Type: application/json');
        
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT status FROM pagamentos WHERE txid = :txid LIMIT 1");
        $stmt->execute([':txid' => $txid]);
        $pag = $stmt->fetch();

        if (!$pag) {
            echo json_encode(['success' => false, 'message' => 'Pagamento não encontrado.']);
            return;
        }

        echo json_encode([
            'success' => true,
            'status' => $pag['status'] // 'pendente' | 'pago' | 'conflito' | 'reembolsado'
        ]);
    }
}
