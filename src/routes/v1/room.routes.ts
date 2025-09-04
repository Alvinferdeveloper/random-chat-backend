import { Router } from "express";
import { getRooms } from "../../controllers/room.controller";
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getRooms));

export default router;