import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';
import { User } from '@prisma/client'

/**
 * Updates a user's profile information.
 * @param userId - The ID of the user to update.
 * @param username - The new username.
 * @param bio - The new bio.
 * @returns The updated user.
 * @throws {ApiError} If the username is already taken.
 */
export const updateProfile = async (userId: string, username: string, bio: string | undefined): Promise<User> => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username: username.toLowerCase(),
                bio,
            },
        });
        return updatedUser;
    } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            throw new ApiError(409, 'Este nombre de usuario ya está en uso.');
        }
        throw new ApiError(500, 'No se pudo actualizar el perfil del usuario en la base de datos.');
    }
};
