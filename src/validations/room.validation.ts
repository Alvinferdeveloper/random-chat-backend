import { z } from 'zod';

export const createRoomSchema = z.object({
    body: z.object({
        name: z.string()
            .min(3, 'El nombre de la sala debe tener al menos 3 caracteres.')
            .max(50, 'El nombre de la sala no puede exceder los 50 caracteres.'),

        short_description: z.string()
            .min(10, 'La descripción corta debe tener al menos 10 caracteres.')
            .max(45, 'La descripción corta no puede exceder los 45 caracteres.'),

        full_description: z.string()
            .min(20, 'La descripción completa debe tener al menos 20 caracteres.')
            .max(300, 'La descripción completa no puede exceder los 300 caracteres.'),

        server_banner: z.string().url().optional(),
        server_icon: z.string().url().optional(),
    }),
});

export const generateRoomUploadUrlSchema = z.object({
    body: z.object({
        type: z.enum(['banner', 'icon'] as const, {
            message: 'El tipo de imagen (banner o icon) es requerido.',
        }),
        contentType: z.string().refine(val => val.startsWith('image/'), 'El contentType debe ser una imagen (ej. image/jpeg).'),
    }),
});

export const updateRoomSchema = z.object({
    body: z.object({
        server_banner: z.string().url('La URL del banner no es válida.').optional(),
        server_icon: z.string().url('La URL del icono no es válida.').optional(),
    }).partial().refine(
        (data) => Object.keys(data).length === 1,
        { message: 'Solo se puede actualizar un campo a la vez.' }
    ),
});
