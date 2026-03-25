import rateLimit from 'express-rate-limit';

type RateLimitHandler = ReturnType<typeof rateLimit>;

export const generalLimiter: RateLimitHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiadas peticiones, por favor intenta de nuevo más tarde."
    },
    keyGenerator: (req) => req.ip || 'unknown',
});

export const authLimiter: RateLimitHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiados intentos de autenticación, por favor intenta de nuevo en 15 minutos."
    },
    keyGenerator: (req) => `auth:${req.ip}`,
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
    keyGenerator: (req) => `create-room:${req.ip}`,
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
    keyGenerator: (req) => `profile:${req.ip || 'unknown'}`,
});
