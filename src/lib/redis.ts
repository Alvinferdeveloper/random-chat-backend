import Redis, { Redis as RedisClient } from 'ioredis';
import logger from './logger';

let redisClient: RedisClient | null = null;

const isRedisEnabled = (): boolean => {
    return process.env.CHAT_ADAPTER === 'redis' && !!process.env.REDIS_URL;
};

export const isRedisActive = (): boolean => {
    return isRedisEnabled();
};

export const getRedisClient = (): RedisClient | null => {
    if (!isRedisEnabled()) {
        return null;
    }

    if (!redisClient) {
        logger.info('Creating new Redis client instance...');
        redisClient = new Redis(process.env.REDIS_URL!);

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
        });

        redisClient.on('error', (err) => {
            logger.error('Redis client connection error', { error: err.message });
        });
    }
    return redisClient;
};