import * as UserRepository from '../repositories/user.repository';
import { ProfileInfo } from '@/types/user';

export const completeUserProfile = async (userId: string, profileInfo: ProfileInfo) => {
    const updatedUser = await UserRepository.updateUserProfile(userId, profileInfo);
    return updatedUser;
};
