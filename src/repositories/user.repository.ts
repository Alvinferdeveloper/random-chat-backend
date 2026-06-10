import prisma from '../lib/prisma';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';
import { AgeRange, ConversationType } from '@prisma/client'
import { ProfileInfo } from '@/types/user';
import logger from '../lib/logger';

/**
 * Updates a user's profile information.
 * @param userId - The ID of the user to update.
 * @param profileInfo - The new profile information.
 * @returns The updated user.
 * @throws {ApiError} If the username is already taken.
 */
export async function updateUserProfile(userId: string, profileInfo: ProfileInfo) {

    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
    });

    if (!currentUser) {
        throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (profileInfo.username !== currentUser.username) {
        const existingUser = await prisma.user.findUnique({
            where: { username: profileInfo.username },
        });

        if (existingUser) {
            throw new ApiError(409, ERROR_MESSAGES.USERNAME_TAKEN);
        }
    }
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username: profileInfo.username,
                bio: profileInfo.bio,
                location: profileInfo.location,
                ageRange: profileInfo.age_range as AgeRange,
                conversationType: profileInfo.conversation_type as ConversationType,
                hobbies: {
                    set: profileInfo.hobbies.map((hobby) => ({ id: hobby })),
                },
            },
        });
        return updatedUser;
    } catch (error) {
        logger.debug('Error', { error: (error as Error).message });
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
}

/**
 * Finds a user by their ID and returns their image URL.
 * @param userId - The ID of the user to find.
 * @returns The user's image URL or null if not found.
 */
export const findImageById = async (userId: string): Promise<string | null> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { image: true },
        });
        return user?.image ?? null;
    } catch (error) {
        // Log the error but don't crash the chat flow
        logger.error('Error fetching user image', { userId, error: (error as Error).message });
        return null;
    }
};

/**
 * Finds a user by their username.
 * @param username - The username to search for.
 * @returns The user object or null if not found.
 */
export const findByUsername = async (username: string) => {
    try {
        return await prisma.user.findUnique({ where: { username } });
    } catch {
        return null;
    }
}

/**
 * Finds a user's full profile by their username.
 * @param username - The username of the user.
 * @returns The user's profile data.
 * @throws {ApiError} If the user is not found.
 */
export const findProfileByUsername = async (username: string) => {
    logger.debug('Username lookup', { username });
    try {
        const userProfile = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                image: true,
                bio: true,
                location: true,
                ageRange: true,
                conversationType: true,
                hobbies: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                    }
                }
            }
        });

        if (!userProfile) {
            throw new ApiError(404, ERROR_MESSAGES.NOT_FOUND);
        }
        return userProfile;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        logger.error('Error fetching user profile for username', { username, error: (error as Error).message });
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

/**
 * Finds a user's full profile by their ID.
 * @param userId - The ID of the user.
 * @returns The user's profile data.
 * @throws {ApiError} If the user is not found.
 */
export const findProfileById = async (userId: string) => {
    try {
        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                username: true,
                email: true, // Included for completeness, might be removed on frontend
                image: true,
                bio: true,
                location: true,
                ageRange: true,
                conversationType: true,
                isBanned: true,
                banReason: true,
                hobbies: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                    }
                }
            }
        });

        if (!userProfile) {
            throw new ApiError(404, ERROR_MESSAGES.NOT_FOUND);
        }
        return userProfile;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        logger.error('Error fetching user profile', { userId, error: (error as Error).message });
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

/**
 * Finds all users with pagination and search.
 */
export const findAll = async (page: number, limit: number, search?: string) => {
    const skip = (page - 1) * limit;
    const where = search ? {
        OR: [
            { username: { contains: search } },
            { email: { contains: search } },
            { name: { contains: search } },
        ]
    } : {};

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                isBanned: true,
                createdAt: true,
                image: true
            }
        }),
        prisma.user.count({ where })
    ]);

    return {
        users,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Updates a user's ban status.
 */
export const updateBanStatus = async (userId: string, isBanned: boolean, banReason?: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { isBanned, banReason }
    });
};

/**
 * Updates a single attribute for a user's profile.
 * @param userId - The ID of the user to update.
 * @param field - The name of the field to update.
 * @param value - The new value for the field.
 */
const ALLOWED_PROFILE_FIELDS = ['username', 'bio', 'location', 'ageRange', 'conversationType', 'image', 'selected_hobbies'] as const;

export const updateProfileAttribute = (userId: string, field: string, value: any) => {
    if (!ALLOWED_PROFILE_FIELDS.includes(field as typeof ALLOWED_PROFILE_FIELDS[number])) {
        throw new ApiError(400, ERROR_MESSAGES.FIELD_NOT_ALLOWED);
    }

    try {
        let data: any = {};

        if (field === 'selected_hobbies') {
            data.hobbies = {
                set: (value as string[]).map(id => ({ id }))
            };
        } else if (field === 'ageRange') {
            data.ageRange = value as AgeRange;
        } else if (field === 'conversationType') {
            data.conversationType = value as ConversationType;
        } else {
            data[field] = value;
        }

        return prisma.user.update({
            where: { id: userId },
            data,
            include: {
                hobbies: true
            }
        });
    } catch (error) {
        logger.error('Error updating user field', { userId, field, error: (error as Error).message });
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
}
