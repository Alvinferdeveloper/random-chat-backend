import { z } from 'zod';

export const completeUserProfileSchema = z.object({
    body: z.object({
        username: z.string({
            message: 'El nombre de usuario es requerido.',
        }).min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),

        bio: z.string().optional(),
    }),
});
