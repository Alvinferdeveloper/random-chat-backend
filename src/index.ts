import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handleSocketEvents } from '@/controllers/messageController';
import { ChatService } from '@/services/chat/chat.service';
import roomRouter from '@/routes/v1/room.routes';
import userRouter from '@/routes/v1/user.routes';
import hobbyRouter from '@/routes/v1/hobby.routes';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@/lib/auth';
import cors from 'cors';
import validateSession from '@/middlewares/validateSession';
import errorHandler from '@/middlewares/errorHandler';
import { RedisAdapter } from '@/services/chat/adapters/redis.adapter';
import { InMemoryAdapter } from '@/services/chat/adapters/in-memory.adapter';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { IChatAdapter } from '@/services/chat/adapters/base.adapter';

const app = express();

const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS || '[]');

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
            // Attach user to the socket for authenticated users
            socket.data.user = session.user;
        }
    } catch (error) {
        // Ignore error, proceed as unauthenticated
    }
    next();
});

// --- Adapter Switch ---
let chatAdapter: IChatAdapter;

if (process.env.CHAT_ADAPTER === 'redis') {
    const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    chatAdapter = new RedisAdapter(redisClient);
} else {
    chatAdapter = new InMemoryAdapter();
}

// Initialize Chat Service with the selected adapter
const chatService = new ChatService(io, chatAdapter);

io.on('connection', (socket) => {
    handleSocketEvents(socket, chatService);
});

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));



app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());
app.use('/api/v1/rooms', roomRouter);
app.use(validateSession);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/hobbies', hobbyRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});