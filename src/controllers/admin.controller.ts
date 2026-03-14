import { Request, Response } from "express";
import * as RoomRepository from '../repositories/room.repository';
import ApiError from '../utils/ApiError';

/**
 * Retrieves rooms by status (pending, accepted, rejected).
 */
export const getRoomsByStatus = async (req: Request, res: Response) => {
    const status = (req.query.status as any) || 'IN_REVISION';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const validStatuses = ['IN_REVISION', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Estado de sala no válido.');
    }

    const data = await RoomRepository.findAllByStatus(status, page, limit);
    res.status(200).json(data);
};

/**
 * Updates a room's status.
 */
export const updateRoomStatus = async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { status } = req.body;

    const validStatuses = ['IN_REVISION', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Estado de sala no válido.');
    }

    const updatedRoom = await RoomRepository.updateStatus(roomId, status);
    res.status(200).json({
        success: true,
        message: `Sala ${status.toLowerCase()} correctamente.`,
        data: updatedRoom
    });
};
