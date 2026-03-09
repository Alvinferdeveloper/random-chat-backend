-- CreateTable
CREATE TABLE `user_room_activity` (
    `userId` CHAR(36) NOT NULL,
    `roomId` CHAR(36) NOT NULL,
    `lastInteraction` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `interactionCount` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `user_room_activity_userId_roomId_key`(`userId`, `roomId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_room_activity` ADD CONSTRAINT `user_room_activity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_room_activity` ADD CONSTRAINT `user_room_activity_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
