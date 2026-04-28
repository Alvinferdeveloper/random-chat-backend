import { Request, Response } from 'express';
import * as UserService from '../services/user.service';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';
import logger from '../lib/logger';

export const completeUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    const profileData = req.body
    logger.debug('Completing user profile', { userId: user?.id });
    await UserService.completeUserProfile(user?.id as string, profileData);

    res.status(200).json({ success: true, message: 'Perfil actualizado' });
};


export const getUserSession = async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    res.status(200).json({ isAuthenticated: true, user });
};

export const getUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
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
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const updatedUser = await UserService.updateUserProfileFromBody(user.id, req.body);

    res.status(200).json({ success: true, user: updatedUser });
};

export const generateProfileUploadUrl = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { fileName } = req.body;

    const urls = await UserService.generateProfileUploadUrl(user.id, fileName);

    if (!urls) {
        throw new ApiError(503, ERROR_MESSAGES.STORAGE_UNAVAILABLE);
    }

    res.status(200).json(urls);
};