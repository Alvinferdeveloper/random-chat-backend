import { RequestHandler } from "express";
import { auth } from "../lib/auth";
import logger from "../lib/logger";
import * as UserRepository from '../repositories/user.repository';

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
        .then(async (session) => {
            if (!session || !session.user) {
                return res.status(401).json({ message: "No autorizado" });
            }

            // Check if user is banned
            try {
                const dbUser = await UserRepository.findProfileById(session.user.id);
                if ((dbUser as any).isBanned) {
                    return res.status(403).json({
                        message: "Tu cuenta ha sido suspendida. Contacta con soporte.",
                        reason: (dbUser as any).banReason
                    });
                }
            } catch (error) {
                // If user not found or error, we still allow session if valid? 
                // Better fail safe: if it's a 404 from DB, maybe the user was deleted.
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