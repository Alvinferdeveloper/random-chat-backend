import { isRedisActive } from '@/lib/redis';
import { InMemoryAdapter } from '@/services/chat/adapters/in-memory.adapter';
import { RedisAdapter } from '@/services/chat/adapters/redis.adapter';

let redisAdapterInstance: RedisAdapter | null = null;

export const setRedisAdapter = (adapter: RedisAdapter) => {
    redisAdapterInstance = adapter;
};

export const getActiveUsersCount = async (roomId: string): Promise<number> => {
    const counts = await getMultipleActiveUsersCounts([roomId]);
    return counts[roomId] || 0;
};

export const getMultipleActiveUsersCounts = async (roomIds: string[]): Promise<Record<string, number>> => {
    if (!roomIds.length) return {};
    
    if (isRedisActive() && redisAdapterInstance) {
        const state = await redisAdapterInstance.getInitialState();
        const result: Record<string, number> = {};
        for (const roomId of roomIds) {
            result[roomId] = state[roomId]?.userCount || 0;
        }
        return result;
    }
    
    return InMemoryAdapter.getActiveUsersCounts(roomIds);
};

export const getTopActiveRooms = async (limit: number = 10): Promise<{ roomId: string; count: number }[]> => {
    if (isRedisActive() && redisAdapterInstance) {
        const state = await redisAdapterInstance.getInitialState();
        return Object.entries(state)
            .map(([roomId, data]) => ({ roomId, count: data.userCount }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    
    const allCounts = InMemoryAdapter.getAllActiveUsersCounts();
    return Object.entries(allCounts)
        .map(([roomId, count]) => ({ roomId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

export const getTotalOnlineUsers = async (): Promise<number> => {
    if (isRedisActive() && redisAdapterInstance) {
        return redisAdapterInstance.getTotalOnlineUsers();
    }
    return InMemoryAdapter.getTotalOnlineUsers();
};
