import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { handleSocketEvents } from './controllers/messageController';
import { ChatService } from './services/chat.service';
import roomRouter from './routes/v1/room.route';

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', "*");
  next();
})

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
  maxHttpBufferSize: 1e7,
});

const chatService = new ChatService(io);

io.on('connection', (socket) => {
  handleSocketEvents(socket, chatService);
});

app.use('/api/v1/room', roomRouter);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});