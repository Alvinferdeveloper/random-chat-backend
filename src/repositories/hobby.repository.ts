import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';
import { Hobby } from '@prisma/client';

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
