import { RequestHandler } from "express";
import { auth } from "../lib/auth";
import logger from "../lib/logger";

const validateSession: RequestHandler = (
    req,
    res,
    next
) => {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
            headers.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach((v: string) => headers.append(key, v));
        }
    });

    auth.api
        .getSession({ headers })
        .then((session) => {
            if (!session || !session.user) {
                return res.status(401).json({ message: "No autorizado" });
            }
            req.user = session.user;
            next();
        })
        .catch((error) => {
            logger.error('Session validation error', { error: error.message });
            const errorMessage = error?.message || error?.toString() || '';
            if (errorMessage.includes('database') || errorMessage.includes('Prisma')) {
                return res.status(503).json({ message: "Servicio temporalmente no disponible" });
            }
            return res.status(401).json({ message: "Sesión inválida" });
        });
}

export default validateSession;