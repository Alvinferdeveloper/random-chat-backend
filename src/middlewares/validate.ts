import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import ApiError from '../utils/ApiError';

/**
 * Middleware to validate request body, query, and params against a Zod schema.
 * @param schema - The Zod schema to validate against.
 */
export const validate = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.issues.map(err => `${err.message}`).join(', ');
            throw new ApiError(400, `${errorMessage}`);
        }
        next(error);
    }
};
