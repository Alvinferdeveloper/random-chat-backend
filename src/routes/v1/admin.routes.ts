import { Router } from "express";
import {
    getRoomsByStatus,
    updateRoomStatus
} from "../../controllers/admin.controller";
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import { getRoomsByStatusSchema, updateRoomStatusSchema } from '../../validations/admin.validation';
import validateSession from "../../middlewares/validateSession";
import validateAdmin from "../../middlewares/validateAdmin";

const router = Router();

router.use(validateSession, validateAdmin);

router.get('/rooms', validate(getRoomsByStatusSchema), asyncHandler(getRoomsByStatus));

router.patch('/rooms/:roomId/status', validate(updateRoomStatusSchema), asyncHandler(updateRoomStatus));

export default router;
