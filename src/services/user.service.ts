import prisma from '../lib/prisma';
import ApiError from '../utils/ApiError';


export const completeUserProfile = async (userId: string, username: string, bio: string | undefined) => {
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
        throw new ApiError(500, 'No se pudo actualizar el perfil del usuario.');
    }
};
