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