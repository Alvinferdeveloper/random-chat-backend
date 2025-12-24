import * as UserRepository from '../repositories/user.repository';
import * as HobbyRepository from '../repositories/hobby.repository';
import { ProfileInfo } from '@/types/user';
import ApiError from '../utils/ApiError';

export const completeUserProfile = async (userId: string, profileInfo: ProfileInfo) => {
    const updatedUser = await UserRepository.updateUserProfile(userId, profileInfo);
    return updatedUser;
};

/**
 * Retrieves a user's full profile.
 * @param userId - The ID of the user to retrieve.
 * @returns The user's profile data.
 */
export const getUserProfile = async (userId: string) => {
    const userProfile = await UserRepository.findProfileById(userId);
    return userProfile;
};

/**
 * Updates a single attribute of a user's profile.
 * @param userId - The ID of the user.
 * @param field - The name of the field to update.
 * @param value - The new value.
 */
export const updateUserProfileAttribute = async (userId: string, field: string, value: any) => {
    if (field === 'username') {
        const existingUser = await UserRepository.findByUsername(value);
        if (existingUser && existingUser.id !== userId) {
            throw new ApiError(409, 'El nombre de usuario ya está en uso.');
        }
    }

    if (field === 'selected_hobbies') {
        const hobbiesAreValid = await HobbyRepository.hobbiesExist(value as string[]);
        if (!hobbiesAreValid) {
            throw new ApiError(400, 'Uno o más de los hobbies seleccionados no son válidos.');
        }
    }

    return UserRepository.updateProfileAttribute(userId, field, value);
};