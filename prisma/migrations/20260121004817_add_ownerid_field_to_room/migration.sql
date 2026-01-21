/*
  Warnings:

  - A unique constraint covering the columns `[normalized_name]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `room` ADD COLUMN `ownerId` CHAR(36) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Room_normalized_name_key` ON `Room`(`normalized_name`);

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
