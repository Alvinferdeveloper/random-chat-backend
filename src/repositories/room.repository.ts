import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';
import { Room } from '@prisma/client';

/**
 * Finds a room by its unique ID, ensuring it's not logically deleted.
 * @param id - The ID of the room.
 * @returns A promise that resolves to the room object or null if not found.
 * @throws ApiError if an error occurs during the search.
 */
export const findById = async (id: string): Promise<Room | null> => {
    try {
        const room = await prisma.room.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });
        return room;
    } catch (error) {
        throw new ApiError(500, `Error al buscar la sala con id ${id}.`);
    }
};

/**
 * Retrieves a paginated list of rooms, excluding deleted and optionally unaccepted ones.
 * @param page - The page number.
 * @param limit - The items per page.
 * @param includeUnaccepted - Whether to include rooms that haven't been accepted yet.
 * @returns Paginated room data.
 * @throws ApiError if an error occurs during the search.
 */
export const findAllPaginated = async (page: number, limit: number, includeUnaccepted: boolean = false) => {
    try {
        const skip = (page - 1) * limit;
        const take = limit;

        const whereCondition: any = {
            deletedAt: null
        };

        if (!includeUnaccepted) {
            whereCondition.accepted = true;
        }

        const [rooms, totalItems] = await prisma.$transaction([
            prisma.room.findMany({
                where: whereCondition,
                skip: skip,
                take: take,
                orderBy: { created_at: 'desc' }
            }),
            prisma.room.count({ where: whereCondition })
        ]);

        return {
            data: rooms,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                hasNextPage: page < Math.ceil(totalItems / limit)
            }
        };
    } catch (error) {
        throw new ApiError(500, 'No se pudieron obtener las salas de la base de datos.');
    }
};

/**
 * Checks if a non-deleted room with the given normalized name exists.
 * @param normalized_name - The normalized name.
 * @returns True if exists, false otherwise.
 */
export const existsByNameNormalized = async (normalized_name: string): Promise<boolean> => {
    const room = await prisma.room.findFirst({
        where: {
            normalized_name: { equals: normalized_name },
            deletedAt: null
        },
        select: { id: true },
    });
    return !!room;
};

/**
 * Creates a new room.
 * @param roomData - Data for the new room.
 * @throws ApiError if an error occurs during the creation.
 */
export const create = async (roomData: Omit<Room, 'id' | 'created_at' | 'deletedAt'>): Promise<Room> => {
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
        console.error('Error creating room:', error);
        throw new ApiError(500, 'Error al crear la nueva sala.');
    }
};

/**
 * Updates a single attribute for a room.
 * @param roomId - The ID of the room to update.
 * @param field - The field to update.
 * @param value - The new value for the field.
 * @throws ApiError if an error occurs during the update.
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

/**
 * Performs a soft delete on a room by setting its deletedAt field.
 * @param roomId - The ID of the room to delete.
 * @throws ApiError if an error occurs during the deletion.
 */
export const softDelete = async (roomId: string) => {
    try {
        await prisma.room.update({
            where: { id: roomId },
            data: { deletedAt: new Date() }
        });
    } catch (error) {
        throw new ApiError(500, 'No se pudo realizar el borrado lógico de la sala.');
    }
};
