import * as RoomRepository from '../repositories/room.repository';
import ApiError from '../utils/ApiError';
import { Room } from '@prisma/client';
import { getRedisClient } from '../lib/redis';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

/**
 * Normalizes a string for similarity comparison.
 * Converts to lowercase, removes diacritics, and removes non-alphanumeric characters.
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
const normalizeString = (str: string): string => {
    return str
        .toLowerCase()
        .normalize("NFD") // Decompose accents from letters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9]/g, ""); // Remove non-alphanumeric characters
};

export const roomExists = async (id: string) => {
    return RoomRepository.findById(id);
};

/**
 * Retrieves a paginated list of all rooms.
 * @param page - The page number.
 * @param limit - The number of items per page.
 * @param search - Optional search string.
 * @param userId - Optional ID of the current user to include favorite status.
 * @returns The paginated room data.
 */
export const getAllRooms = async (page: number, limit: number, search?: string, userId?: string) => {
    const normalizedSearch = search ? normalizeString(search) : undefined;
    const paginatedRooms = await RoomRepository.findAllPaginated(page, limit, {
        search: normalizedSearch,
        userId
    });
    return paginatedRooms;
};

/**
 * Creates a new room after validating for similarity and applying rate limits.
 * @param roomData - The data for the new room.
 * @param userId - The ID of the user creating the room (for rate limiting).
 * @returns The newly created room object.
 * @throws {ApiError} If a similar room name already exists or if rate limit is exceeded.
 */

const ROOM_LIMITS = {
    MAX_PER_DAY: parseInt(process.env.MAX_ROOMS_PER_DAY || '1'),
    SECONDS_IN_DAY: 24 * 60 * 60
};

export const createRoom = async (roomData: Omit<Room, 'id' | 'created_at'>, userId: string): Promise<Room> => {
    const isRedisActive = process.env.CHAT_ADAPTER === 'redis';
    const redisClient = isRedisActive ? getRedisClient() : null;
    const RATE_LIMIT_KEY = `rate_limit:create_room:${userId}`;

    if (redisClient) {
        const currentCount = await redisClient.get(RATE_LIMIT_KEY);

        if (currentCount && parseInt(currentCount) >= ROOM_LIMITS.MAX_PER_DAY) {
            throw new ApiError(429, `Límite diario alcanzado (${ROOM_LIMITS.MAX_PER_DAY} salas).`);
        }
    }

    const newRoomNormalized = normalizeString(roomData.name);
    if (newRoomNormalized.length < 3) {
        throw new ApiError(400, 'Room name is too short or invalid.');
    }

    const nameExists = await RoomRepository.existsByNameNormalized(newRoomNormalized);

    if (nameExists) {
        throw new ApiError(409, 'A room with a very similar name already exists.');
    }

    const newRoom = await RoomRepository.create({
        ...roomData,
        ownerId: userId,
        normalized_name: newRoomNormalized
    });

    if (redisClient) {
        const newCount = await redisClient.incr(RATE_LIMIT_KEY);

        if (newCount === 1) {
            await redisClient.expire(RATE_LIMIT_KEY, ROOM_LIMITS.SECONDS_IN_DAY);
        }
    }

    return newRoom;
};

/**
 * Generates a pre-signed URL for uploading a room's image to Supabase Storage.
 * @param roomId - The ID of the room.
 * @param type - The type of image ('banner' or 'icon').
 * @param contentType - The content type of the image.
 * @param userId - The ID of the user requesting the URL, for permission check.
 * @returns An object containing the signed upload URL and the public URL.
 */
export const generateRoomUploadUrl = async (roomId: string, type: 'banner' | 'icon', contentType: string, userId: string) => {
    const room = await RoomRepository.findById(roomId);
    if (!room) {
        throw new ApiError(404, 'La sala no existe.');
    }
    if (room.ownerId !== userId) {
        throw new ApiError(403, 'No tienes permiso para editar esta sala.');
    }

    const bucketName = 'rooms-assets';
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const filePath = `${roomId}/${type}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(filePath, {
            upsert: true,
        });

    if (uploadError) {
        logger.error('Supabase createSignedUploadUrl error', { error: uploadError.message });
        return null;
    }

    const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    if (!publicUrlData) {
        return null;
    }

    return {
        signedUploadUrl: uploadData.signedUrl,
        publicUrl: publicUrlData.publicUrl,
    };
};

/**
 * Updates a single attribute of a room.
 * @param roomId - The ID of the room.
 * @param field - The name of the field to update.
 * @param value - The new value.
 * @param userId - The ID of the user requesting the update, for permission check.
 */
export const updateRoomAttribute = async (roomId: string, field: string, value: any, userId: string) => {
    // Whitelist allowed fields to prevent Mass Assignment
    const allowedFields = ['server_banner', 'server_icon', 'name', 'short_description', 'full_description'];
    if (!allowedFields.includes(field)) {
        throw new ApiError(400, 'El campo proporcionado no es válido para actualización.');
    }

    // Basic URL validation ONLY if it's an image field
    if (['server_banner', 'server_icon'].includes(field)) {
        if (typeof value !== 'string' || !value.startsWith('http')) {
            throw new ApiError(400, 'El valor proporcionado debe ser una URL válida.');
        }
    }

    const room = await RoomRepository.findById(roomId);
    if (!room) {
        throw new ApiError(404, 'La sala no existe.');
    }
    if (room.ownerId !== userId) {
        throw new ApiError(403, 'No tienes permiso para editar esta sala.');
    }

    // Special logic for 'name' to update normalized_name and check for duplicates
    if (field === 'name') {
        const normalized = normalizeString(value);
        if (normalized.length < 3) {
            throw new ApiError(400, 'El nombre de la sala es demasiado corto.');
        }

        // Only check for duplicates if the name actually changed its normalized version
        if (normalized !== room.normalized_name) {
            const exists = await RoomRepository.existsByNameNormalized(normalized);
            if (exists) {
                throw new ApiError(409, 'Ya existe una sala con un nombre muy similar.');
            }
        }

        // Update name AND normalized_name together
        await RoomRepository.updateAttribute(roomId, 'name', value);
        await RoomRepository.updateAttribute(roomId, 'normalized_name', normalized);
    } else {
        await RoomRepository.updateAttribute(roomId, field, value);
    }
};

/**
 * Retrieves all rooms created by a specific user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of rooms.
 */
export const getUserRooms = async (userId: string) => {
    return RoomRepository.findByOwnerId(userId);
};

/**
 * Toggles a room as favorite for a user.
 * @param userId - The ID of the user.
 * @param roomId - The ID of the room.
 * @returns The new favorite status.
 */
export const toggleFavoriteRoom = async (userId: string, roomId: string) => {
    return RoomRepository.toggleFavorite(userId, roomId);
};

/**
 * Retrieves all favorite rooms for a user, with pagination and search.
 * @param userId - The ID of the user.
 * @param page - The page number.
 * @param limit - The items per page.
 * @param search - Optional search string.
 */
export const getUserFavoriteRooms = async (userId: string, page: number, limit: number, search?: string) => {
    const normalizedSearch = search ? normalizeString(search) : undefined;
    return RoomRepository.findFavoritesByUserId(userId, page, limit, normalizedSearch);
};
