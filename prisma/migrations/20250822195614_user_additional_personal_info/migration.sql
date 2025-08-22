-- AlterTable
ALTER TABLE `user` ADD COLUMN `ageRange` ENUM('RANGE_19_24', 'RANGE_25_34', 'RANGE_35_44', 'RANGE_45_PLUS') NULL,
    ADD COLUMN `conversationType` ENUM('CASUAL', 'DEEP', 'LEARNING', 'SHARING_EXPERIENCES') NULL,
    ADD COLUMN `location` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Hobby` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Hobby_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_HobbyToUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_HobbyToUser_AB_unique`(`A`, `B`),
    INDEX `_HobbyToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_HobbyToUser` ADD CONSTRAINT `_HobbyToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Hobby`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_HobbyToUser` ADD CONSTRAINT `_HobbyToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
