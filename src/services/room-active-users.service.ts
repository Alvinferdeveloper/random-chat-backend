import { getRedisClient } from '@/lib/redis';

const ACTIVE_USERS_KEY = 'room:active_users';

export const incrementActiveUsers = async (roomId: string) => {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.zincrby(ACTIVE_USERS_KEY, 1, roomId);
};

export const decrementActiveUsers = async (roomId: string) => {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.zincrby(ACTIVE_USERS_KEY, -1, roomId);
};

export const getActiveUsersCount = async (roomId: string): Promise<number> => {
    const redis = getRedisClient();
    if (!redis) return 0;
    const count = await redis.zscore(ACTIVE_USERS_KEY, roomId);
    return count ? parseInt(count, 10) : 0;
};

export const getMultipleActiveUsersCounts = async (roomIds: string[]): Promise<Record<string, number>> => {
    const redis = getRedisClient();
    if (!redis || !roomIds.length) return {};
    
    const pipeline = redis.pipeline();
    for (const roomId of roomIds) {
        pipeline.zscore(ACTIVE_USERS_KEY, roomId);
    }
    const results = await pipeline.exec();
    
    const result: Record<string, number> = {};
    roomIds.forEach((roomId, index) => {
        const count = results?.[index]?.[1] as string | null;
        result[roomId] = count ? parseInt(count, 10) : 0;
    });
    return result;
};

export const getTopActiveRooms = async (limit: number = 10): Promise<{ roomId: string; count: number }[]> => {
    const redis = getRedisClient();
    if (!redis) return [];
    
    const results = await redis.zrevrange(ACTIVE_USERS_KEY, 0, limit - 1, 'WITHSCORES');
    
    const rooms: { roomId: string; count: number }[] = [];
    for (let i = 0; i < results.length; i += 2) {
        rooms.push({
            roomId: results[i],
            count: parseInt(results[i + 1], 10)
        });
    }
    return rooms;
};
