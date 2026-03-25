import { z } from 'zod';

export const getRoomsByStatusSchema = z.object({
    query: z.object({
        status: z.enum(['IN_REVISION', 'ACCEPTED', 'REJECTED']).optional().default('IN_REVISION'),
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().max(100).optional().default(10),
    }),
});

export const updateRoomStatusSchema = z.object({
    params: z.object({
        roomId: z.string().uuid('ID de sala inválido'),
    }),
    body: z.object({
        status: z.enum(['IN_REVISION', 'ACCEPTED', 'REJECTED'], {
            error: 'Estado de sala no válido.',
        }),
    }),
});
