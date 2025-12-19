import { IChatAdapter, JoinResult, LeaveResult, RoomState } from '@/services/chat/adapters/base.adapter';
import { Redis as RedisClient } from 'ioredis';

const MAX_USERS_PER_SUBROOM = parseInt(process.env.MAX_USERS_PER_SUBROOM || '20', 10);

// Lua script to join a room atomically
// KEYS[1]: The key for the hash of the main room (e.g. 'room:general')
// ARGV[1]: The maximum number of users per sub-room.
// ARGV[2]: The name of the main room (to build sub-room names).
const joinRoomScript = `
    local roomKey = KEYS[1]
    local maxUsers = tonumber(ARGV[1])
    local parentRoomName = ARGV[2]

    local subRooms = redis.call('HGETALL', roomKey)
    local targetSubRoom = nil
    local totalUsers = 0

    -- try to find an existing sub-room with space
    if #subRooms > 0 then
        for i=1, #subRooms, 2 do
            local subRoomName = subRooms[i]
            -- we make sure not to process metadata fields
            if subRoomName ~= 'nextSubRoomIndex' and subRoomName ~= 'name' then
                local userCount = tonumber(subRooms[i+1])
                totalUsers = totalUsers + userCount
                if userCount < maxUsers and targetSubRoom == nil then
                    targetSubRoom = subRoomName
                end
            end
        end
    end

    -- if a sub room was found, increment its user count
    if targetSubRoom then
        redis.call('HINCRBY', roomKey, targetSubRoom, 1)
        totalUsers = totalUsers + 1
        return {targetSubRoom, totalUsers}
    end

    -- if no sub room was found, create a new one
    -- HSETNX for 'name' ensures that it only sets the field if the room is completely new
    redis.call('HSETNX', roomKey, 'name', parentRoomName)
    local nextIndex = redis.call('HINCRBY', roomKey, 'nextSubRoomIndex', 1)
    local newSubRoomName = parentRoomName .. '-' .. nextIndex
    
    redis.call('HSET', roomKey, newSubRoomName, 1)
    totalUsers = totalUsers + 1
    return {newSubRoomName, totalUsers}
`;

// Lua script to leave a room atomically
// KEYS[1]: The key for the hash of the main room (e.g. 'room:general')
// ARGV[1]: The name of the sub-room to leave.
const leaveRoomScript = `
    local roomKey = KEYS[1]
    local subRoomName = ARGV[1]
    
    -- decrement the user count for the sub-room
    local currentUserCount = tonumber(redis.call('HINCRBY', roomKey, subRoomName, -1))

    -- if the sub-room is empty, remove it from the hash
    if currentUserCount <= 0 then
        redis.call('HDEL', roomKey, subRoomName)
    end
    
    -- calculate the new total number of users in the parent room
    local fields = redis.call('HGETALL', roomKey)
    local totalUsers = 0
    for i=1, #fields, 2 do
        if fields[i] ~= 'nextSubRoomIndex' and fields[i] ~= 'name' then
            totalUsers = totalUsers + tonumber(fields[i+1])
        end
    end

    -- if the parent room is completely empty, delete it
    if totalUsers == 0 then
        redis.call('DEL', roomKey)
        return {0, true}
    end

    return {totalUsers, false}
`;


export class RedisAdapter implements IChatAdapter {
    private redis: RedisClient;

    constructor(redisClient: RedisClient) {
        this.redis = redisClient;
        // Define los scripts en el cliente de Redis para mejorar el rendimiento
        // (evita enviar el script completo en cada llamada)
        if (!this.redis.getBuiltinCommands().includes('joinRoomScript')) {
            this.redis.defineCommand('joinRoomScript', { numberOfKeys: 1, lua: joinRoomScript });
        }
        if (!this.redis.getBuiltinCommands().includes('leaveRoomScript')) {
            this.redis.defineCommand('leaveRoomScript', { numberOfKeys: 1, lua: leaveRoomScript });
        }
    }

    // Declaramos los nuevos comandos para que TypeScript los reconozca.
    private get redisWithScripts(): RedisClient & {
        joinRoomScript: (key: string, maxUsers: number, parentRoomName: string) => Promise<[string, number]>;
        leaveRoomScript: (key: string, subRoomName: string) => Promise<[number, 1 | 0]>;
    } {
        return this.redis as any;
    }

    public async joinRoom(parentRoom: string): Promise<JoinResult> {
        const roomKey = `room:${parentRoom}`;
        const [subRoomName, totalUsers] = await this.redisWithScripts.joinRoomScript(roomKey, MAX_USERS_PER_SUBROOM, parentRoom);
        return { subRoomName: subRoomName, totalUsersInParentRoom: totalUsers };
    }

    public async leaveRoom(parentRoom: string, subRoomName: string): Promise<LeaveResult> {
        const roomKey = `room:${parentRoom}`;
        const [totalUsers, roomCleaned] = await this.redisWithScripts.leaveRoomScript(roomKey, subRoomName);
        return { totalUsersInParentRoom: totalUsers, roomWasCleaned: !!roomCleaned };
    }

    public async getInitialState(): Promise<RoomState> {
        const state: RoomState = {};
        // Usamos SCAN para evitar bloquear el servidor con 'KEYS *' en producción.
        const stream = this.redis.scanStream({ match: 'room:*', count: 100 });

        for await (const keys of stream) {
            if ((keys as string[]).length === 0) continue;

            const pipeline = this.redis.pipeline();
            for (const key of keys as string[]) {
                pipeline.hgetall(key);
            }
            const results = await pipeline.exec();

            (results || []).forEach((res, index) => {
                if (res[1]) { // res[0] es error, res[1] es el objeto del hash
                    const roomData = res[1] as Record<string, string>;
                    const key = keys[index];
                    const parentRoomName = roomData.name || key.replace('room:', '');

                    let totalUsers = 0;
                    for (const field in roomData) {
                        if (field !== 'nextSubRoomIndex' && field !== 'name') {
                            totalUsers += parseInt(roomData[field], 10);
                        }
                    }

                    if (totalUsers > 0) {
                        state[parentRoomName] = { userCount: totalUsers };
                    }
                }
            });
        }
        return state;
    }
}