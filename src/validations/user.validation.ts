import { z } from 'zod';

export const completeUserProfileSchema = z.object({
    body: z.object({
        username: z.string({
            error: 'El nombre de usuario es requerido.',
        }).min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
        bio: z.string().optional(),
    }),
});

export const updateUserProfileSchema = z.object({
    body: z.object({
        username: z.string().min(3, 'El nombre de usuario debe tener entre 3 y 20 caracteres.').max(20, 'El nombre de usuario debe tener entre 3 y 20 caracteres.').optional(),
        bio: z.string().max(200, 'La biografía no puede exceder los 200 caracteres.').optional(),
        location: z.string().optional(),
        ageRange: z.string().optional(),
        conversationType: z.string().optional(),
        selected_hobbies: z.array(z.string(), { error: 'Los hobbies deben ser un array de IDs.' }).optional(),
    }).partial().refine(
        (data) => Object.keys(data).length === 1,
        { message: 'Solo se puede actualizar un campo a la vez.' }
    ),
});