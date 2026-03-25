import { Server } from 'socket.io';
import http from 'http';
import prisma from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

export function setupGracefulShutdown(server: http.Server, io: Server) {
    const shutdown = async (signal: string) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);

        server.close(async () => {
            console.log('HTTP server closed');

            io.close(() => {
                console.log('Socket.io server closed');

                prisma.$disconnect()
                    .then(() => {
                        console.log('Prisma disconnected');
                        const redisClient = getRedisClient();
                        if (redisClient) {
                            redisClient.quit().then(() => {
                                console.log('Redis connection closed');
                                process.exit(0);
                            });
                        } else {
                            process.exit(0);
                        }
                    })
                    .catch((err) => {
                        console.error('Error disconnecting Prisma:', err);
                        process.exit(1);
                    });
            });
        });

        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
