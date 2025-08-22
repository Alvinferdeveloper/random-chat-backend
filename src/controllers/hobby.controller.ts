import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllHobbies = async (req: Request, res: Response) => {
    try {
        const hobbies = await prisma.hobby.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        return res.status(200).json(hobbies);
    } catch (error) {
        console.error("Error fetching hobbies:", error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener los hobbies.' });
    }
};
