export interface SubRoom {
    name: string;
    userCount: number;
}

export interface RoomState {
    [key: string]: {
        userCount: number;
    };
}

export interface JoinResult {
    subRoomName: string;
    totalUsersInParentRoom: number;
}

export interface LeaveResult {
    totalUsersInParentRoom: number;
    roomWasCleaned: boolean;
}

export interface ChatMessage {
    id: string;
    username: string;
    userProfileImage: string | null;
    message?: string;
    imageUrl?: string;
    description?: string;
    replyTo?: ReplyContext;
    reactions: string[];
    timestamp: string;
}

export interface ReplyContext {
    id: string;
    author: string;
    messageSnippet: string;
}

/**
 * Interface for a Chat State Adapter.
 * This contract abstracts the underlying state management implementation (e.g., in-memory, Redis),
 * allowing the ChatService to remain agnostic of the storage mechanism.
 */
export interface IChatAdapter {
    /**
     * Handles the logic of a user joining a parent room, finding or creating a sub-room.
     * @param parentRoom - The main room the user wants to join.
     * @returns The name of the sub-room the user was placed in and the new total user count.
     */
    joinRoom(parentRoom: string): Promise<JoinResult>;

    /**
     * Handles the logic of a user leaving a sub-room.
     * @param parentRoom - The main room the user is leaving.
     * @param subRoomName - The specific sub-room the user is in.
     * @returns The new total user count for the parent room.
     */
    leaveRoom(parentRoom: string, subRoomName: string): Promise<LeaveResult>;

    /**
     * Retrieves the current state of all rooms, typically user counts.
     * @returns An object representing the state of all rooms.
     */
    getInitialState(): Promise<RoomState>;

    /**
     * Saves a message to the chat history for a specific sub-room.
     * @param subRoomName - The sub-room to save the message to.
     * @param message - The message object to save.
     */
    saveMessage(subRoomName: string, message: ChatMessage): Promise<void>;

    /**
     * Retrieves the last N messages from the chat history for a specific sub-room.
     * @param subRoomName - The sub-room to get messages from.
     * @param limit - The maximum number of messages to retrieve.
     * @returns An array of chat messages, ordered from newest to oldest.
     */
    getRecentMessages(subRoomName: string, limit: number): Promise<ChatMessage[]>;
}
