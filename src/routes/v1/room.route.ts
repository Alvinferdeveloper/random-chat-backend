import { Router } from "express";
const router = Router();
import { getRooms } from "../../controllers/room.controller";

router.get('/getRooms',getRooms);

export default router;