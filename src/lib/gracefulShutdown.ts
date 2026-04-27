import { Server } from 'socket.io';
import http from 'http';
import prisma from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';
import logger from './logger';

export function setupGracefulShutdown(server: http.Server, io: Server) {
    const shutdown = async (signal: string) => {
        logger.info(`Graceful shutdown initiated`, { signal });

        server.close(async () => {
            logger.info('HTTP server closed');

            io.close(() => {
                logger.info('Socket.io server closed');

                prisma.$disconnect()
                    .then(() => {
                        logger.info('Prisma disconnected');
                        const redisClient = getRedisClient();
                        if (redisClient) {
                            redisClient.quit().then(() => {
                                logger.info('Redis connection closed');
                                process.exit(0);
                            });
                        } else {
                            process.exit(0);
                        }
                    })
                    .catch((err) => {
                        logger.error('Error disconnecting Prisma', { error: err.message });
                        process.exit(1);
                    });
            });
        });

        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
