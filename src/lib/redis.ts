import Redis, { Redis as RedisClient } from 'ioredis';

let redisClient: RedisClient | null = null;

const isRedisEnabled = (): boolean => {
    return process.env.CHAT_ADAPTER === 'redis' && !!process.env.REDIS_URL;
};

export const isRedisActive = (): boolean => {
    return isRedisEnabled();
};

/**
 * Gets a singleton instance of the Redis client.
 * The client is created only on the first call.
 * Subsequent calls will return the existing instance.
 */
export const getRedisClient = (): RedisClient | null => {
    if (!isRedisEnabled()) {
        return null;
    }

    if (!redisClient) {
        console.log('Creating new Redis client instance...');
        redisClient = new Redis(process.env.REDIS_URL!);

        redisClient.on('connect', () => {
            console.log('Redis client connected');
        });

        redisClient.on('error', (err) => {
            console.error('Redis client connection error:', err);
        });
    }
    return redisClient;
};