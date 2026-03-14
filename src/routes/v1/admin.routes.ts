import { Router } from "express";
import {
    getRoomsByStatus,
    updateRoomStatus
} from "../../controllers/admin.controller";
import { asyncHandler } from '../../utils/asyncHandler';
import validateSession from "../../middlewares/validateSession";
import validateAdmin from "../../middlewares/validateAdmin";

const router = Router();

// Apply session and admin validation to all routes in this file
router.use(validateSession, validateAdmin);

// Route to get rooms filtered by status (default IN_REVISION)
router.get('/rooms', asyncHandler(getRoomsByStatus));

// Route to update a room's status
router.patch('/rooms/:roomId/status', asyncHandler(updateRoomStatus));

export default router;
