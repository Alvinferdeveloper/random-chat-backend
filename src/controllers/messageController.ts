import { Server, Socket } from 'socket.io';
import prisma from '../libs/prisma';
import { roomExist } from '../services/room.service';

export function handleSocket(socket: Socket, io: Server) {
  // Evento para unirse a una sala
  socket.on('joinRoom', async (room: string, username: string) => {
    if (!await roomExist(room)) {
      socket.emit('error', 'La sala no existe');
      return;
    }
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;
    socket.emit('joinedRoom', room);
    socket.to(room).emit('userJoined', `${username} se ha unido a la sala ${room}`);
  });

  // Evento para enviar mensaje a la sala
  socket.on('message', (message: string) => {
    const room = socket.data.room;
    const username = socket.data.username || 'Anónimo';
    if (!room) {
      socket.emit('error', 'No estás en una sala');
      return;
    }
    io.to(room).emit('message', {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // Evento de desconexión
  socket.on('disconnect', () => {
    const room = socket.data.room;
    const username = socket.data.username || 'Anónimo';
    if (room) {
      socket.to(room).emit('userLeft', `${username} ha salido de la sala ${room}`);
    }
  });
}
