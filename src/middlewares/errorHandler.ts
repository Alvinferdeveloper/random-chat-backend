import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = 'Ocurrió un error inesperado en el servidor.';

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        console.error('ERROR NO CONTROLADO:', err);
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

export default errorHandler;
