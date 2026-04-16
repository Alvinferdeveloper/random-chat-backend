import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import { roomExists } from '../room.service';
import { IChatAdapter, ChatMessage } from './adapters/base.adapter';
import * as UserRepository from '../../repositories/user.repository';
import { supabase } from '@/lib/supabase';
import ApiError from '@/utils/ApiError';

const MAX_MESSAGES_HISTORY = parseInt(process.env.MAX_MESSAGES_HISTORY || '10', 10);

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
            const uniqueUsers = new Map();

            for (const socket of sockets) {
                const userId = socket.data.userId;
                if (!uniqueUsers.has(userId)) {
                    uniqueUsers.set(userId, {
                        id: userId, // Use userId as the unique identifier
                        username: socket.data.username,
                        profileImage: socket.data.userProfileImage,
                    });
                }
            }

            const userList = Array.from(uniqueUsers.values());
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

        socket.on('request-chat-image-upload', (payload) => this.handleRequestChatImageUpload(socket, payload));
        socket.on('image', (payload) => this.handleImage(socket, payload));
        socket.on('audio', (payload) => this.handleAudio(socket, payload));
        socket.on('gif', (payload) => this.handleGif(socket, payload));

        socket.on('send_reaction', (payload) => this.handleSendReaction(socket, payload));
        socket.on('start-typing', () => this.handleStartTyping(socket));
        socket.on('stop-typing', () => this.handleStopTyping(socket));
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

        const userId = socket.data.user?.id || clientUsername;

        const { subRoomName, totalUsersInParentRoom } = await this.adapter.joinRoom(parentRoom, userId);
        await socket.join(subRoomName);

        let finalUsername = clientUsername;
        let userProfileImage: string | null = null;

        if (socket.data.user) {
            const sessionUser = socket.data.user;
            finalUsername = sessionUser.name;
            userProfileImage = await UserRepository.findImageById(sessionUser.id);
        }

        socket.data.username = finalUsername;
        socket.data.userId = userId;
        socket.data.userProfileImage = userProfileImage;
        socket.data.subRoomName = subRoomName;
        socket.data.parentRoom = parentRoom;

        const recentMessages = await this.adapter.getRecentMessages(subRoomName, MAX_MESSAGES_HISTORY);
        socket.emit('message-history', recentMessages);

        socket.broadcast.to(subRoomName).emit('user-joined', {
            username: finalUsername,
            system: true,
            message: 'se ha unido a la sala.',
            timestamp: new Date().toISOString(),
        });

        this.io.emit('user-count', { roomId: parentRoom, count: totalUsersInParentRoom });

        await this._broadcastUserList(subRoomName);
    }

    private async leaveRoom(socket: Socket): Promise<void> {
        const { parentRoom, subRoomName } = socket.data;
        if (subRoomName && parentRoom) {
            socket.leave(subRoomName);
            await this.handleDisconnect(socket);
        }
    }

    private async handleMessage(socket: Socket, payload: string | { message: string; replyTo?: ReplyContext }): Promise<void> {
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }

        const isObjectPayload = typeof payload === 'object' && payload !== null;
        const messageContent = isObjectPayload ? payload.message : payload;
        const replyTo = isObjectPayload ? payload.replyTo : undefined;

        const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            username,
            userProfileImage,
            message: messageContent,
            replyTo,
            reactions: [],
            timestamp: new Date().toISOString(),
        };

        this.io.to(subRoomName).emit('message', chatMessage);
        await this.adapter.saveMessage(subRoomName, chatMessage);
        this.handleStopTyping(socket);
    }

    private async handleRequestChatImageUpload(socket: Socket, payload: { contentType: string, tempId: string }) {
        const { subRoomName, user } = socket.data;
        if (!subRoomName) return socket.emit('error', 'No estás en una sala para enviar imágenes.');

        try {
            const bucketName = 'chat-images';
            const fileExtension = payload.contentType.split('/')[1] || 'jpg';
            const userIdForImage = user ? user.id : 'anonymous';
            const filePath = `${subRoomName}/${userIdForImage}-${Date.now()}.${fileExtension}`;

            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUploadUrl(filePath, { upsert: false });

            if (error) throw new ApiError(500, 'Error al generar la URL de subida pre-firmada.');

            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            socket.emit('grant-chat-image-upload', {
                tempId: payload.tempId,
                signedUploadUrl: data.signedUrl,
                publicUrl: publicUrlData.publicUrl,
            });
        } catch (error) {
            console.error('Error handling request for chat image upload:', error);
            socket.emit('error', 'No se pudo procesar la subida de la imagen.');
        }
    }

    private async handleImage(socket: Socket, payload: { imageUrl: string; description?: string; replyTo?: ReplyContext; tempId?: string }): Promise<void> {
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }

        const chatMessage = {
            id: crypto.randomUUID(),
            username,
            userProfileImage,
            imageUrl: payload.imageUrl,
            description: payload.description,
            replyTo: payload.replyTo,
            reactions: [],
            timestamp: new Date().toISOString(),
            tempId: payload.tempId // Keep track of optimistic ID
        };

        this.io.to(subRoomName).emit('image', chatMessage);
        await this.adapter.saveMessage(subRoomName, chatMessage);
        this.handleStopTyping(socket);
    }

    private async handleAudio(socket: Socket, payload: { audioUrl: string; duration?: number; replyTo?: ReplyContext; tempId?: string }): Promise<void> {
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }

        const chatMessage = {
            id: crypto.randomUUID(),
            username,
            userProfileImage,
            audioUrl: payload.audioUrl,
            duration: payload.duration,
            replyTo: payload.replyTo,
            reactions: [],
            timestamp: new Date().toISOString(),
            tempId: payload.tempId
        };

        this.io.to(subRoomName).emit('audio', chatMessage);
        await this.adapter.saveMessage(subRoomName, chatMessage);
        this.handleStopTyping(socket);
    }

    private async handleGif(socket: Socket, payload: { gifUrl: string; replyTo?: ReplyContext }): Promise<void> {
        const { subRoomName, username, userProfileImage } = socket.data;
        if (!subRoomName) {
            socket.emit('error', 'No estás en una sala');
            return;
        }

        const chatMessage = {
            id: crypto.randomUUID(),
            username,
            userProfileImage,
            gifUrl: payload.gifUrl,
            replyTo: payload.replyTo,
            reactions: [],
            timestamp: new Date().toISOString(),
        };

        this.io.to(subRoomName).emit('gif', chatMessage);
        await this.adapter.saveMessage(subRoomName, chatMessage);
        this.handleStopTyping(socket);
    }

    private handleSendReaction(socket: Socket, payload: { messageId: string; emoji: string }): void {
        const { subRoomName, username } = socket.data;
        if (!subRoomName) return;

        this.io.to(subRoomName).emit('reaction_update', {
            messageId: payload.messageId,
            emoji: payload.emoji,
            reactingUsername: username,
        });
    }

    private handleStartTyping(socket: Socket): void {
        const { subRoomName, username } = socket.data;
        if (!subRoomName || !username) return;

        socket.broadcast.to(subRoomName).emit('user-started-typing', { username });
    }

    private handleStopTyping(socket: Socket): void {
        const { subRoomName, username } = socket.data;
        if (!subRoomName || !username) return;

        socket.broadcast.to(subRoomName).emit('user-stopped-typing', { username });
    }

    private async handleDisconnect(socket: Socket): Promise<void> {
        const { parentRoom, subRoomName, username, userId } = socket.data;
        if (!parentRoom || !subRoomName || !userId) return;

        this.handleStopTyping(socket);
        const { totalUsersInParentRoom } = await this.adapter.leaveRoom(parentRoom, subRoomName, userId);

        socket.to(subRoomName).emit('user-left', `${username || 'Anónimo'} ha salido de la sala.`);
        this.io.emit('user-count', { roomId: parentRoom, count: totalUsersInParentRoom });
        await this._broadcastUserList(subRoomName);
    }
}
