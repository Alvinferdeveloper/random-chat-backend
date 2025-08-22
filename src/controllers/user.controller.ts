import { Request, Response } from 'express';
import { auth } from '../lib/auth';
import prisma from '../lib/prisma';

export const completeUserProfile = async (req: Request, res: Response) => {
    //transform the headers to a Headers object
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
            headers.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
        }
    });

    const session = await auth.api.getSession({ headers });

    if (!session || !session.user) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const { username, bio } = req.body;

    if (!username || typeof username !== 'string' || username.length < 3) {
        return res.status(400).json({ message: 'El nombre de usuario debe tener al menos 3 caracteres.' });
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                username: username.toLowerCase(),
                bio,
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
