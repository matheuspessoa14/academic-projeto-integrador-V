-- CreateTable
CREATE TABLE `prontuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente` VARCHAR(150) NOT NULL,
    `medico` VARCHAR(150) NOT NULL,
    `data` DATE NOT NULL,
    `tipo` VARCHAR(100) NOT NULL,
    `observacoes` TEXT NOT NULL,
    `status` ENUM('EM_ANALISE', 'FINALIZADO') NOT NULL DEFAULT 'EM_ANALISE',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
