import { Request, Response } from "express";
import * as RoomService from '../services/room.service';

export const getRooms = async (req: Request, res: Response) => {
    // Parse and validate query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1) {
        return res.status(400).json({ success: false, message: 'Los parámetros de paginación deben ser números positivos.' });
    }

    const paginatedData = await RoomService.getAllRooms(page, limit);
    res.status(200).json(paginatedData);
};