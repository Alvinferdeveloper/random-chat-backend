-- CreateTable
CREATE TABLE `Room` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(45) NOT NULL,
    `short_description` VARCHAR(45) NOT NULL,
    `full_description` VARCHAR(300) NOT NULL,
    `icon` VARCHAR(200) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
