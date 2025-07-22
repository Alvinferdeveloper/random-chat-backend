import { Server, Socket } from 'socket.io';
import { roomExist } from '../services/room.service';

const roomState: Record<string, { userCount: number }> = {};

export function handleSocket(socket: Socket, io: Server) {
  socket.on('getInitialRoomState', () => {
    socket.emit('initialRoomState', roomState);
  });
  // Evento para unirse a una sala
  socket.on('joinRoom', async (room: string, username: string) => {
    if (!await roomExist(room)) {
      socket.emit('error', 'La sala no existe');
      return;
    }
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    if (!roomState[room]) {
      roomState[room] = { userCount: 0 };
    }
    roomState[room].userCount++;

    socket.emit('joinedRoom', room);
    socket.to(room).emit('userJoined', `${username} se ha unido a la sala ${room}`);
    io.emit('userCount', { roomId: room, count: roomState[room].userCount });
  });

  socket.on('leaveRoom', (room: string) => {
    if (roomState[room]) {
      roomState[room].userCount--;
      io.emit('userCount', { roomId: room, count: roomState[room].userCount });
      socket.leave(room);
    }
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

  // Evento para enviar imagen a la sala
  socket.on('image', (data: { image: Buffer; description?: string }) => {
    const room = socket.data.room;
    const username = socket.data.username || 'Anónimo';
    if (!room) {
      socket.emit('error', 'No estás en una sala');
      return;
    }
    io.to(room).emit('image', {
      username,
      image: data.image,
      description: data.description,
      timestamp: new Date().toISOString(),
    });
  });

  // Evento de desconexión
  socket.on('disconnect', () => {
    const room = socket.data.room;
    const username = socket.data.username || 'Anónimo';
    if (room && roomState[room] && socket.rooms.has(room)) {
      roomState[room].userCount--;
      io.emit('userCount', { roomId: room, count: roomState[room].userCount });
      socket.to(room).emit('userLeft', `${username} ha salido de la sala ${room}`);
    }
  });
}

