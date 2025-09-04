import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';

export const getAllHobbies = async () => {
    try {
        const hobbies = await prisma.hobby.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        return hobbies;
    } catch (error) {
        throw new ApiError(500, 'Error interno del servidor al obtener los hobbies.');
    }
};