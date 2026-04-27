-- CreateIndex
CREATE INDEX `Room_deletedAt_status_idx` ON `Room`(`deletedAt`, `status`);

-- CreateIndex
CREATE INDEX `Room_status_deletedAt_created_at_idx` ON `Room`(`status`, `deletedAt`, `created_at`);

-- CreateIndex
CREATE INDEX `Room_normalized_name_idx` ON `Room`(`normalized_name`);

-- CreateIndex
CREATE INDEX `Room_created_at_idx` ON `Room`(`created_at`);

-- CreateIndex
CREATE INDEX `user_room_activity_userId_lastInteraction_idx` ON `user_room_activity`(`userId`, `lastInteraction`);

-- CreateIndex
CREATE INDEX `user_room_activity_roomId_lastInteraction_idx` ON `user_room_activity`(`roomId`, `lastInteraction`);
