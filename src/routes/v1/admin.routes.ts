import { Router } from "express";
import {
    getRoomsByStatus,
    updateRoomStatus,
    getUsers,
    updateUserBanStatus,
    getStats,
    sendBroadcast,
    updateUserRole
} from "../../controllers/admin.controller";
import { getAllSettings, updateSetting } from "../../controllers/setting.controller";
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import {
    getRoomsByStatusSchema,
    updateRoomStatusSchema,
    getUsersSchema,
    updateUserBanStatusSchema,
    updateUserRoleSchema
} from '../../validations/admin.validation';
import { updateSettingSchema } from '../../validations/setting.validation';
import validateSession from "../../middlewares/validateSession";
import validateAdmin from "../../middlewares/validateAdmin";
import { ChatService } from "../../services/chat/chat.service";

export default (chatService: ChatService) => {
    const router = Router();

    router.use(validateSession, validateAdmin);

    router.get('/stats', asyncHandler(getStats));

    router.post('/broadcast', asyncHandler(sendBroadcast(chatService)));

    router.get('/rooms', validate(getRoomsByStatusSchema), asyncHandler(getRoomsByStatus));
    router.patch('/rooms/:roomId/status', validate(updateRoomStatusSchema), asyncHandler(updateRoomStatus));

    router.get('/users', validate(getUsersSchema), asyncHandler(getUsers));
    router.patch('/users/:userId/ban', validate(updateUserBanStatusSchema), asyncHandler(updateUserBanStatus));
    router.patch('/users/:userId/role', validate(updateUserRoleSchema), asyncHandler(updateUserRole));

    // Global settings
    router.get('/settings', asyncHandler(getAllSettings));
    router.patch('/settings/:key', validate(updateSettingSchema), asyncHandler(updateSetting));

    return router;
};

