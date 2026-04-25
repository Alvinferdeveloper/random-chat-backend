import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

type RateLimitHandler = ReturnType<typeof rateLimit>;

const keyGenerator = (req: Request) => {
    if (req.user?.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req.ip || 'unknown');
};

export const generalLimiter: RateLimitHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiadas peticiones, por favor intenta de nuevo más tarde."
    },
    keyGenerator,
});

export const authLimiter: RateLimitHandler = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiados intentos de autenticación, por favor intenta de nuevo en 15 minutos."
    },
    keyGenerator,
});

export const createRoomLimiter: RateLimitHandler = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Has creado demasiadas salas. Intenta de nuevo en una hora."
    },
    keyGenerator,
});

export const profileUpdateLimiter: RateLimitHandler = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Estás realizando demasiadas actualizaciones. Reduce el ritmo."
    },
    keyGenerator,
});

export const listLimiter: RateLimitHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 800,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Estás navegando demasiado rápido. Por favor, espera un momento."
    },
    keyGenerator,
});
