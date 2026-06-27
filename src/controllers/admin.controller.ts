import { Request, Response } from "express";
import * as RoomRepository from '../repositories/room.repository';
import * as UserRepository from '../repositories/user.repository';
import * as ReportRepository from '../repositories/report.repository';
import * as UserActivityRepository from '../repositories/user-room-activity.repository';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';
import { RoomStatus } from "@prisma/client";
import { ChatService } from "../services/chat/chat.service";
import { getTotalOnlineUsers, getTopActiveRooms } from '../services/room-active-users.service';

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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
        totalUsers,
        activeRooms,
        pendingRooms,
        onlineUsers,
        newUsersToday,
        pendingReports,
    ] = await Promise.all([
        UserRepository.countAll(),
        RoomRepository.countByStatus('ACCEPTED' as RoomStatus),
        RoomRepository.countByStatus('IN_REVISION' as RoomStatus),
        getTotalOnlineUsers(),
        UserRepository.countSince(startOfToday),
        ReportRepository.countPending(),
    ]);

    res.status(200).json({
        totalUsers,
        activeRooms,
        pendingRooms,
        onlineUsers,
        newUsersToday,
        pendingReports,
    });
};

/**
 * Retrieves top active rooms with live user counts.
 */
export const getActiveRooms = async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const rooms = await getTopActiveRooms(limit);

    const enrichedRooms = await Promise.all(
        rooms.map(async (room) => {
            const dbRoom = await RoomRepository.findByIdAnyStatus(room.roomId);
            return {
                id: room.roomId,
                name: dbRoom?.name || room.roomId,
                normalized_name: dbRoom?.normalized_name || room.roomId,
                short_description: dbRoom?.short_description || '',
                server_icon: dbRoom?.server_icon || null,
                userCount: room.count,
            };
        })
    );

    res.status(200).json({ rooms: enrichedRooms });
};

/**
 * Retrieves rooms by status (pending, accepted, rejected).
 */
export const getRoomsByStatus = async (req: Request, res: Response) => {
    const statusParam = (req.query.status as string) || 'IN_REVISION';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const validStatuses = ['IN_REVISION', 'ACCEPTED', 'REJECTED', 'ALL'];
    if (!validStatuses.includes(statusParam)) {
        throw new ApiError(400, ERROR_MESSAGES.INVALID_INPUT);
    }

    const dbStatus = statusParam === 'ALL' ? null : statusParam as 'IN_REVISION' | 'ACCEPTED' | 'REJECTED';
    const data = await RoomRepository.findAllByStatus(dbStatus, page, limit);
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
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const banned = req.query.banned as string | undefined;

    const data = await UserRepository.findAll(page, limit, search, role, banned);
    res.status(200).json(data);
};

/**
 * Updates a user's role.
 */
export const updateUserRole = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;

    // Safety: Admin cannot demote themselves
    if (req.user!.id === userId && role !== 'ADMIN') {
        throw new ApiError(400, "No puedes degradar tu propio rol de administrador.");
    }

    const updatedUser = await UserRepository.updateRole(userId, role);
    res.status(200).json({
        success: true,
        message: `Rol de usuario actualizado a ${role.toLowerCase()} correctamente.`,
        data: updatedUser
    });
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

/**
 * Retrieves detailed information about a specific user for the admin panel.
 */
export const getUserDetails = async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await UserRepository.findProfileById(userId);

    const [
        ownedRooms,
        recentActivity,
        reportsReceived,
        reportsMade,
    ] = await Promise.all([
        RoomRepository.findByOwnerId(userId),
        UserActivityRepository.getUserRecentActivity(userId, 10),
        ReportRepository.findByReportedUser(userId),
        ReportRepository.findByReporter(userId),
    ]);

    const roomIds = recentActivity.map(a => a.roomId);
    const activityRooms = roomIds.length > 0 ? await RoomRepository.findByIds(roomIds) : [];
    const activityWithRoom = recentActivity.map(a => ({
        ...a,
        room: activityRooms.find(r => r.id === a.roomId) || null,
    }));

    res.status(200).json({
        user,
        ownedRooms,
        recentActivity: activityWithRoom,
        reportsReceived,
        reportsMade,
    });
};
