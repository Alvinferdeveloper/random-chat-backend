import { Request, Response } from "express";
import * as RoomService from '../services/room.service';

export const getRooms = async (_req: Request, res: Response) => {
    const rooms = await RoomService.getAllRooms();
    res.status(200).json({ success: true, data: rooms });
};
