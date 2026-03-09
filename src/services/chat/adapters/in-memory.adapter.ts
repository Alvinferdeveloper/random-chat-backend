import { IChatAdapter, JoinResult, LeaveResult, RoomState, SubRoom, ChatMessage } from '@/services/chat/adapters/base.adapter';

const MAX_USERS_PER_SUBROOM = parseInt(process.env.MAX_USERS_PER_SUBROOM || '20', 10);
const MAX_MESSAGES_HISTORY = parseInt(process.env.MAX_MESSAGES_HISTORY || '10', 10);

type InMemorySubRoom = {
    name: string;
    userCount: number;
};

type InMemoryRoomValue = {
    subRooms: InMemorySubRoom[];
    nextSubRoomIndex: number;
};

const roomState: Record<string, InMemoryRoomValue> = {};
const messageHistory: Record<string, ChatMessage[]> = {};

/**
 * An in-memory implementation of the IChatAdapter.
 * It uses a simple JavaScript object to store the chat state.
 * This is suitable for MVP/development but not for a scalable production environment.
 */
export class InMemoryAdapter implements IChatAdapter {

    public async joinRoom(parentRoom: string): Promise<JoinResult> {
        if (!roomState[parentRoom]) {
            roomState[parentRoom] = { subRooms: [], nextSubRoomIndex: 1 };
        }

        const room = roomState[parentRoom];
        let targetSubRoom = room.subRooms.find(sr => sr.userCount < MAX_USERS_PER_SUBROOM);

        if (!targetSubRoom) {
            const subRoomName = `${parentRoom}-${room.nextSubRoomIndex}`;
            targetSubRoom = { name: subRoomName, userCount: 0 };
            room.subRooms.push(targetSubRoom);
            room.nextSubRoomIndex++;
        }

        targetSubRoom.userCount++;

        const totalUsersInParentRoom = room.subRooms.reduce((sum, sr) => sum + sr.userCount, 0);

        return { subRoomName: targetSubRoom.name, totalUsersInParentRoom };
    }

    public async leaveRoom(parentRoom: string, subRoomName: string): Promise<LeaveResult> {
        const room = roomState[parentRoom];
        if (!room) {
            return { totalUsersInParentRoom: 0, roomWasCleaned: false };
        }

        const subRoom = room.subRooms.find(sr => sr.name === subRoomName);
        if (subRoom) {
            subRoom.userCount--;

            if (subRoom.userCount <= 0) {
                // Remove the sub-room if it's empty
                room.subRooms = room.subRooms.filter(sr => sr.name !== subRoomName);
            }
        }

        const totalUsersInParentRoom = room.subRooms.reduce((sum, sr) => sum + sr.userCount, 0);

        // If there are no sub-rooms left, clean up the parent room entry
        const roomWasCleaned = room.subRooms.length === 0;
        if (roomWasCleaned) {
            delete roomState[parentRoom];
        }

        return { totalUsersInParentRoom, roomWasCleaned };
    }

    public async getInitialState(): Promise<RoomState> {
        const state: RoomState = {};
        for (const roomName in roomState) {
            state[roomName] = {
                userCount: roomState[roomName].subRooms.reduce((acc, sr) => acc + sr.userCount, 0),
            };
        }
        return state;
    }

    public async saveMessage(subRoomName: string, message: ChatMessage): Promise<void> {
        if (!messageHistory[subRoomName]) {
            messageHistory[subRoomName] = [];
        }
        messageHistory[subRoomName].unshift(message);
        if (messageHistory[subRoomName].length > MAX_MESSAGES_HISTORY) {
            messageHistory[subRoomName].pop();
        }
    }

    public async getRecentMessages(subRoomName: string, limit: number): Promise<ChatMessage[]> {
        const messages = messageHistory[subRoomName] || [];
        return messages.slice(0, limit);
    }

    public static getActiveUsersCounts(roomIds: string[]): Record<string, number> {
        const result: Record<string, number> = {};
        for (const roomId of roomIds) {
            const room = roomState[roomId];
            if (room) {
                result[roomId] = room.subRooms.reduce((sum, sr) => sum + sr.userCount, 0);
            } else {
                result[roomId] = 0;
            }
        }
        return result;
    }

    public static getAllActiveUsersCounts(): Record<string, number> {
        const result: Record<string, number> = {};
        for (const roomName in roomState) {
            result[roomName] = roomState[roomName].subRooms.reduce((acc, sr) => acc + sr.userCount, 0);
        }
        return result;
    }
}
