import { z } from 'zod';

export const createReportSchema = z.object({
    body: z.object({
        reportedUserId: z.string({ error: "El ID del usuario reportado es obligatorio." }),
        roomId: z.string().uuid("ID de sala inválido").optional(),
        reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'HATE_SPEECH', 'ANNOYING_BEHAVIOR', 'OTHER'], {
            error: "Motivo de reporte no válido."
        }),
        details: z.string().max(255, "Los detalles no pueden exceder los 255 caracteres.").optional()
    })
});

export const getTopOffendersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(10),
        search: z.string().optional(),
    })
});

export const resolveReportsSchema = z.object({
    params: z.object({
        userId: z.string(),
    }),
    body: z.object({
        status: z.enum(['RESOLVED', 'DISMISSED'], {
            error: "Estado de resolución no válido."
        })
    })
});
