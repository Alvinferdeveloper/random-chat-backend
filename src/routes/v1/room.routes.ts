import { Router } from "express";
import { getRooms, createRoom, generateRoomUploadUrl, updateRoom } from "../../controllers/room.controller";
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import { createRoomSchema, generateRoomUploadUrlSchema, updateRoomSchema } from '../../validations/room.validation';
import validateSession from "../../middlewares/validateSession";

const router = Router();

router.get('/', asyncHandler(getRooms));

// Protected route to create a new room
router.post(
    '/',
    validateSession,
    validate(createRoomSchema),
    asyncHandler(createRoom)
);

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