import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';
import { Room } from '@prisma/client';
import { getRoomsWithActivity } from './user-room-activity.repository';
import { getMultipleActiveUsersCounts } from '../services/room-active-users.service';

const RECENCY_WEIGHT = 0.6;
const POPULARITY_WEIGHT = 0.4;

const calculateScore = (lastInteraction: Date | null, interactionCount: number, activeUsers: number, totalActiveUsers: number): number => {
    let recencyScore = 0;
    if (lastInteraction) {
        const hoursSinceInteraction = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60);
        recencyScore = 1 / (hoursSinceInteraction + 1);
    }
    
    const popularityScore = totalActiveUsers > 0 ? activeUsers / totalActiveUsers : 0;
    
    return (RECENCY_WEIGHT * recencyScore) + (POPULARITY_WEIGHT * popularityScore * 10);
};

/**
 * Finds a room by its unique ID, ensuring it's not logically deleted.
 * @param id - The ID of the room.
 * @returns A promise that resolves to the room object or null if not found.
 * @throws ApiError if an error occurs during the search.
 */
export const findById = async (id: string): Promise<Room | null> => {
    try {
        const room = await prisma.room.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });
        return room;
    } catch (error) {
        throw new ApiError(500, `Error al buscar la sala con id ${id}.`);
    }
};

/**
 * Retrieves a paginated list of rooms, excluding deleted and optionally unaccepted ones.
 * @param page - The page number.
 * @param limit - The items per page.
 * @param options - Optional filters including search string and current user ID for favorite status.
 * @returns Paginated room data.
 * @throws ApiError if an error occurs during the search.
 */
export const findAllPaginated = async (
    page: number,
    limit: number,
    options: { includeAllStatuses?: boolean, search?: string, userId?: string } = {}
) => {
    try {
        const skip = (page - 1) * limit;
        const POOL_SIZE = 500;
        
        const whereCondition: any = {
            deletedAt: null
        };

        if (!options.includeAllStatuses) {
            whereCondition.status = 'ACCEPTED';
        }

        if (options.search) {
            whereCondition.normalized_name = { contains: options.search };
        }

        const [rooms, totalItems] = await prisma.$transaction([
            prisma.room.findMany({
                where: whereCondition,
                orderBy: { created_at: 'desc' },
                take: POOL_SIZE,
                include: options.userId ? {
                    favoritedBy: {
                        where: { userId: options.userId },
                        select: { userId: true }
                    }
                } : undefined
            }),
            prisma.room.count({ where: whereCondition })
        ]);

        if (rooms.length === 0) {
            return {
                data: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    hasNextPage: false
                }
            };
        }

        const roomIds = rooms.map(r => r.id);
        
        let activityMap: Record<string, { lastInteraction: Date; interactionCount: number }> = {};
        let activeUsersMap: Record<string, number> = {};

        if (options.userId && roomIds.length > 0) {
            const activities = await getRoomsWithActivity(options.userId, roomIds);
            activities.forEach(a => {
                activityMap[a.roomId] = {
                    lastInteraction: a.lastInteraction,
                    interactionCount: a.interactionCount
                };
            });

            const userActivityRoomIds = activities.map(a => a.roomId);
            const roomsWithoutActivity = roomIds.filter(id => !userActivityRoomIds.includes(id));
            
            if (roomsWithoutActivity.length > 0) {
                const roomsToAdd = await prisma.room.findMany({
                    where: {
                        id: { in: roomsWithoutActivity },
                        deletedAt: null,
                        ...(options.includeAllStatuses ? {} : { status: 'ACCEPTED' })
                    },
                    take: 100,
                    orderBy: { created_at: 'desc' }
                });

                const existingIds = new Set(rooms.map(r => r.id));
                const newRooms = roomsToAdd.filter(r => !existingIds.has(r.id));
                
                if (newRooms.length > 0) {
                    rooms.push(...newRooms);
                }
            }
        }

        if (roomIds.length > 0) {
            activeUsersMap = await getMultipleActiveUsersCounts(roomIds);
        }

        const totalActiveUsers = Object.values(activeUsersMap).reduce((sum, count) => sum + count, 0);

        const scoredRooms = rooms.map(room => {
            const { favoritedBy, ...roomData } = room as any;
            const activity = activityMap[room.id];
            const activeUsers = activeUsersMap[room.id] || 0;
            
            const score = calculateScore(
                activity?.lastInteraction || null,
                activity?.interactionCount || 0,
                activeUsers,
                totalActiveUsers
            );

            return {
                ...roomData,
                isFavorite: options.userId ? favoritedBy?.length > 0 : false,
                score: Math.round(score * 100) / 100,
                activeUsers
            };
        });

        scoredRooms.sort((a, b) => b.score - a.score);

        const data = scoredRooms.slice(skip, skip + limit);

        return {
            data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                hasNextPage: page < Math.ceil(totalItems / limit)
            }
        };
    } catch (error) {
        throw new ApiError(500, 'No se pudieron obtener las salas de la base de datos.');
    }
};

