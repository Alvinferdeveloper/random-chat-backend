import * as UserRepository from '../repositories/user.repository';
import * as HobbyRepository from '../repositories/hobby.repository';
import { ProfileInfo } from '@/types/user';
import ApiError from '../utils/ApiError';
import { supabase } from '@/lib/supabase';

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
    return UserRepository.findProfileById(userId);
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

/**
 * Generates a pre-signed URL for uploading a user's profile image to Supabase Storage.
 * @param userId - The ID of the user.
 * @param fileName - The desired file name for the image.
 * @returns An object containing the signed upload URL and the public URL of the file.
 * @throws {ApiError} If there is an error generating the signed URL.
 */
export const generateProfileUploadUrl = async (userId: string, fileName: string) => {
    const bucketName = 'avatars';
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(filePath, {
            upsert: true,
        });

    if (uploadError) {
        console.error('Supabase createSignedUploadUrl error:', uploadError);
        throw new ApiError(500, 'Error al generar la URL de subida pre-firmada.');
    }

    const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    if (!publicUrlData) {
        throw new ApiError(500, 'Error al obtener la URL pública de la imagen.');
    }

    return {
        signedUploadUrl: uploadData.signedUrl,
        publicUrl: publicUrlData.publicUrl,
    };
};
