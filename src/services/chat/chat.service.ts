import { Server, Socket } from 'socket.io';
import { roomExists } from '@/services/room.service';
import { IChatAdapter } from '@/services/chat/adapters/base.adapter';

export class ChatService {
    private io: Server;
    private adapter: IChatAdapter;

    constructor(io: Server, adapter: IChatAdapter) {
        this.io = io;
        this.adapter = adapter;
    }

    public handleConnection(socket: Socket): void {
        socket.on('get-initial-room-state', () => this.getInitialRoomState(socket));
        socket.on('join-room', (room, username) => this.joinRoom(socket, room, username));
        socket.on('leave-room', () => this.leaveRoom(socket));
        socket.on('message', (message) => this.handleMessage(socket, message));
        socket.on('image', (data) => this.handleImage(socket, data));
        socket.on('disconnecting', () => this.handleDisconnect(socket));
    }

    private async getInitialRoomState(socket: Socket): Promise<void> {
        const state = await this.adapter.getInitialState();
        socket.emit('initial-room-state', state);
    }

    private async joinRoom(socket: Socket, parentRoom: string, username: string): Promise<void> {
        if (!await roomExists(parentRoom)) {
            socket.emit('error', 'La sala no existe');
            return;
        }

        const { subRoomName, totalUsersInParentRoom } = await this.adapter.joinRoom(parentRoom);

        await socket.join(subRoomName);

        // Store session data on the socket
        socket.data.username = username;
        socket.data.subRoomName = subRoomName;
        socket.data.parentRoom = parentRoom;

        socket.broadcast.to(subRoomName).emit('user-joined', {
            username: username,
            system: true,
            message: 'se ha unido a la sala.',
            timestamp: new Date().toISOString(),
        });

        this.io.emit('user-count', { roomId: parentRoom, count: totalUsersInParentRoom });
    }

    private async leaveRoom(socket: Socket): Promise<void> {
        const { parentRoom, subRoomName } = socket.data;
        if (subRoomName && parentRoom) {
            socket.leave(subRoomName);
            await this.handleDisconnect(socket);
        }
    }

    private handleMessage(socket: Socket, message: string): void {
        const room = socket.data.subRoomName;
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
        const room = socket.data.subRoomName;
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

    private async handleDisconnect(socket: Socket): Promise<void> {
        const { parentRoom, subRoomName, username } = socket.data;

        if (!parentRoom || !subRoomName) {
            return;
        }

        const { totalUsersInParentRoom } = await this.adapter.leaveRoom(parentRoom, subRoomName);

        socket.to(subRoomName).emit('user-left', `${username || 'Anónimo'} ha salido de la sala.`);

        this.io.emit('user-count', { roomId: parentRoom, count: totalUsersInParentRoom });
    }
}
