import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        // Color codes
        const methodColors: Record<string, string> = {
            GET: '\x1b[32m',     // Green
            POST: '\x1b[33m',    // Yellow
            PATCH: '\x1b[36m',   // Cyan
            PUT: '\x1b[34m',     // Blue
            DELETE: '\x1b[31m',  // Red
            OPTIONS: '\x1b[35m', // Magenta
        };
        const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
        const reset = '\x1b[0m';
        const dim = '\x1b[2m';
        const methodColor = methodColors[req.method] || '\x1b[37m';

        console.log(
            `${dim}${timestamp}${reset} ${methodColor}${req.method.padEnd(7)}${reset} ${req.originalUrl} ${statusColor}${status}${reset} ${dim}${duration}ms${reset}`
        );
    });

    next();
};