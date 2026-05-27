-- -------------------------------------------------------------
-- BANCO DE DADOS DE PRODUÇÃO COMPATÍVEL COM PHP 8.2+ E MySQL
-- -------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `rifa_vip_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `rifa_vip_db`;

-- 1. Tabela Admins (Autenticação BCrypt segura)
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir admin inicial padrão (admin / admin123 hashed with bcrypt)
INSERT INTO `admins` (`usuario`, `senha_hash`, `email`) 
VALUES ('admin', '$2y$10$UoE3S/6/fByHInsh2X5R8On8xW.Hre9DsrQpG0Qit/8zNlJz0eIqa', 'admin@vipsorteios.com')
ON DUPLICATE KEY UPDATE `usuario`=`usuario`;

-- 2. Tabela Configurações da Plataforma (Alteráveis no painel)
CREATE TABLE IF NOT EXISTS `configuracoes` (
  `chave` VARCHAR(100) PRIMARY KEY,
  `valor` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `configuracoes` (`chave`, `valor`) VALUES
('nome_plataforma', 'Rifa VIP'),
('logo_texto', 'RV'),
('banner_titulo', 'Concorra aos Melhores premios'),
('banner_subtitulo', 'Escolha dezenas da sua sorte no grid! Processador de pagamentos certificado com baixa instantânea e regulamento auditado em conformidade total.'),
('cor_primaria', 'emerald'),
('whatsapp_suporte', '5511999999999'),
('instagram', 'https://instagram.com/rifavip'),
('facebook', 'https://facebook.com/rifavip'),
('textos_institucionais', 'A Rifa VIP nasceu com a missão de transformar o cenário de campanhas promocionais de sorteios no Brasil, trazendo tecnologia de ponta, processos auditáveis e transparência impecável de ponta a ponta.'),
('favicon_url', '⚡')
ON DUPLICATE KEY UPDATE `chave`=`chave`;

-- 3. Tabela de Rifas (Campanhas de Sorteios, limite 10 ativas)
CREATE TABLE IF NOT EXISTS `rifas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `descricao` TEXT NOT NULL,
  `valor_por_numero` DECIMAL(10, 2) NOT NULL,
  `data_sorteio` DATETIME NOT NULL,
  `quantidade_numeros` INT NOT NULL DEFAULT 1000,
  `imagem_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('ativa', 'inativa', 'sorteada') NOT NULL DEFAULT 'ativa',
  `ganhador_numero` VARCHAR(10) DEFAULT NULL,
  `ganhador_nome` VARCHAR(255) DEFAULT NULL,
  `ganhador_telefone` VARCHAR(50) DEFAULT NULL,
  `metodo_sorteio` ENUM('manual', 'federal') DEFAULT NULL,
  `numero_federal_original` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabela de Clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` VARCHAR(50) PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `telefone` VARCHAR(50) NOT NULL,
  `cpf` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabela de Pagamentos / Transações (Regras de baixa & Unicidade)
CREATE TABLE IF NOT EXISTS `pagamentos` (
  `id` VARCHAR(50) PRIMARY KEY,
  `rifa_id` INT NOT NULL,
  `cliente_id` VARCHAR(50) NOT NULL,
  `numero` VARCHAR(10) NOT NULL,
  `txid` VARCHAR(100) NOT NULL UNIQUE,
  `valor` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pendente', 'pago', 'conflito', 'reembolsado') NOT NULL DEFAULT 'pendente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `pagado_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE,
  -- Adiciona índice composto para busca ultra-rápida e prevenção de duplicidade
  UNIQUE KEY `idx_rifa_numero_pago` (`rifa_id`, `numero`, `status`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabela de Sorteios Concluidos
CREATE TABLE IF NOT EXISTS `sorteos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rifa_id` INT NOT NULL,
  `numero_vencedor` VARCHAR(10) NOT NULL,
  `ganhador_cliente_id` VARCHAR(50) NOT NULL,
  `metodo` ENUM('manual', 'federal') NOT NULL,
  `numero_federal` VARCHAR(50) DEFAULT NULL,
  `data_realizacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rifa_id`) REFERENCES `rifas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS `logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo` ENUM('sucesso', 'info', 'erro', 'alerta') NOT NULL,
  `mensagem` TEXT NOT NULL,
  `data_hora` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
