-- -------------------------------------------------------------
-- SQL Database Schema for Rifa VIP Online System
-- Compatible with MySQL 5.7+ and MySQL 8.0+
-- Designed for shared cPanel hosting
-- -------------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-03:00";

--
-- Table structure for `admins`
--
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL, -- bcrypt hash
  `token_sessao` VARCHAR(255) DEFAULT NULL,
  `ultimo_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default administrator account
-- User: admin
-- Password (hashed with bcrypt): admin123
INSERT INTO `admins` (`nome`, `usuario`, `senha`) VALUES
('Administrador VIP', 'admin', '$2y$12$N9uYmCqF7DbeRk3Z8s5UpeO9.098mUeYwCOZ7L6zHqM8gbeOn6I3S')
ON DUPLICATE KEY UPDATE `id` = `id`;

--
-- Table structure for `rifas`
--
CREATE TABLE IF NOT EXISTS `rifas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `descricao` TEXT NOT NULL,
  `valor_por_numero` DECIMAL(10,2) NOT NULL,
  `data_sorteio` DATETIME NOT NULL,
  `imagem_url` VARCHAR(255) NOT NULL,
  `status` ENUM('ativa', 'inativa', 'sorteada') NOT NULL DEFAULT 'ativa',
  `total_numeros` INT NOT NULL DEFAULT 1000, -- max 1000 numbers (000 - 999)
  `ganhador_numero` VARCHAR(3) DEFAULT NULL,
  `ganhador_nome` VARCHAR(100) DEFAULT NULL,
  `ganhador_telefone` VARCHAR(20) DEFAULT NULL,
  `metodo_sorteio` ENUM('manual', 'federal') DEFAULT NULL,
  `numero_federal_original` VARCHAR(10) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert seed active raffles
INSERT INTO `rifas` (`titulo`, `descricao`, `valor_por_numero`, `data_sorteio`, `imagem_url`, `status`) VALUES
('iPhone 15 Pro Max 256GB Platinum', 'Sorteio de 1 iPhone 15 Pro Max lacrado, cor Titânio por apenas R$ 2,50 por número! Envio grátis para todo o Brasil.', 2.50, '2026-06-15 20:00:00', 'https://picsum.photos/seed/iphone15/800/600', 'ativa'),
('Playstation 5 Slim + 2 Controles DualSense', 'Participe do sorteio deste super setup gamer de Playstation 5 Slim, incluindo 2 controles originais e o jogo EA Sports FC 24.', 1.50, '2026-06-20 20:00:00', 'https://picsum.photos/seed/ps5/800/600', 'ativa'),
('PC Gamer Ryzen 7 + RTX 4070 Mastertech', 'Super máquina gamer equipada com AMD Ryzen 7, RTX 4070, 32GB RAM DDR5, SSD NVMe de 1TB e Watercooler RGB de alto desempenho.', 3.00, '2026-06-30 21:00:00', 'https://picsum.photos/seed/pcgamer/800/600', 'ativa'),
('Scooter Elétrica Watts WASC 3000w', 'Economia e agilidade na sua rotina diária com a belíssima Scooter Elétrica Watts 3000w. Não consome combustível, recarregável em qualquer tomada.', 5.00, '2026-07-10 20:30:00', 'https://picsum.photos/seed/scooter/800/600', 'ativa')
ON DUPLICATE KEY UPDATE `id` = `id`;

--
-- Table structure for `clientes`
--
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL,
  `telefone` VARCHAR(20) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cpf` (`cpf`),
  INDEX `idx_telefone` (`telefone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for `pagamentos`
--
CREATE TABLE IF NOT EXISTS `pagamentos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rifa_id` INT NOT NULL,
  `cliente_id` INT NOT NULL,
  `numero` VARCHAR(3) NOT NULL, -- single ticket number like "042" or "999"
  `txid` VARCHAR(100) NOT NULL UNIQUE, -- unique Mercado Pago / Asaas transaction ID
  `valor` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pendente', 'pago', 'conflito', 'reembolsado') NOT NULL DEFAULT 'pendente',
  `pix_qr_code` TEXT,
  `pix_copia_cola` TEXT,
  `vencimento` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `pagado_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`rifa_id`) REFERENCES `rifas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `idx_rifa_numero_pago` (`rifa_id`, `numero`, `status`), -- prevents same number from being "pago" twice, though status list allows duplicates for different entries if some are "conflito". We enforce logic in locks.
  INDEX `idx_txid` (`txid`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for `sorteios`
--
CREATE TABLE IF NOT EXISTS `sorteios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rifa_id` INT NOT NULL UNIQUE,
  `numero_sorteado` VARCHAR(3) NOT NULL,
  `cliente_id` INT NOT NULL,
  `metodo` ENUM('manual', 'federal') NOT NULL,
  `numero_federal` VARCHAR(10) DEFAULT NULL,
  `data_sorteio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rifa_id`) REFERENCES `rifas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for `logs`
--
CREATE TABLE IF NOT EXISTS `logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo` ENUM('sucesso', 'info', 'erro', 'alerta') NOT NULL DEFAULT 'info',
  `mensagem` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automatically seeding initial log
INSERT INTO `logs` (`tipo`, `mensagem`) VALUES 
('info', 'Banco de dados de Rifas VIP inicializado com sucesso.');

COMMIT;
