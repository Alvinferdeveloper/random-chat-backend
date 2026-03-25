import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

import { handleSocketEvents } from '@/controllers/messageController';
import { ChatService } from '@/services/chat/chat.service';
import roomRouter from '@/routes/v1/room.routes';
import userRouter from '@/routes/v1/user.routes';
import hobbyRouter from '@/routes/v1/hobby.routes';
import adminRouter from '@/routes/v1/admin.routes';
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
import { generalLimiter, authLimiter, createRoomLimiter, profileUpdateLimiter } from '@/config/rateLimiters';
import { csrfProtection } from '@/middlewares/csrfProtection';

const app = express();
const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS || '[]');

app.set('trust proxy', 1);
app.use(helmet());
app.use(generalLimiter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    maxHttpBufferSize: 1e7,
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
    methods: ['GET', 'POST', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(csrfProtection);

app.all("/api/auth/{*any}", authLimiter, toNodeHandler(auth));

app.use(express.json());
app.use('/api/v1/rooms', createRoomLimiter, roomRouter);
app.use('/api/v1/admin', adminRouter);
app.use(validateSession);
app.use('/api/v1/users', profileUpdateLimiter, userRouter);
app.use('/api/v1/hobbies', hobbyRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

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
    console.warn('Redis unavailable, falling back to InMemory');
    return new InMemoryAdapter();
}

function setupSocketHandlers(io: Server, chatService: ChatService) {
    const socketMessageCounts = new Map<string, { count: number; resetTime: number }>();

    io.on('connection', (socket) => {
        socketMessageCounts.set(socket.id, { count: 0, resetTime: Date.now() + 60000 });

        socket.use((event, next) => {
            if (event[0] === 'send_message' || event[0] === 'join_room') {
                const clientData = socketMessageCounts.get(socket.id);
                if (clientData) {
                    if (Date.now() > clientData.resetTime) {
                        clientData.count = 0;
                        clientData.resetTime = Date.now() + 60000;
                    }
                    if (clientData.count >= 20) {
                        return next(new Error('Rate limit exceeded'));
                    }
                    clientData.count++;
                }
            }
            next();
        });

        socket.on('disconnect', () => {
            socketMessageCounts.delete(socket.id);
        });

        handleSocketEvents(socket, chatService);
    });
}
