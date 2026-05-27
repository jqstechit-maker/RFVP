<?php
/**
 * Model Rifa
 * Arquitetura MVC - PHP 8.2+
 */

require_once __DIR__ . '/../../config/database.php';

class Rifa {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Retorna as rifas ativas (máximo de 4 simultâneas no sistema)
     */
    public function getAtivas(int $limit = 4): array {
        $stmt = $this->db->prepare("SELECT * FROM rifas WHERE status != 'inativa' ORDER BY id DESC LIMIT :limit");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Retorna uma rifa por ID
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM rifas WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result ? $result : null;
    }

    /**
     * Cria uma nova rifa
     */
    public function criar(array $dados): bool {
        $stmt = $this->db->prepare("
            INSERT INTO rifas (titulo, descricao, valor_por_numero, data_sorteio, imagem_url, status, total_numeros) 
            VALUES (:titulo, :descricao, :valor, :data_sorteio, :imagem, :status, :total_numeros)
        ");
        return $stmt->execute([
            ':titulo' => $dados['titulo'],
            ':descricao' => $dados['descricao'],
            ':valor' => $dados['valor_por_numero'],
            ':data_sorteio' => $dados['data_sorteio'],
            ':imagem' => $dados['imagem_url'],
            ':status' => $dados['status'] ?? 'ativa',
            ':total_numeros' => $dados['total_numeros'] ?? 1000
        ]);
    }

    /**
     * Atualiza uma nova rifa
     */
    public function atualizar(int $id, array $dados): bool {
        $stmt = $this->db->prepare("
            UPDATE rifas 
            SET titulo = :titulo, descricao = :descricao, valor_por_numero = :valor, 
                data_sorteio = :data_sorteio, imagem_url = :imagem, status = :status
            WHERE id = :id
        ");
        return $stmt->execute([
            ':id' => $id,
            ':titulo' => $dados['titulo'],
            ':descricao' => $dados['descricao'],
            ':valor' => $dados['valor_por_numero'],
            ':data_sorteio' => $dados['data_sorteio'],
            ':imagem' => $dados['imagem_url'],
            ':status' => $dados['status']
        ]);
    }

    /**
     * Exclui uma rifa
     */
    public function excluir(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM rifas WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Retorna o status de cada um dos 1000 números da rifa (000-999)
     * Retorna mapeamento: '042' => ['status' => 'pago', 'nome' => 'João']
     */
    public function getMapaNumeros(int $rifaId): array {
        // Obter os pagamentos não cancelados para esta rifa
        $stmt = $this->db->prepare("
            SELECT p.numero, p.status, c.nome, c.telefone 
            FROM pagamentos p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.rifa_id = :rifa_id AND p.status IN ('pago', 'pendente', 'conflito')
        ");
        $stmt->execute([':rifa_id' => $rifaId]);
        $vendas = $stmt->fetchAll();

        // Mapear números vendidos/pendentes
        $mapa = [];
        foreach ($vendas as $venda) {
            $num = str_pad($venda['numero'], 3, '0', STR_PAD_LEFT);
            // Se houver múltiplos registros (ex: conflitos), priorizar 'pago'
            if (!isset($mapa[$num]) || $venda['status'] === 'pago') {
                $mapa[$num] = [
                    'status' => $venda['status'],
                    'nome' => $venda['nome'],
                    'telefone' => substr($venda['telefone'], 0, -4) . '****' // Máscara de segurança
                ];
            }
        }
        return $mapa;
    }

    /**
     * Estatísticas de números de uma rifa
     */
    public function getStats(int $rifaId): array {
        $stmt = $this->db->prepare("
            SELECT status, COUNT(*) as quant 
            FROM pagamentos 
            WHERE rifa_id = :rifa_id 
            GROUP BY status
        ");
        $stmt->execute([':rifa_id' => $rifaId]);
        $rows = $stmt->fetchAll();

        $stats = ['pago' => 0, 'pendente' => 0, 'disponivel' => 1000, 'conflito' => 0];
        foreach ($rows as $row) {
            if (isset($stats[$row['status']])) {
                $stats[$row['status']] = (int)$row['quant'];
            }
        }
        $stats['disponivel'] = max(0, 1000 - $stats['pago'] - $stats['pendente']);
        $stats['porcentagem'] = round(($stats['pago'] / 1000) * 100, 1);
        return $stats;
    }

    /**
     * Processa sorteio no modo Federal
     * Algoritmo: Pega os 3 últimos dígitos da extração informada.
     * Se o número correspondente estiver vendido (PAGO), este é o vencedor.
     * Caso contrário, busca o próximo número vendido superior em ordem crescente. Ex: 042 -> 043 -> 044...999 -> 000 -> 001.
     */
    public function sortearFederal(int $rifaId, string $numeroFederal): array {
        // Extrair os 3 últimos números
        $numeroSorteado = substr(preg_replace('/[^0-9]/', '', $numeroFederal), -3);
        $numeroSorteado = str_pad($numeroSorteado, 3, '0', STR_PAD_LEFT);

        // Obter todas as dezenas pagas para verificar a concorrência
        $stmt = $this->db->prepare("
            SELECT p.numero, c.nome, c.telefone, c.id as cliente_id
            FROM pagamentos p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.rifa_id = :rifa_id AND p.status = 'pago'
            ORDER BY p.numero ASC
        ");
        $stmt->execute([':rifa_id' => $rifaId]);
        $pagos = $stmt->fetchAll();

        if (empty($pagos)) {
            throw new Exception("Não é possível realizar o sorteio: Nenhuma cota foi paga nesta rifa.");
        }

        // Mapear números pagos
        $vendasMap = [];
        foreach ($pagos as $p) {
            $vendasMap[$p['numero']] = $p;
        }

        // Aplicar fallback se não encontrar o número exato
        $ganhador = null;
        $numGols = (int)$numeroSorteado;

        // Tentar encontrar começando do sorteado (ex: 042) até 999, depois dar a volta até 999
        for ($i = 0; $i < 1000; $i++) {
            $procurado = str_pad(($numGols + $i) % 1000, 3, '0', STR_PAD_LEFT);
            if (isset($vendasMap[$procurado])) {
                $ganhador = $vendasMap[$procurado];
                $ganhador['numero_vencedor'] = $procurado;
                break;
            }
        }

        if (!$ganhador) {
            throw new Exception("Inconsistência de algoritmo: Ganhador não localizado.");
        }

        // Registrar ganhador na tabela
        $this->definirGanhador($rifaId, [
            'numero' => $ganhador['numero_vencedor'],
            'nome' => $ganhador['nome'],
            'telefone' => $ganhador['telefone'],
            'metodo' => 'federal',
            'numero_federal' => $numeroFederal,
            'cliente_id' => $ganhador['cliente_id']
        ]);

        return $ganhador;
    }

    /**
     * Sorteio Manual de número da Rifa
     */
    public function sortearManual(int $rifaId, string $numeroSorteado): array {
        $numeroSorteado = str_pad(preg_replace('/[^0-9]/', '', $numeroSorteado), 3, '0', STR_PAD_LEFT);

        // Verificar quem comprou e pagou
        $stmt = $this->db->prepare("
            SELECT p.numero, c.nome, c.telefone, c.id as cliente_id
            FROM pagamentos p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.rifa_id = :rifa_id AND p.numero = :numero AND p.status = 'pago'
        ");
        $stmt->execute([
            ':rifa_id' => $rifaId,
            ':numero' => $numeroSorteado
        ]);
        $ganhador = $stmt->fetch();

        if (!$ganhador) {
            throw new Exception("O número informado ($numeroSorteado) não foi vendido (pago) até o momento.");
        }

        $dadosGanhador = [
            'numero' => $numeroSorteado,
            'nome' => $ganhador['nome'],
            'telefone' => $ganhador['telefone'],
            'metodo' => 'manual',
            'numero_federal' => null,
            'cliente_id' => $ganhador['cliente_id']
        ];

        $this->definirGanhador($rifaId, $dadosGanhador);
        return $dadosGanhador;
    }

    /**
     * Escreve o ganhador e insere logs de sorteio
     */
    private function definirGanhador(int $rifaId, array $dados): void {
        $this->db->beginTransaction();
        try {
            // Atualiza status da rifa
            $stmt = $this->db->prepare("
                UPDATE rifas 
                SET status = 'sorteada', ganhador_numero = :numero, 
                    ganhador_nome = :nome, ganhador_telefone = :telefone,
                    metodo_sorteio = :metodo, numero_federal_original = :num_fed
                WHERE id = :rifa_id
            ");
            $stmt->execute([
                ':rifa_id' => $rifaId,
                ':numero' => $dados['numero'],
                ':nome' => $dados['nome'],
                ':telefone' => $dados['telefone'],
                ':metodo' => $dados['metodo'],
                ':num_fed' => $dados['numero_federal']
            ]);

            // Grava sorteio
            $stmtSorteio = $this->db->prepare("
                INSERT INTO sorteios (rifa_id, numero_sorteado, cliente_id, metodo, numero_federal)
                VALUES (:rifa_id, :numero, :cliente_id, :metodo, :num_fed)
            ");
            $stmtSorteio->execute([
                ':rifa_id' => $rifaId,
                ':numero' => $dados['numero'],
                ':cliente_id' => $dados['cliente_id'],
                ':metodo' => $dados['metodo'],
                ':num_fed' => $dados['numero_federal']
            ]);

            // Escreve log técnico
            $stmtLog = $this->db->prepare("
                INSERT INTO logs (tipo, mensagem) 
                VALUES ('sucesso', :mensagem)
            ");
            $descGanhador = "Rifa ID {$rifaId} sorteada! Ganhador: " . $dados['nome'] . " com o número " . $dados['numero'] . " (Método: " . $dados['metodo'] . ")";
            $stmtLog->execute([':mensagem' => $descGanhador]);

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
