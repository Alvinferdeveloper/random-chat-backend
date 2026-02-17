-- AlterTable
ALTER TABLE `room` ADD COLUMN `accepted` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `deletedAt` DATETIME(3) NULL;
