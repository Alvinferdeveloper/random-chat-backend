import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";

/**
 * Optional session middleware.
 * Attempts to identify the user from the session headers.
 * If a valid session exists, it attaches the user to req.user.
 * If not, it simply continues without error, treating the user as anonymous.
 */
export default async function optionalSession(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
            headers.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
        }
    });

    auth.api
        .getSession({ headers })
        .then((session) => {
            if (session && session.user) {
                req.user = session.user;
            }
            next();
        })
        .catch(() => next());
}