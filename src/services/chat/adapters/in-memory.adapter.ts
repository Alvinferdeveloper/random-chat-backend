import { IChatAdapter, JoinResult, LeaveResult, RoomState, SubRoom, ChatMessage } from '@/services/chat/adapters/base.adapter';

const MAX_USERS_PER_SUBROOM = parseInt(process.env.MAX_USERS_PER_SUBROOM || '20', 10);
const MAX_MESSAGES_HISTORY = parseInt(process.env.MAX_MESSAGES_HISTORY || '10', 10);

type InMemorySubRoom = {
    name: string;
    users: Record<string, number>; // userId -> number of open tabs/connections
};

type InMemoryRoomValue = {
    subRooms: InMemorySubRoom[];
    nextSubRoomIndex: number;
};

export class InMemoryAdapter implements IChatAdapter {
    private roomState: Record<string, InMemoryRoomValue> = {};
    private messageHistory: Record<string, ChatMessage[]> = {};

    private static instance: InMemoryAdapter | null = null;

    public static getInstance(): InMemoryAdapter {
        if (!InMemoryAdapter.instance) {
            InMemoryAdapter.instance = new InMemoryAdapter();
        }
        return InMemoryAdapter.instance;
    }

    public async joinRoom(parentRoom: string, userId: string): Promise<JoinResult> {
        if (!this.roomState[parentRoom]) {
            this.roomState[parentRoom] = { subRooms: [], nextSubRoomIndex: 1 };
        }

        const room = this.roomState[parentRoom];

        // 1. Priority: Find a sub-room where the user is ALREADY present (Room Affinity)
        // We ignore the MAX_USERS_PER_SUBROOM limit if the user is already there.
        let targetSubRoom = room.subRooms.find(sr => sr.users[userId] !== undefined);

        // 2. Secondary: Find a sub-room that has space for a NEW unique user
        if (!targetSubRoom) {
            targetSubRoom = room.subRooms.find(sr => Object.keys(sr.users).length < MAX_USERS_PER_SUBROOM);
        }

        // 3. Fallback: Create a new sub-room
        if (!targetSubRoom) {
            const subRoomName = `${parentRoom}-${room.nextSubRoomIndex}`;
            targetSubRoom = { name: subRoomName, users: {} };
            room.subRooms.push(targetSubRoom);
            room.nextSubRoomIndex++;
        }

        // Increment connection count for this user in this sub-room
        targetSubRoom.users[userId] = (targetSubRoom.users[userId] || 0) + 1;

        const totalUsersInParentRoom = room.subRooms.reduce((sum, sr) => sum + Object.keys(sr.users).length, 0);

        return { subRoomName: targetSubRoom.name, totalUsersInParentRoom };
    }

    public async leaveRoom(parentRoom: string, subRoomName: string, userId: string): Promise<LeaveResult> {
        const room = this.roomState[parentRoom];
        if (!room) {
            return { totalUsersInParentRoom: 0, roomWasCleaned: false };
        }

        const subRoom = room.subRooms.find(sr => sr.name === subRoomName);
        if (subRoom && subRoom.users[userId]) {
            subRoom.users[userId]--;

            if (subRoom.users[userId] <= 0) {
                delete subRoom.users[userId];
            }

            if (Object.keys(subRoom.users).length <= 0) {
                // Remove the sub-room if it's empty
                room.subRooms = room.subRooms.filter(sr => sr.name !== subRoomName);
            }
        }

        const totalUsersInParentRoom = room.subRooms.reduce((sum, sr) => sum + Object.keys(sr.users).length, 0);

        // If there are no sub-rooms left, clean up the parent room entry
        const roomWasCleaned = room.subRooms.length === 0;
        if (roomWasCleaned) {
            delete this.roomState[parentRoom];
        }

        return { totalUsersInParentRoom, roomWasCleaned };
    }

    public async getInitialState(): Promise<RoomState> {
        const state: RoomState = {};
        for (const roomName in this.roomState) {
            state[roomName] = {
                userCount: this.roomState[roomName].subRooms.reduce((acc, sr) => acc + Object.keys(sr.users).length, 0),
            };
        }
        return state;
    }

    public async saveMessage(subRoomName: string, message: ChatMessage): Promise<void> {
        if (!this.messageHistory[subRoomName]) {
            this.messageHistory[subRoomName] = [];
        }
        this.messageHistory[subRoomName].push(message);
        if (this.messageHistory[subRoomName].length > MAX_MESSAGES_HISTORY) {
            this.messageHistory[subRoomName].shift();
        }
    }

    public async updateMessage(subRoomName: string, messageId: string, updates: Partial<Pick<ChatMessage, 'message'>>): Promise<void> {
        const messages = this.messageHistory[subRoomName];
        if (!messages) return;

        const index = messages.findIndex(m => m.id === messageId);
        if (index === -1) return;

        const message = messages[index];
        if (updates.message !== undefined) {
            message.message = updates.message;
        }
        message.edited = true;
    }

    public async deleteMessage(subRoomName: string, messageId: string): Promise<void> {
        const messages = this.messageHistory[subRoomName];
        if (!messages) return;

        const index = messages.findIndex(m => m.id === messageId);
        if (index === -1) return;

        messages.splice(index, 1);
    }

    public async getRecentMessages(subRoomName: string, limit: number): Promise<ChatMessage[]> {
        const messages = this.messageHistory[subRoomName] || [];
        return messages.slice(0, limit);
    }

    public static getActiveUsersCounts(roomIds: string[]): Record<string, number> {
        const instance = InMemoryAdapter.getInstance();
        const result: Record<string, number> = {};
        for (const roomId of roomIds) {
            const room = instance.roomState[roomId];
            if (room) {
                result[roomId] = room.subRooms.reduce((sum: number, sr: InMemorySubRoom) => sum + Object.keys(sr.users).length, 0);
            } else {
                result[roomId] = 0;
            }
        }
        return result;
    }

    public static getAllActiveUsersCounts(): Record<string, number> {
        const instance = InMemoryAdapter.getInstance();
        const result: Record<string, number> = {};
        for (const roomName in instance.roomState) {
            result[roomName] = instance.roomState[roomName].subRooms.reduce((acc: number, sr: InMemorySubRoom) => acc + Object.keys(sr.users).length, 0);
        }
        return result;
    }

    public static getTotalOnlineUsers(): number {
        const instance = InMemoryAdapter.getInstance();
        let total = 0;
        for (const roomName in instance.roomState) {
            total += instance.roomState[roomName].subRooms.reduce((acc: number, sr: InMemorySubRoom) => acc + Object.keys(sr.users).length, 0);
        }
        return total;
    }

    public static getTopActiveRooms(limit: number): Array<{ roomId: string; userCount: number }> {
        const instance = InMemoryAdapter.getInstance();
        const rooms: Array<{ roomId: string; userCount: number }> = [];
        for (const roomName in instance.roomState) {
            const userCount = instance.roomState[roomName].subRooms.reduce((acc: number, sr: InMemorySubRoom) => acc + Object.keys(sr.users).length, 0);
            if (userCount > 0) {
                rooms.push({ roomId: roomName, userCount });
            }
        }
        return rooms.sort((a, b) => b.userCount - a.userCount).slice(0, limit);
    }
}
