import { Request, Response, NextFunction, RequestHandler } from 'express';

const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS || '[]') as string[];

export const csrfProtection: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    const { method, headers, path } = req;
    
    const isMutatingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '');
    const isAuthRoute = path.startsWith('/api/auth/');
    const isSocketIO = path.startsWith('/socket.io/');

    if (!isMutatingRequest || isAuthRoute || isSocketIO) {
        return next();
    }

    const origin = headers.origin as string | undefined;
    const referer = headers.referer as string | undefined;

    const requestUrl = origin || referer || '';

    if (!requestUrl) {
        res.status(403).json({
            success: false,
            message: 'CSRF validation failed: Missing origin or referer header'
        });
        return;
    }

    const isAllowedOrigin = allowedOrigins.some((allowed: string) => 
        requestUrl.startsWith(allowed) || 
        new URL(requestUrl).origin === new URL(allowed).origin
    );

    if (!isAllowedOrigin) {
        res.status(403).json({
            success: false,
            message: 'CSRF validation failed: Invalid origin'
        });
        return;
    }

    next();
};
