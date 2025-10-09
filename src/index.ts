import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handleSocketEvents } from './controllers/messageController';
import { ChatService } from './services/chat.service';
import roomRouter from './routes/v1/room.routes';
import userRouter from './routes/v1/user.routes';
import hobbyRouter from './routes/v1/hobby.routes';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import cors from 'cors';
import validateSession from './middlewares/validateSession';
import errorHandler from './middlewares/errorHandler';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e7,
});

const chatService = new ChatService(io);

io.on('connection', (socket) => {
  handleSocketEvents(socket, chatService);
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(validateSession);
app.use(express.json());
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/hobbies', hobbyRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});