import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';
import { Hobby } from '@prisma/client';
import logger from '../lib/logger';

/**
 * Retrieves all hobbies from the database, ordered by name.
 * @returns A promise that resolves to an array of hobbies.
 * @throws {ApiError} If there is a database error.
 */
export const findAll = async (): Promise<Hobby[]> => {
    try {
        const hobbies = await prisma.hobby.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        return hobbies;
    } catch (error) {
        throw new ApiError(500, 'No se pudo obtener los hobbies de la base de datos.');
    }
};

/**
 * Verifies if all provided hobby IDs exist in the database.
 * @param hobbyIds - An array of hobby IDs to check.
 * @returns A promise that resolves to true if all hobbies exist, false otherwise.
 */
export const hobbiesExist = async (hobbyIds: string[]): Promise<boolean> => {
    if (hobbyIds.length === 0) {
        return true; // An empty list is valid
    }
    try {
        const count = await prisma.hobby.count({
            where: {
                id: { in: hobbyIds },
            },
        });
        return count === hobbyIds.length;
    } catch (error) {
        logger.error('Error validating hobby IDs', { error: (error as Error).message });
        return false;
    }
};