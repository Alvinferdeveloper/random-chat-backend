import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handleSocketEvents } from './controllers/messageController';
import { ChatService } from './services/chat.service';
import roomRouter from './routes/v1/room.route';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import cors from 'cors';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
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
app.use('/api/v1/room', roomRouter);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});