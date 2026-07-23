import { Router } from "express";
import {
    getRooms,
    createRoom,
    generateRoomUploadUrl,
    updateRoom,
    getUserRooms,
    getUserFavoriteRooms,
    toggleFavoriteRoom,
    recordRoomActivity,
    deleteRoom,
    updateRoomCategories
} from "../../controllers/room.controller";
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import { createRoomLimiter, listLimiter } from '@/config/rateLimiters';
import {
    getRoomsSchema,
    createRoomSchema,
    generateRoomUploadUrlSchema,
    updateRoomSchema,
    toggleFavoriteRoomSchema,
    recordRoomActivitySchema,
    getUserFavoriteRoomsSchema,
    getUserRoomsSchema,
    deleteRoomSchema,
    updateRoomCategoriesSchema
} from '../../validations/room.validation';
import validateSession from "../../middlewares/validateSession";
import optionalSession from "../../middlewares/optionalSession";
import { ChatService } from "../../services/chat/chat.service";

export default (chatService: ChatService) => {
    const router = Router();

    router.get('/', optionalSession, listLimiter, validate(getRoomsSchema), asyncHandler(getRooms));

    // Protected route to get rooms owned by the user
    router.get('/my-rooms', validateSession, validate(getUserRoomsSchema), asyncHandler(getUserRooms));

    // Protected route to get user's favorite rooms
    router.get('/favorites', validateSession, validate(getUserFavoriteRoomsSchema), asyncHandler(getUserFavoriteRooms));

    // Protected route to create a new room
    router.post(
        '/',
        validateSession,
        createRoomLimiter,
        validate(createRoomSchema),
        asyncHandler(createRoom(chatService))
    );

    // Protected route to toggle a room as favorite
    router.post('/:roomId/favorite', validateSession, validate(toggleFavoriteRoomSchema), asyncHandler(toggleFavoriteRoom));

    // Protected route to record user activity in a room
    router.post('/:roomId/activity', validateSession, validate(recordRoomActivitySchema), asyncHandler(recordRoomActivity));

    // Protected route to generate a pre-signed URL for a room's image
    router.post(
        '/:roomId/generate-upload-url',
        validateSession,
        validate(generateRoomUploadUrlSchema),
        asyncHandler(generateRoomUploadUrl)
    );

    // Protected route to update a room's attributes (e.g., banner/icon URL)
    router.patch(
        '/:roomId',
        validateSession,
        validate(updateRoomSchema),
        asyncHandler(updateRoom)
    );

    // Protected route to update a room's categories
    router.patch(
        '/:roomId/categories',
        validateSession,
        validate(updateRoomCategoriesSchema),
        asyncHandler(updateRoomCategories)
    );

    // Protected route to soft delete a room (owner only)
    router.delete(
        '/:roomId',
        validateSession,
        validate(deleteRoomSchema),
        asyncHandler(deleteRoom)
    );

    return router;
};
