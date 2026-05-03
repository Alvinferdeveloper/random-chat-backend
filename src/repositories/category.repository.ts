import prisma from '../lib/prisma';
import ApiError, { ERROR_MESSAGES } from '../utils/ApiError';

export const getAllCategories = async (page: number = 1, limit: number = 10, search?: string) => {
    try {
        const skip = (page - 1) * limit;

        const where = search ? {
            name: { contains: search }
        } : undefined;

        const [data, total] = await prisma.$transaction([
            prisma.category.findMany({
                where,
                orderBy: { name: 'asc' },
                take: limit,
                skip
            }),
            prisma.category.count({ where })
        ]);

        return {
            data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page < Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

export const findCategoryById = async (id: string) => {
    try {
        return await prisma.category.findUnique({
            where: { id }
        });
    } catch (error) {
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

export const findCategoriesByIds = async (ids: string[]) => {
    if (!ids.length) return [];
    try {
        return await prisma.category.findMany({
            where: { id: { in: ids } }
        });
    } catch (error) {
        throw new ApiError(500, ERROR_MESSAGES.INTERNAL_ERROR);
    }
};

export const categoryExists = async (id: string) => {
    const category = await findCategoryById(id);
    return !!category;
};

export const categoriesExist = async (ids: string[]) => {
    if (!ids.length) return false;
    const categories = await findCategoriesByIds(ids);
    return categories.length === ids.length;
};