import { Server, Socket } from 'socket.io';
import { roomExist } from './room.service';

const roomState: Record<string, { userCount: number }> = {};

export class ChatService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public handleConnection(socket: Socket): void {
    socket.on('getInitialRoomState', () => this.getInitialRoomState(socket));
    socket.on('joinRoom', (room, username) => this.joinRoom(socket, room, username));
    socket.on('leaveRoom', (room) => this.leaveRoom(socket, room));
    socket.on('message', (message) => this.handleMessage(socket, message));
    socket.on('image', (data) => this.handleImage(socket, data));
    socket.on('disconnecting', () => this.handleDisconnect(socket));
  }

  private getInitialRoomState(socket: Socket): void {
    socket.emit('initialRoomState', roomState);
  }

  private async joinRoom(socket: Socket, room: string, username: string): Promise<void> {
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
    this.io.emit('userCount', { roomId: room, count: roomState[room].userCount });
  }

  private leaveRoom(socket: Socket, room: string): void {
    if (roomState[room]) {
      roomState[room].userCount--;
      this.io.emit('userCount', { roomId: room, count: roomState[room].userCount });
      socket.leave(room);
    }
  }

  private handleMessage(socket: Socket, message: string): void {
    const room = socket.data.room;
    const username = socket.data.username || 'Anónimo';
    if (!room) {
      socket.emit('error', 'No estás en una sala');
      return;
    }
    this.io.to(room).emit('message', {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private handleImage(socket: Socket, data: { image: Buffer; description?: string }): void {
    const room = socket.data.room;
    const username = socket.data.username || 'Anónimo';
    if (!room) {
      socket.emit('error', 'No estás en una sala');
      return;
    }
    this.io.to(room).emit('image', {
      username,
      image: data.image,
      description: data.description,
      timestamp: new Date().toISOString(),
    });
  }

  private handleDisconnect(socket: Socket): void {
    const room = Array.from(socket.rooms).find(r => r !== socket.id);
    if (room && roomState[room]) {
      const username = socket.data.username || 'Anónimo';
      roomState[room].userCount--;
      this.io.emit('userCount', { roomId: room, count: roomState[room].userCount });
      socket.to(room).emit('userLeft', `${username} ha salido de la sala`);
    }
  }
}
