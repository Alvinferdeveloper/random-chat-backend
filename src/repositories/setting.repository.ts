import prisma from '../lib/prisma';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';

export const getSetting = async (key: string) => {
    try {
        return await prisma.globalSetting.findUnique({
            where: { key }
        });
    } catch (error) {
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

export const getAllSettings = async () => {
    try {
        return await prisma.globalSetting.findMany();
    } catch (error) {
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

export const updateSetting = async (key: string, value: string, description?: string) => {
    try {
        return await prisma.globalSetting.upsert({
            where: { key },
            update: { value, ...(description !== undefined && { description }) },
            create: { key, value, description }
        });
    } catch (error) {
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

/**
 * Helper to get boolean settings easily
 */
export const isEnabled = async (key: string, defaultValue: boolean = true): Promise<boolean> => {
    const setting = await getSetting(key);
    if (!setting) return defaultValue;
    return setting.value === 'true';
};
