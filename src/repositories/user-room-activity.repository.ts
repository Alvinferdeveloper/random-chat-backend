import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';

export const recordActivity = async (userId: string, roomId: string) => {
    try {
        await prisma.userRoomActivity.upsert({
            where: { userId_roomId: { userId, roomId } },
            update: {
                lastInteraction: new Date(),
                interactionCount: { increment: 1 }
            },
            create: { userId, roomId }
        });
    } catch (error) {
        console.error('Error recording activity:', error);
    }
};

export const getUserRecentActivity = async (userId: string, limit: number = 10) => {
    try {
        const activities = await prisma.userRoomActivity.findMany({
            where: { userId },
            orderBy: { lastInteraction: 'desc' },
            take: limit,
            select: {
                roomId: true,
                lastInteraction: true,
                interactionCount: true
            }
        });
        return activities;
    } catch (error) {
        console.error('Error getting user activity:', error);
        return [];
    }
};

export const getRoomsWithActivity = async (userId: string, roomIds: string[]) => {
    if (!roomIds.length) return [];

    try {
        const activities = await prisma.userRoomActivity.findMany({
            where: {
                userId,
                roomId: { in: roomIds }
            },
            select: {
                roomId: true,
                lastInteraction: true,
                interactionCount: true
            }
        });
        return activities;
    } catch (error) {
        console.error('Error getting rooms with activity:', error);
        return [];
    }
};
