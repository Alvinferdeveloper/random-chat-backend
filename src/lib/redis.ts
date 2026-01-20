import Redis, { Redis as RedisClient } from 'ioredis';

let redisClient: RedisClient | null = null;

/**
 * Gets a singleton instance of the Redis client.
 * The client is created only on the first call.
 * Subsequent calls will return the existing instance.
 * @returns The ioredis client instance.
 */
export const getRedisClient = (): RedisClient => {
    if (!redisClient) {
        console.log('Creating new Redis client instance...');
        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

        redisClient.on('connect', () => {
            console.log('Redis client connected');
        });

        redisClient.on('error', (err) => {
            console.error('Redis client connection error:', err);
        });
    }
    return redisClient;
};