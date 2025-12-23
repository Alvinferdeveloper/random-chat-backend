import * as UserRepository from '../repositories/user.repository';
import { ProfileInfo } from '@/types/user';

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