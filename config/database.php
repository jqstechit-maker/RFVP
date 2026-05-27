<?php
/**
 * Configuração de Conexão com o Banco de Dados MySQL (PDO)
 * Ideal para Hospedagem Compartilhada cPanel
 */

// Evitar acesso direto
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    header('HTTP/1.0 403 Forbidden');
    exit('Acesso restrito');
}

// Configurações do Banco de Dados
define('DB_HOST', 'localhost');
define('DB_NAME', 'nome_do_banco_rifas');
define('DB_USER', 'usuario_do_banco');
define('DB_PASS', 'senha_do_banco');
define('DB_PORT', '3306');

// Configurações Globais do Sistema
define('MERCADO_PAGO_TOKEN', 'APP_USR-SEU-ACCESS-TOKEN-AQUI'); // Token de Produção/Testes do Mercado Pago
define('TEMPO_EXPIRACAO_PIX', 300); // 5 Minutos em segundos para pagamento PIX
define('URL_SISTEMA', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST']);

class Database {
    private static ?PDO $connection = null;

    public static function getConnection(): PDO {
        if (self::$connection === null) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ];
                self::$connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Em produção, não exiba o erro completo para o usuário por segurança
                error_log("Erro de Conexão: " . $e->getMessage());
                header('HTTP/1.1 500 Internal Server Error');
                exit("Erro crítico: Não foi possível conectar ao banco de dados.");
            }
        }
        return self::$connection;
    }
}
