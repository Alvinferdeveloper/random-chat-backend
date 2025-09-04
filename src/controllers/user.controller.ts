import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const completeUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    const { username, bio, age_range, location, conversation_type, selected_hobbies } = req.body;

    if (!username || typeof username !== 'string' || username.length < 3) {
        return res.status(400).json({ message: 'El nombre de usuario debe tener al menos 3 caracteres.' });
    }

    try {
        await prisma.user.update({
            where: { id: user?.id },
            data: {
                username: username.toLowerCase(),
                bio,
                ageRange: age_range,
                location,
                conversationType: conversation_type,
                hobbies: {
                    connect: selected_hobbies.map((id: string) => ({ id })),
                },
            },
        });
        return res.status(200).json({ message: 'Perfil actualizado' });
    } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            return res.status(409).json({ message: 'Este nombre de usuario ya está en uso.' });
        }
        throw error;
    }
};
