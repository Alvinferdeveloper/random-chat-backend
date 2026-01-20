import { Request, Response } from "express";
import * as RoomService from '../services/room.service';
import ApiError from '../utils/ApiError';

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

    const { roomId } = req.params;

    const { type, contentType } = req.body;

    // TODO: Add logic here to verify the user has permission to edit this room

    const urls = await RoomService.generateRoomUploadUrl(roomId, type, contentType);

    res.status(200).json(urls);

};

/**
 * Handles updating a single attribute of a room.
 */
export const updateRoom = async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const fieldToUpdate = Object.keys(req.body)[0];
    const value = req.body[fieldToUpdate];

    // TODO: Check if user has permission to update this room

    await RoomService.updateRoomAttribute(roomId, fieldToUpdate, value);

    res.status(200).json({ success: true, message: `Sala actualizada.` });
};