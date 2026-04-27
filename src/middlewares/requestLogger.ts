import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logMethod = res.statusCode >= 400 ? logger.warn : logger.info;
        
        logMethod('HTTP request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
};