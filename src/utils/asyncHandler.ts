import { Request, Response, NextFunction } from 'express';

// Definimos un tipo para una función de controlador asíncrona
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Envuelve una función de controlador asíncrona para capturar cualquier error
 * y pasarlo al siguiente middleware de manejo de errores de Express.
 * @param fn La función de controlador asíncrona a envolver.
 * @returns Un manejador de peticiones de Express estándar.
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};