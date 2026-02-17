/*
  Warnings:

  - You are about to drop the column `accepted` on the `room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `room` DROP COLUMN `accepted`,
    ADD COLUMN `status` ENUM('IN_REVISION', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'IN_REVISION';
