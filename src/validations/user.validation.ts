import { z } from 'zod';

export const completeUserProfileSchema = z.object({
    body: z.object({
        username: z.string({
            error: 'El nombre de usuario es requerido.',
        }).min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),

        bio: z.string().optional(),
        age_range: z.string().optional(),
        location: z.string().optional(),
        conversation_type: z.string().optional(),
        hobbies: z.array(z.string(), { error: 'Los hobbies deben ser un array de IDs.' }).optional(),
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
        image: z.string().url('La URL de la imagen no es válida.').optional(),
    }).partial().refine(
        (data) => Object.keys(data).length === 1,
        { message: 'Solo se puede actualizar un campo a la vez.' }
    ),
});

export const generateUploadUrlSchema = z.object({
    body: z.object({
        fileName: z.string().min(1, 'El nombre del archivo es requerido.'),
        contentType: z.string().refine(val => val.startsWith('image/'), 'El contentType debe ser una imagen.'),
    }),
});
