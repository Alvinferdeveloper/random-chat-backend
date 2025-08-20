import prisma from "../lib/prisma";
import { Request, Response } from "express";
export const getRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await prisma.room.findMany();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las salas' });
    }
};
