import { z } from 'zod';
import { SETTING_KEYS } from '../services/setting.service';

const KNOWN_KEYS = Object.values(SETTING_KEYS) as [string, ...string[]];

export const updateSettingSchema = z.object({
    params: z.object({
        key: z.string().min(1, 'La clave no puede estar vacía'),
    }),
    body: z.object({
        value: z.string().min(1, 'El valor no puede estar vacío'),
        description: z.string().max(255).optional(),
    }),
});
