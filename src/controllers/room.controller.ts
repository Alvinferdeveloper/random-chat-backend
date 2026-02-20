import { Request, Response } from "express";
import * as RoomService from '../services/room.service';
import ApiError from '../utils/ApiError';

export const getRooms = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.q as string | undefined;
    const userId = req.user?.id; // Optional: used to include 'isFavorite' status

    if (page < 1 || limit < 1) {
        return res.status(400).json({ success: false, message: 'Los parámetros de paginación deben ser números positivos.' });
    }

    const paginatedData = await RoomService.getAllRooms(page, limit, search, userId);
    res.status(200).json(paginatedData);
};

export const createRoom = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, 'Usuario no autenticado para crear sala.');
    }

    const roomData = req.body;
    const newRoom = await RoomService.createRoom(roomData, user.id);
    res.status(201).json({ success: true, message: 'Sala creada exitosamente.', data: newRoom });
};

export const generateRoomUploadUrl = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    const { roomId } = req.params;
    const { type, contentType } = req.body;

    const urls = await RoomService.generateRoomUploadUrl(roomId, type, contentType, user.id);

    res.status(200).json(urls);
};

export const updateRoom = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    const { roomId } = req.params;
    const fieldToUpdate = Object.keys(req.body)[0];

    const allowedFields = ['server_banner', 'server_icon'];
    if (!allowedFields.includes(fieldToUpdate)) {
        throw new ApiError(400, 'El campo proporcionado no es válido para actualización.');
    }

    const value = req.body[fieldToUpdate];

    await RoomService.updateRoomAttribute(roomId, fieldToUpdate, value, user.id);

    res.status(200).json({ success: true, message: `Sala actualizada.` });
};

export const getUserRooms = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    const rooms = await RoomService.getUserRooms(user.id);
    res.status(200).json({ success: true, data: rooms });
};

/**
 * Toggles a room as favorite for the authenticated user.
 */
export const toggleFavoriteRoom = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(401, 'Usuario no autenticado.');

    const { roomId } = req.params;
    const isFavorite = await RoomService.toggleFavoriteRoom(user.id, roomId);

    res.status(200).json({
        success: true,
        isFavorite,
        message: isFavorite ? 'Sala añadida a favoritos.' : 'Sala eliminada de favoritos.'
    });
};

/**
 * Retrieves all favorite rooms for the authenticated user.
 */
export const getUserFavoriteRooms = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.id) throw new ApiError(401, 'Usuario no autenticado.');

    const rooms = await RoomService.getUserFavoriteRooms(user.id);
    res.status(200).json({ success: true, data: rooms });
};
