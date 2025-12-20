import { Server, Socket } from 'socket.io';
import { roomExists } from '../room.service';
import { IChatAdapter } from './adapters/base.adapter';
import * as UserRepository from '../../repositories/user.repository';

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

    private async joinRoom(socket: Socket, parentRoom: string, clientUsername: string): Promise<void> {
        if (!await roomExists(parentRoom)) {
            socket.emit('error', 'La sala no existe');
            return;
        }

        const { subRoomName, totalUsersInParentRoom } = await this.adapter.joinRoom(parentRoom);
        await socket.join(subRoomName);

        let finalUsername = clientUsername;
        let userProfileImage: string | null = null;

        if (socket.data.user) {
            // authenticated user
            const sessionUser = socket.data.user;
            finalUsername = sessionUser.name;
            userProfileImage = await UserRepository.findImageById(sessionUser.id);
        }

        // save data in socket for later use
        socket.data.username = finalUsername;
        socket.data.userProfileImage = userProfileImage;
        socket.data.subRoomName = subRoomName;
        socket.data.parentRoom = parentRoom;

        socket.broadcast.to(subRoomName).emit('user-joined', {
            username: finalUsername,
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
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }
        this.io.to(subRoomName).emit('message', {
            username,
            userProfileImage,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    private handleImage(socket: Socket, data: { image: Buffer; description?: string }): void {
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }
        this.io.to(subRoomName).emit('image', {
            username,
            userProfileImage,
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