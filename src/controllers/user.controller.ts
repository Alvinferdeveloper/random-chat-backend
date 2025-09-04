import { Request, Response } from 'express';
import * as UserService from '../services/user.service';
import ApiError from '../utils/ApiError';

export const completeUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    const { username, bio } = req.body;

    if (!username || typeof username !== 'string' || username.length < 3) {
        throw new ApiError(400, 'El nombre de usuario debe tener al menos 3 caracteres.');
    }

    await UserService.completeUserProfile(user?.id as string, username, bio);

    res.status(200).json({ success: true, message: 'Perfil actualizado' });
};


export const getUserSession = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ isAuthenticated: false });
            return;
        }
        res.status(200).json({ isAuthenticated: true, user });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

