import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(45),
        icon: z.string().max(200).optional()
    })
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string()
    }),
    body: z.object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(45).optional(),
        icon: z.string().max(200).optional()
    })
});

export const deleteCategorySchema = z.object({
    params: z.object({
        id: z.string()
    })
});
