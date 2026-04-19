import prisma from '../lib/prisma';

export const addFavorite = async (userId: string, giphyId: string, url: string, title?: string) => {
    return prisma.favoriteGif.upsert({
        where: {
            userId_giphyId: {
                userId,
                giphyId
            }
        },
        update: {
            url,
            title
        },
        create: {
            userId,
            giphyId,
            url,
            title
        }
    });
};

export const removeFavorite = async (userId: string, giphyId: string) => {
    return prisma.favoriteGif.delete({
        where: {
            userId_giphyId: {
                userId,
                giphyId
            }
        }
    });
};

export const getFavoritesByUserId = async (userId: string) => {
    return prisma.favoriteGif.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
};
