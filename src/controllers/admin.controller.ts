import { Request, Response } from "express";
import * as RoomRepository from '../repositories/room.repository';
import * as UserRepository from '../repositories/user.repository';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';
import { RoomStatus } from "@prisma/client";
import { ChatService } from "../services/chat/chat.service";

/**
 * Sends a global system message to all connected users.
 */
export const sendBroadcast = (chatService: ChatService) => async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
        throw new ApiError(400, "El mensaje no puede estar vacío.");
    }

    chatService.broadcastGlobalMessage(message);

    res.status(200).json({
        success: true,
        message: "Mensaje global enviado correctamente."
    });
};

/**
 * Retrieves general platform statistics.
 */
export const getStats = async (req: Request, res: Response) => {
    const [totalUsers, activeRooms, pendingRooms] = await Promise.all([
        UserRepository.countAll(),
        RoomRepository.countByStatus('ACCEPTED' as RoomStatus),
        RoomRepository.countByStatus('IN_REVISION' as RoomStatus),
    ]);

    res.status(200).json({
        totalUsers,
        activeRooms,
        pendingRooms,
    });
};

/**
 * Retrieves rooms by status (pending, accepted, rejected).
 */
export const getRoomsByStatus = async (req: Request, res: Response) => {
    const status = (req.query.status as any) || 'IN_REVISION';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const validStatuses = ['IN_REVISION', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, ERROR_MESSAGES.INVALID_INPUT);
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
        throw new ApiError(400, ERROR_MESSAGES.INVALID_INPUT);
    }

    const updatedRoom = await RoomRepository.updateStatus(roomId, status);
    res.status(200).json({
        success: true,
        message: `Sala ${status.toLowerCase()} correctamente.`,
        data: updatedRoom
    });
};

/**
 * Retrieves all users with pagination and search.
 */
export const getUsers = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const data = await UserRepository.findAll(page, limit, search);
    res.status(200).json(data);
};

/**
 * Updates a user's ban status.
 */
export const updateUserBanStatus = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { isBanned, banReason } = req.body;

    const updatedUser = await UserRepository.updateBanStatus(userId, isBanned, banReason);
    res.status(200).json({
        success: true,
        message: `Usuario ${isBanned ? 'baneado' : 'desbaneado'} correctamente.`,
        data: updatedUser
    });
};