/**
 * Checks if a non-deleted room with the given normalized name exists.
 * @param normalized_name - The normalized name.
 * @returns True if exists, false otherwise.
 */
export const existsByNameNormalized = async (normalized_name: string): Promise<boolean> => {
    const room = await prisma.room.findFirst({
        where: {
            normalized_name: { equals: normalized_name },
            deletedAt: null
        },
        select: { id: true },
    });
    return !!room;
};

/**
 * Creates a new room.
 * @param roomData - Data for the new room.
 * @throws ApiError if an error occurs during the creation.
 */
export const create = async (roomData: Omit<Room, 'id' | 'created_at' | 'deletedAt'>): Promise<Room> => {
    try {
        const newRoom = await prisma.room.create({
            data: {
                ...roomData,
                server_banner: '',
                server_icon: ''
            }
        });
        return newRoom;
    } catch (error) {
        console.error('Error creating room:', error);
        throw new ApiError(500, 'Error al crear la nueva sala.');
    }
};

/**
 * Updates a single attribute for a room.
 * @param roomId - The ID of the room to update.
 * @param field - The field to update.
 * @param value - The new value for the field.
 * @throws ApiError if an error occurs during the update.
 */
export const updateAttribute = async (roomId: string, field: string, value: any) => {
    try {
        await prisma.room.update({
            where: { id: roomId },
            data: { [field]: value },
        });
    } catch (error) {
        throw new ApiError(500, `No se pudo actualizar el campo ${field} de la sala.`);
    }
};

/**
 * Performs a soft delete on a room by setting its deletedAt field.
 * @param roomId - The ID of the room to delete.
 * @throws ApiError if an error occurs during the deletion.
 */
export const softDelete = async (roomId: string) => {
    try {
        await prisma.room.update({
            where: { id: roomId },
            data: { deletedAt: new Date() }
        });
    } catch (error) {
        throw new ApiError(500, 'No se pudo realizar el borrado lógico de la sala.');
    }
};

/**
 * Retrieves all non-deleted rooms belonging to a specific owner.
 * @param ownerId - The ID of the owner user.
 * @returns A promise that resolves to an array of room objects.
 */
export const findByOwnerId = async (ownerId: string): Promise<Room[]> => {
    try {
        const rooms = await prisma.room.findMany({
            where: {
                ownerId,
                deletedAt: null
            },
            orderBy: { created_at: 'desc' }
        });
        return rooms;
    } catch (error) {
        throw new ApiError(500, 'Error al obtener las salas del usuario.');
    }
};

/**
 * Toggles the favorite status of a room for a user.
 * @param userId - The ID of the user.
 * @param roomId - The ID of the room.
 * @returns A promise that resolves to true if the room is now a favorite, false otherwise.
 */
export const toggleFavorite = async (userId: string, roomId: string): Promise<boolean> => {
    try {
        const existing = await prisma.favoriteRoom.findUnique({
            where: { userId_roomId: { userId, roomId } }
        });

        if (existing) {
            await prisma.favoriteRoom.delete({
                where: { userId_roomId: { userId, roomId } }
            });
            return false;
        } else {
            await prisma.favoriteRoom.create({
                data: { userId, roomId }
            });
            return true;
        }
    } catch (error) {
        throw new ApiError(500, 'Error al actualizar el estado de favoritos.');
    }
};

/**
 * Retrieves all favorite rooms for a specific user, with pagination and search.
 * @param userId - The ID of the user.
 * @param page - The page number.
 * @param limit - The items per page.
 * @param search - Optional search string.
 * @returns Paginated favorite room data.
 */
export const findFavoritesByUserId = async (userId: string, page: number, limit: number, search?: string) => {
    try {
        const skip = (page - 1) * limit;
        const take = limit;

        const whereCondition: any = {
            userId,
            room: {
                deletedAt: null
            }
        };

        if (search) {
            whereCondition.room.normalized_name = { contains: search };
        }

        const [favorites, totalItems] = await prisma.$transaction([
            prisma.favoriteRoom.findMany({
                where: whereCondition,
                skip,
                take,
                include: { room: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.favoriteRoom.count({ where: whereCondition })
        ]);

        const data = favorites.map(f => ({ ...f.room, isFavorite: true }));

        return {
            data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                hasNextPage: page < Math.ceil(totalItems / limit)
            }
        };
    } catch (error) {
        throw new ApiError(500, 'Error al obtener tus salas favoritas.');
    }
};
