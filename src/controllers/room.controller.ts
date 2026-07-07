import { Request, Response } from "express";
import * as RoomService from '../services/room.service';
import { ChatService } from '../services/chat/chat.service';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';

export const getRooms = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;
    const userId = req.user?.id;

    RoomService.validateRoomListParams(page, limit);

    const paginatedData = await RoomService.getAllRooms(page, limit, search, userId, category);
    res.status(200).json(paginatedData);
};

export const createRoom = (chatService: ChatService) => async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const roomData = req.body;
    const newRoom = await RoomService.createRoom(roomData, user.id);

    chatService.emitNewRoom({
        roomId: newRoom.id,
        name: newRoom.name,
        ownerUsername: (user as any).username || 'Desconocido',
    });

    res.status(201).json({ success: true, message: 'Sala creada exitosamente.', data: newRoom });
};

export const generateRoomUploadUrl = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { roomId } = req.params;
    const { type, contentType } = req.body;

    const urls = await RoomService.generateRoomUploadUrl(roomId, type, contentType, user.id);

    if (!urls) {
        throw new ApiError(503, ERROR_MESSAGES.STORAGE_UNAVAILABLE);
    }

    res.status(200).json(urls);
};

export const updateRoom = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { roomId } = req.params;
    const fieldToUpdate = Object.keys(req.body)[0];
    const value = req.body[fieldToUpdate];

    await RoomService.updateRoomAttribute(roomId, fieldToUpdate, value, user.id);

    res.status(200).json({ success: true, message: `Sala actualizada.` });
};

export const getUserRooms = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as 'IN_REVISION' | 'ACCEPTED' | 'REJECTED' | undefined;

    const result = await RoomService.getUserRoomsPaginated(user.id, page, limit, status);
    res.status(200).json({ success: true, ...result });
};

/**
 * Toggles a room as favorite for the authenticated user.
 */
export const toggleFavoriteRoom = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);

    const { roomId } = req.params;
    const isFavorite = await RoomService.toggleFavoriteRoom(user.id, roomId);

    res.status(200).json({
        success: true,
        isFavorite,
        message: isFavorite ? 'Sala añadida a favoritos.' : 'Sala eliminada de favoritos.'
    });
};

/**
 * Retrieves all favorite rooms for the authenticated user with pagination and search.
 */
export const getUserFavoriteRooms = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.q as string | undefined;

    if (page < 1) {
        throw new ApiError(400, ERROR_MESSAGES.INVALID_PAGE);
    }
    if (limit < 1 || limit > 100) {
        throw new ApiError(400, ERROR_MESSAGES.INVALID_LIMIT);
    }

    const paginatedData = await RoomService.getUserFavoriteRooms(user.id, page, limit, search);
    res.status(200).json(paginatedData);
};

/**
 * Records user activity in a room for scoring purposes.
 */
export const recordRoomActivity = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);

    const { roomId } = req.params;
    await RoomService.recordRoomActivity(user.id, roomId);

    res.status(200).json({ success: true, message: 'Actividad registrada.' });
};
