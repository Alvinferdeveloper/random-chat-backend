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
 * Retrieves a paginated list of rooms from the database.
 * @param page - The page number to retrieve.
 * @param limit - The number of items per page.
 * @returns A promise that resolves to an object containing the room data and pagination metadata.
 * @throws {ApiError} If there is a database error.
 */
export const findAllPaginated = async (page: number, limit: number) => {
    try {
        const skip = (page - 1) * limit;
        const take = limit;

        // Perform two queries in parallel: one for the data, one for the total count
        const [rooms, totalItems] = await prisma.$transaction([
            prisma.room.findMany({
                skip: skip,
                take: take,
                orderBy: {
                    created_at: 'desc' // Order by creation date, newest first
                }
            }),
            prisma.room.count()
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;

        return {
            data: rooms,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                hasNextPage: hasNextPage
            }
        };
    } catch (error) {
        throw new ApiError(500, 'No se pudieron obtener las salas de la base de datos.');
    }
};

/**
 * Checks if a room with the given normalized name exists.
 * @param normalized_name - The normalized name of the room to check.
 * @returns A promise that resolves to a boolean indicating whether the room exists.
 */
export const existsByNameNormalized = async (normalized_name: string): Promise<boolean> => {
    const room = await prisma.room.findFirst({
        where: {
            normalized_name: {
                equals: normalized_name
            }
        },
        select: { id: true },
    });

    return !!room;
};

/**
 * Creates a new room in the database.
 * @param roomData - The data for the new room.
 * @returns A promise that resolves to the newly created room.
 */
export const create = async (roomData: Omit<Room, 'id' | 'created_at'>): Promise<Room> => {
    try {
        const newRoom = await prisma.room.create({
            data: {
                ...roomData,
                server_banner: '',
                server_icon: ''
            }
        });
        return newRoom;
    } catch (error) {
        // Could be a unique constraint violation if we add one on the name field
        console.error('Error creating room:', error);
        throw new ApiError(500, 'Error al crear la nueva sala.');
    }
};

/**
 * Updates a single attribute for a room.
 * @param roomId - The ID of the room to update.
 * @param field - The name of the field to update.
 * @param value - The new value for the field.
 */
export const updateAttribute = async (roomId: string, field: string, value: any) => {
    try {
        await prisma.room.update({
            where: { id: roomId },
            data: { [field]: value },
        });
    } catch (error) {
        throw new ApiError(500, `No se pudo actualizar el campo ${field} de la sala.`);
    }
};
