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
        console.error(`Error fetching user image for userId ${userId}:`, error);
        return null;
    }
};