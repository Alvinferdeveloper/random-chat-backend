import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';
import { AgeRange, ConversationType } from '@prisma/client'
import { ProfileInfo } from '@/types/user';

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
        throw new ApiError(404, 'User not found.');
    }

    if (profileInfo.username !== currentUser.username) {
        const existingUser = await prisma.user.findUnique({
            where: { username: profileInfo.username },
        });

        if (existingUser) {
            throw new ApiError(409, 'Username already taken.');
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
        console.log(error)
        throw new ApiError(500, 'Internal server errore.');
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
        console.error(`Error fetching user image for userId ${userId}:`, error);
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
    console.log(username);
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
            throw new ApiError(404, 'Perfil de usuario no encontrado.');
        }
        return userProfile;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error(`Error fetching user profile for username ${username}:`, error);
        throw new ApiError(500, 'Error interno del servidor al obtener el perfil.');
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
            throw new ApiError(404, 'Perfil de usuario no encontrado.');
        }
        return userProfile;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error(`Error fetching user profile for userId ${userId}:`, error);
        throw new ApiError(500, 'Error interno del servidor al obtener el perfil.');
    }
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
        throw new ApiError(400, `Field '${field}' is not allowed for update.`);
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
        console.error(`Error updating [${field}] for userId ${userId}:`, error);
        throw new ApiError(500, `No se pudo actualizar el campo ${field}.`);
    }
}
