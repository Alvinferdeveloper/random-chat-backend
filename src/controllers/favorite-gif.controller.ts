import { Request, Response } from 'express';
import * as FavoriteGifService from '../services/favorite-gif.service';
import { asyncHandler } from '../utils/asyncHandler';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';

export const getFavoriteGifs = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);

    const favorites = await FavoriteGifService.getFavoriteGifs(user.id);
    res.status(200).json({ success: true, data: favorites });
};

export const addFavoriteGif = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);

    const { giphyId, url, title } = req.body;
    if (!giphyId || !url) throw new ApiError(400, ERROR_MESSAGES.MISSING_FIELDS);

    const favorite = await FavoriteGifService.addFavoriteGif(user.id, giphyId, url, title);
    res.status(201).json({ success: true, data: favorite });
};

export const removeFavoriteGif = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw new ApiError(401, ERROR_MESSAGES.UNAUTHORIZED);

    const { giphyId } = req.params;
    await FavoriteGifService.removeFavoriteGif(user.id, giphyId);
    res.status(200).json({ success: true, message: 'Eliminado de favoritos' });
};
