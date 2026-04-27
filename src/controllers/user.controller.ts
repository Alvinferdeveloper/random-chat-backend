import { Request, Response } from 'express';
import * as UserService from '../services/user.service';
import ApiError from '../utils/ApiError';

export const completeUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    const profileData = req.body
    console.log(profileData)
    await UserService.completeUserProfile(user?.id as string, profileData);

    res.status(200).json({ success: true, message: 'Perfil actualizado' });
};


export const getUserSession = async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    res.status(200).json({ isAuthenticated: true, user });
};

export const getUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    const userProfile = await UserService.getUserProfile(user.id);
    res.status(200).json({ success: true, user: userProfile });
};

export const getUserProfileByUsername = async (req: Request, res: Response) => {
    const { username } = req.params;
    const decodedUsername = decodeURIComponent(username);
    const userProfile = await UserService.getUserProfileByUsername(decodedUsername);
    res.status(200).json({ success: true, user: userProfile });
};

export const updateUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    const fieldToUpdate = Object.keys(req.body)[0];
    const value = req.body[fieldToUpdate];

    const updatedUser = await UserService.updateUserProfileAttribute(user.id, fieldToUpdate, value);

    res.status(200).json({ success: true, user: updatedUser });
};

export const generateProfileUploadUrl = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Usuario no autenticado.');
    }

    const { fileName } = req.body;

    const urls = await UserService.generateProfileUploadUrl(user.id, fileName);

    if (!urls) {
        throw new ApiError(503, 'Storage service unavailable.');
    }

    res.status(200).json(urls);
};