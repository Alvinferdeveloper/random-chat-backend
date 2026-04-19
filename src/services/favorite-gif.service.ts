import * as FavoriteGifRepository from '../repositories/favorite-gif.repository';

export const addFavoriteGif = async (userId: string, giphyId: string, url: string, title?: string) => {
    return FavoriteGifRepository.addFavorite(userId, giphyId, url, title);
};

export const removeFavoriteGif = async (userId: string, giphyId: string) => {
    return FavoriteGifRepository.removeFavorite(userId, giphyId);
};

export const getFavoriteGifs = async (userId: string) => {
    return FavoriteGifRepository.getFavoritesByUserId(userId);
};
