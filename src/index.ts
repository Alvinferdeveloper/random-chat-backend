import express from 'express';
import logger from './lib/logger';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

import { handleSocketEvents } from '@/controllers/messageController';
import { ChatService } from '@/services/chat/chat.service';
import roomRouter from '@/routes/v1/room.routes';
import userRouter from '@/routes/v1/user.routes';
import hobbyRouter from '@/routes/v1/hobby.routes';
import categoryRouter from '@/routes/v1/category.routes';
import adminRouter from '@/routes/v1/admin.routes';
import reportRouter from '@/routes/v1/report.routes';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@/lib/auth';
import validateSession from '@/middlewares/validateSession';
import errorHandler from '@/middlewares/errorHandler';
import { RedisAdapter } from '@/services/chat/adapters/redis.adapter';
import { InMemoryAdapter } from '@/services/chat/adapters/in-memory.adapter';
import { createAdapter } from '@socket.io/redis-adapter';
import { IChatAdapter } from '@/services/chat/adapters/base.adapter';
import { getRedisClient, isRedisActive } from '@/lib/redis';
import { setRedisAdapter } from '@/services/room-active-users.service';
import { generalLimiter, authLimiter } from '@/config/rateLimiters';
import { csrfProtection } from '@/middlewares/csrfProtection';
import healthRouter from '@/routes/v1/health.routes';
import settingsRouter from '@/routes/v1/settings.routes';
import { setupGracefulShutdown } from '@/lib/gracefulShutdown';
import { requestLogger } from '@/middlewares/requestLogger';
import validateMaintenance from '@/middlewares/validateMaintenance';

const app = express();
const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS || '[]');

app.set('trust proxy', 1);
app.use(helmet());

// Request logger middleware
app.use(requestLogger);

app.use(generalLimiter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    maxHttpBufferSize: 1e7,
    pingTimeout: 10000, // 10s to declare disconnection after not receiving pong
    pingInterval: 5000,  // Send ping every 5s
});

io.use(async (socket, next) => {
    const headers = new Headers();
    Object.entries(socket.handshake.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
            headers.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
        }
    });

    try {
        const session = await auth.api.getSession({ headers });
        if (session && session.user) {
            socket.data.user = session.user;
        }
    } catch (error) {
    }
    next();
});

const chatAdapter = setupChatAdapter();
const chatService = new ChatService(io, chatAdapter);

setupSocketHandlers(io, chatService);

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS', 'PATCH', "DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

//app.use(csrfProtection);

app.use(validateMaintenance);

app.all("/api/auth/{*any}", authLimiter, toNodeHandler(auth));

app.use(express.json());
app.use('/api/v1/rooms', roomRouter(chatService));
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/admin', adminRouter(chatService));
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/settings', settingsRouter);
app.use(validateSession);
app.use('/api/v1/hobbies', hobbyRouter);
app.use('/api/v1/health', healthRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    logger.info(`Servidor escuchando en puerto ${PORT}`);
});

setupGracefulShutdown(server, io);

function setupChatAdapter(): IChatAdapter {
    if (isRedisActive()) {
        const redisClient = getRedisClient();
        if (redisClient) {
            const pubClient = redisClient.duplicate();
            const subClient = redisClient.duplicate();

            io.adapter(createAdapter(pubClient, subClient));
            const redisAdapter = new RedisAdapter(redisClient);
            setRedisAdapter(redisAdapter);
            return redisAdapter;
        }
    }
    logger.warn('Redis unavailable, falling back to InMemory');
    return InMemoryAdapter.getInstance();
}

function setupSocketHandlers(io: Server, chatService: ChatService) {
    const socketMessageCounts = new Map<string, { count: number; resetTime: number }>();

    const RATE_LIMIT = parseInt(process.env.SOCKET_RATE_LIMIT || '20');
    const RATE_WINDOW_MS = parseInt(process.env.SOCKET_RATE_WINDOW_MS || '60000');
    const CLEANUP_INTERVAL_MS = 60000;

    const RATE_LIMITED_EVENTS = [
        'message', 'image', 'audio', 'gif',
        'send_message', 'join_room', 'send_reaction'
    ];

    // Cleanup old entries periodically
    const cleanup = () => {
        const now = Date.now();
        for (const [socketId, data] of socketMessageCounts.entries()) {
            if (now > data.resetTime + RATE_WINDOW_MS) {
                socketMessageCounts.delete(socketId);
            }
        }
    };
    setInterval(cleanup, CLEANUP_INTERVAL_MS);

    io.on('connection', (socket) => {
        socketMessageCounts.set(socket.id, { count: 0, resetTime: Date.now() + RATE_WINDOW_MS });

        // Track admin sockets
        if (socket.data.user?.role === 'ADMIN') {
            chatService.registerAdminSocket(socket.id);
        }

        socket.use((event, next) => {
            if (RATE_LIMITED_EVENTS.includes(event[0])) {
                const clientData = socketMessageCounts.get(socket.id);
                if (clientData) {
                    if (Date.now() > clientData.resetTime) {
                        clientData.count = 0;
                        clientData.resetTime = Date.now() + RATE_WINDOW_MS;
                    }
                    if (clientData.count >= RATE_LIMIT) {
                        return next(new Error('Rate limit exceeded'));
                    }
                    clientData.count++;
                }
            }
            next();
        });

        socket.on('disconnect', () => {
            chatService.unregisterAdminSocket(socket.id);
            socketMessageCounts.delete(socket.id);
        });

        handleSocketEvents(socket, chatService);
    });
}
