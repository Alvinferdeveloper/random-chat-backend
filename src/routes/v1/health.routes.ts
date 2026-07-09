import { Router, Request, Response } from 'express';
import { isRedisActive, getRedisClient } from '@/lib/redis';
import prisma from '@/lib/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    const checks = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: await checkDatabase(),
            redis: await checkRedis(),
        }
    };

    const allHealthy = Object.values(checks.services).every(s => s.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json(checks);
});

router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/db', async (_req: Request, res: Response) => {
    const result = await checkDatabase();
    res.status(result.status === 'healthy' ? 200 : 503).json({
        status: result.status,
        timestamp: new Date().toISOString(),
        service: 'database',
        ...(result.error ? { error: result.error } : {})
    });
});

router.get('/ready', async (_req: Request, res: Response) => {
    const dbHealthy = (await checkDatabase()).status === 'healthy';
    const redisHealthy = (await checkRedis()).status === 'healthy';

    if (dbHealthy && redisHealthy) {
        res.status(200).json({ status: 'ready' });
    } else {
        res.status(503).json({ status: 'not ready' });
    }
});

async function checkDatabase() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy' };
    } catch {
        return { status: 'unhealthy', error: 'Database connection failed' };
    }
}

async function checkRedis() {
    try {
        if (!isRedisActive()) {
            return { status: 'healthy', note: 'Redis not configured (using in-memory)' };
        }
        const client = getRedisClient();
        if (!client) {
            return { status: 'unhealthy', error: 'Redis client unavailable' };
        }
        await client.ping();
        return { status: 'healthy' };
    } catch {
        return { status: 'unhealthy', error: 'Redis ping failed' };
    }
}

export default router;
