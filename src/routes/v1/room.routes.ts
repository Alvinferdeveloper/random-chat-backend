import { Router } from "express";
import { 
    getRooms, 
    createRoom, 
    generateRoomUploadUrl, 
    updateRoom, 
    getUserRooms,
    getUserFavoriteRooms,
    toggleFavoriteRoom,
    recordRoomActivity
} from "../../controllers/room.controller";
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import { 
    getRoomsSchema, 
    createRoomSchema, 
    generateRoomUploadUrlSchema, 
    updateRoomSchema 
} from '../../validations/room.validation';
import validateSession from "../../middlewares/validateSession";
import optionalSession from "../../middlewares/optionalSession";

const router = Router();

router.get('/', optionalSession, validate(getRoomsSchema), asyncHandler(getRooms));

// Protected route to get rooms owned by the user
router.get('/my-rooms', validateSession, asyncHandler(getUserRooms));

// Protected route to get user's favorite rooms
router.get('/favorites', validateSession, asyncHandler(getUserFavoriteRooms));

// Protected route to create a new room
router.post(
    '/',
    validateSession,
    validate(createRoomSchema),
    asyncHandler(createRoom)
);

// Protected route to toggle a room as favorite
router.post('/:roomId/favorite', validateSession, asyncHandler(toggleFavoriteRoom));

// Protected route to record user activity in a room
router.post('/:roomId/activity', validateSession, asyncHandler(recordRoomActivity));

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

export default router;
