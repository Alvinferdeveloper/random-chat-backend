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
    const user = req.user;

    if (!user) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    res.status(200).json({ isAuthenticated: true, user });
};

