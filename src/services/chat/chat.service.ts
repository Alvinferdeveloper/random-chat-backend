import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import { roomExists } from '../room.service';
import { IChatAdapter } from './adapters/base.adapter';
import * as UserRepository from '../../repositories/user.repository';

interface ReplyContext {
    id: string;
    author: string;
    messageSnippet: string;
}

export class ChatService {
    private io: Server;
    private adapter: IChatAdapter;

    constructor(io: Server, adapter: IChatAdapter) {
        this.io = io;
        this.adapter = adapter;
    }

    /**
     * Fetches all sockets in a room, maps them to a user list payload, 
     * and broadcasts the list to that room.
     * @param subRoomName - The name of the sub-room to broadcast to.
     */
    private async _broadcastUserList(subRoomName: string): Promise<void> {
        try {
            const sockets = await this.io.in(subRoomName).fetchSockets();
            const userList = sockets.map(socket => ({
                id: socket.id,
                username: socket.data.username,
                profileImage: socket.data.userProfileImage,
            }));
            this.io.to(subRoomName).emit('room_users', userList);
        } catch (error) {
            console.error(`Error broadcasting user list for room ${subRoomName}:`, error);
        }
    }

    public handleConnection(socket: Socket): void {
        socket.on('get-initial-room-state', () => this.getInitialRoomState(socket));
        socket.on('join-room', (room, username) => this.joinRoom(socket, room, username));
        socket.on('leave-room', () => this.leaveRoom(socket));
        socket.on('message', (payload) => this.handleMessage(socket, payload));
        socket.on('image', (payload) => this.handleImage(socket, payload));
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
            const sessionUser = socket.data.user;
            finalUsername = sessionUser.name;
            userProfileImage = await UserRepository.findImageById(sessionUser.id);
        }

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

        // Broadcast the updated user list after the new user has joined
        await this._broadcastUserList(subRoomName);
    }

    private async leaveRoom(socket: Socket): Promise<void> {
        const { parentRoom, subRoomName } = socket.data;
        if (subRoomName && parentRoom) {
            socket.leave(subRoomName);
            await this.handleDisconnect(socket);
        }
    }

    private handleMessage(socket: Socket, payload: string | { message: string; replyTo?: ReplyContext }): void {
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }

        const isObjectPayload = typeof payload === 'object' && payload !== null;
        const message = isObjectPayload ? payload.message : payload;
        const replyTo = isObjectPayload ? payload.replyTo : null;

        this.io.to(subRoomName).emit('message', {
            id: crypto.randomUUID(),
            username,
            userProfileImage,
            message,
            replyTo,
            timestamp: new Date().toISOString(),
        });
    }

    private handleImage(socket: Socket, payload: { image: Buffer; description?: string; replyTo?: ReplyContext }): void {
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }

        this.io.to(subRoomName).emit('image', {
            id: crypto.randomUUID(),
            username,
            userProfileImage,
            image: payload.image,
            description: payload.description,
            replyTo: payload.replyTo,
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

        // Broadcast the updated user list after the user has left
        await this._broadcastUserList(subRoomName);
    }
}