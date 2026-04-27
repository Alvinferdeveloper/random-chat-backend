import { getRedisClient } from './redis';
import { isRedisActive } from './redis';

type CacheEntry<T> = {
    data: T;
    expiry: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL_MS = parseInt(process.env.CACHE_DEFAULT_TTL_MS || '300000');
const USE_REDIS_CACHE = process.env.USE_REDIS_CACHE === 'true';

const getCacheKey = (key: string) => `cache:${key}`;

export const cacheService = {
    async get<T>(key: string): Promise<T | null> {
        if (USE_REDIS_CACHE && isRedisActive()) {
            const redis = getRedisClient();
            if (redis) {
                const cached = await redis.get(getCacheKey(key));
                if (cached) {
                    return JSON.parse(cached) as T;
                }
                return null;
            }
        }
        
        const entry = memoryCache.get(key);
        if (!entry) return null;
        
        if (Date.now() > entry.expiry) {
            memoryCache.delete(key);
            return null;
        }
        
        return entry.data;
    },
    
    async set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
        if (USE_REDIS_CACHE && isRedisActive()) {
            const redis = getRedisClient();
            if (redis) {
                await redis.setex(getCacheKey(key), ttlMs / 1000, JSON.stringify(data));
                return;
            }
        }
        
        memoryCache.set(key, {
            data,
            expiry: Date.now() + ttlMs
        });
    },
    
    async invalidate(key: string): Promise<void> {
        if (USE_REDIS_CACHE && isRedisActive()) {
            const redis = getRedisClient();
            if (redis) {
                await redis.del(getCacheKey(key));
            }
        }
        
        memoryCache.delete(key);
    },
    
    clear(): void {
        memoryCache.clear();
    }
};