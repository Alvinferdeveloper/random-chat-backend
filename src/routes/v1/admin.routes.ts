import { Router } from "express";
import {
    getRoomsByStatus,
    updateRoomStatus,
    updateRoomCategories,
    getUsers,
    updateUserBanStatus,
    getStats,
    sendBroadcast,
    updateUserRole,
    getActiveRooms,
    getUserDetails,
    getAuditLog
} from "../../controllers/admin.controller";
import { getAllSettings, updateSetting } from "../../controllers/setting.controller";
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import {
    getRoomsByStatusSchema,
    updateRoomStatusSchema,
    updateRoomCategoriesSchema,
    getUsersSchema,
    updateUserBanStatusSchema,
    updateUserRoleSchema,
    getAuditLogSchema
} from '../../validations/admin.validation';
import { updateSettingSchema } from '../../validations/setting.validation';
import validateSession from "../../middlewares/validateSession";
import validateAdmin from "../../middlewares/validateAdmin";
import { ChatService } from "../../services/chat/chat.service";

export default (chatService: ChatService) => {
    const router = Router();

    router.use(validateSession, validateAdmin);

    router.get('/stats', asyncHandler(getStats));
    router.get('/rooms/active', asyncHandler(getActiveRooms));

    router.post('/broadcast', asyncHandler(sendBroadcast(chatService)));

    router.get('/rooms', validate(getRoomsByStatusSchema), asyncHandler(getRoomsByStatus));
    router.patch('/rooms/:roomId/status', validate(updateRoomStatusSchema), asyncHandler(updateRoomStatus));
    router.patch('/rooms/:roomId/categories', validate(updateRoomCategoriesSchema), asyncHandler(updateRoomCategories));

    router.get('/users', validate(getUsersSchema), asyncHandler(getUsers));
    router.get('/users/:userId/details', asyncHandler(getUserDetails));
    router.patch('/users/:userId/ban', validate(updateUserBanStatusSchema), asyncHandler(updateUserBanStatus));
    router.patch('/users/:userId/role', validate(updateUserRoleSchema), asyncHandler(updateUserRole));

    // Global settings
    router.get('/settings', asyncHandler(getAllSettings));
    router.patch('/settings/:key', validate(updateSettingSchema), asyncHandler(updateSetting));

    router.get('/audit-log', validate(getAuditLogSchema), asyncHandler(getAuditLog));

    return router;
};

