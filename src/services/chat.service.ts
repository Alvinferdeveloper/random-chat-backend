import { Server, Socket } from 'socket.io';
import { roomExists } from './room.service';

const MAX_USERS_PER_SUBROOM = process.env.MAX_USERS_PER_SUBROOM || 20;
type subRoom = {
    name: string;
    usercount: number;
};

type RoomStateValue = {
    subRooms: subRoom[];
    nextSubRoom: number;
};

const roomState: Record<string, RoomStateValue> = {};

export class ChatService {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    public handleConnection(socket: Socket): void {
        socket.on('get-initial-room-state', () => this.getInitialRoomState(socket));
        socket.on('join-room', (room, username) => this.joinRoom(socket, room, username));
        socket.on('leave-room', () => this.leaveRoom(socket));
        socket.on('message', (message) => this.handleMessage(socket, message));
        socket.on('image', (data) => this.handleImage(socket, data));
        socket.on('disconnecting', () => this.handleDisconnect(socket));
    }

    private getInitialRoomState(socket: Socket): void {
        const state = Object.fromEntries(
            Object.entries(roomState).map(([room, state]) => [
                room,
                { userCount: state.subRooms.reduce((acc, sr) => acc + sr.usercount, 0) }
            ])
        );
        socket.emit('initial-room-state', state);
    }

    private async joinRoom(socket: Socket, parentRoom: string, username: string): Promise<void> {
        if (!await roomExists(parentRoom)) {
            socket.emit('error', 'La sala no existe');
            return;
        }

        if (!roomState[parentRoom]) {
            roomState[parentRoom] = { subRooms: [], nextSubRoom: 1 };
        }

        let targetSubRoom = roomState[parentRoom].subRooms.find(sr => sr.usercount < parseInt(MAX_USERS_PER_SUBROOM.toString()));

        if (!targetSubRoom) {
            const subRoomName = `${parentRoom}-${roomState[parentRoom].nextSubRoom}`;
            targetSubRoom = { name: subRoomName, usercount: 0 };
            roomState[parentRoom].subRooms.push(targetSubRoom);
            roomState[parentRoom].nextSubRoom++;
        }

        await socket.join(targetSubRoom.name);
        targetSubRoom.usercount++;

        socket.data.username = username;
        socket.data.subRoomName = targetSubRoom.name;
        socket.data.parentRoom = parentRoom;

        socket.broadcast.to(targetSubRoom.name).emit('user-joined', {
            username: username,
            system: true,
            message: 'se ha unido a la sala.',
            timestamp: new Date().toISOString(),
        });

        const totalUsers = roomState[parentRoom].subRooms.reduce((sum, sr) => sum + sr.usercount, 0);
        this.io.emit('user-count', { roomId: parentRoom, count: totalUsers });
    }



    private leaveRoom(socket: Socket): void {
        const { subRoomName } = socket.data;
        if (subRoomName) {
            socket.leave(subRoomName);
            this.handleDisconnect(socket);
        }
    }

    private handleMessage(socket: Socket, message: string): void {
        const room = socket.data.subRoomName
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

    private handleDisconnect(socket: Socket): void {
        const { parentRoom, subRoomName, username } = socket.data;

        if (!parentRoom || !subRoomName) {
            return;
        }

        const roomData = roomState[parentRoom];
        if (!roomData) return;

        const subRoom = roomData.subRooms.find(sr => sr.name === subRoomName);
        if (subRoom) {
            subRoom.usercount--;

            socket.to(subRoomName).emit('user-left', `${username || 'Anónimo'} ha salido de la sala.`);

            if (subRoom.usercount <= 0) {
                roomData.subRooms = roomData.subRooms.filter(sr => sr.name !== subRoomName);
            }

            const totalUsers = roomData.subRooms.reduce((sum, sr) => sum + sr.usercount, 0);
            this.io.emit('user-count', { roomId: parentRoom, count: totalUsers });
        }
    }
}
