import * as UserRepository from '../repositories/user.repository';

export const completeUserProfile = async (userId: string, username: string, bio: string | undefined) => {
    const updatedUser = await UserRepository.updateProfile(userId, username, bio);
    return updatedUser;
};
