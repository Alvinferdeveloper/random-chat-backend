import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';
import { Room } from '@prisma/client';

/**
 * Finds a room by its unique ID.
 * @param id - The ID of the room.
 * @returns A promise that resolves to the room object or null if not found.
 * @throws {ApiError} If there is a database error.
 */
export const findById = async (id: string): Promise<Room | null> => {
    try {
        const room = await prisma.room.findUnique({ where: { id } });
        return room;
    } catch (error) {
        throw new ApiError(500, `Error al buscar la sala con id ${id}.`);
    }
};

/**
 * Retrieves all rooms from the database.
 * @returns A promise that resolves to an array of all rooms.
 * @throws {ApiError} If there is a database error.
 */
export const findAll = async (): Promise<Room[]> => {
    try {
        const rooms = await prisma.room.findMany();
        return rooms;
    } catch (error) {
        throw new ApiError(500, 'No se pudieron obtener las salas de la base de datos.');
    }
};
