import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handleSocketEvents } from '@/controllers/messageController';
import { ChatService } from '@/services/chat/chat.service';
import roomRouter from '@/routes/v1/room.routes';
import userRouter from '@/routes/v1/user.routes';
import hobbyRouter from '@/routes/v1/hobby.routes';
import adminRouter from '@/routes/v1/admin.routes';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@/lib/auth';
import cors from 'cors';
import validateSession from '@/middlewares/validateSession';
import errorHandler from '@/middlewares/errorHandler';
import { RedisAdapter } from '@/services/chat/adapters/redis.adapter';
import { InMemoryAdapter } from '@/services/chat/adapters/in-memory.adapter';
import { createAdapter } from '@socket.io/redis-adapter';
import { IChatAdapter } from '@/services/chat/adapters/base.adapter';
import { getRedisClient, isRedisActive } from '@/lib/redis';
import { setRedisAdapter } from '@/services/room-active-users.service';

import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();

// Trust proxy is required if you are behind a load balancer (Vercel, Railway, Nginx, etc.)
app.set('trust proxy', 1);

app.use(helmet());

// Global Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos."
    }
});

app.use(limiter);

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

if (isRedisActive()) {
    const redisClient = getRedisClient();
    if (redisClient) {
        const pubClient = redisClient.duplicate();
        const subClient = redisClient.duplicate();

        io.adapter(createAdapter(pubClient, subClient));
        const redisAdapter = new RedisAdapter(redisClient);
        setRedisAdapter(redisAdapter);
        chatAdapter = redisAdapter;
    } else {
        console.warn('Redis adapter requested but client unavailable, falling back to InMemory');
        chatAdapter = new InMemoryAdapter();
    }
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
app.use('/api/v1/admin', adminRouter);
app.use(validateSession);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/hobbies', hobbyRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});