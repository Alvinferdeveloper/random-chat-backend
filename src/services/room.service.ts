import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';

export const roomExists = async (id: string) => {
    return prisma.room.findUnique({ where: { id } });
};

export const getAllRooms = async () => {
    try {
        const rooms = await prisma.room.findMany();
        return rooms;
    } catch (error) {
        throw new ApiError(500, 'No se pudieron obtener las salas.');
    }
};
