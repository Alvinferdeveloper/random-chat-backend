import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";

export default function validateSession(
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
            console.log(session, "session");
            if (!session || !session.user) {
                return res.status(401).json({ message: "No autorizado" });
            }
            req.user = session.user;
            next();
        })
        .catch(() => res.status(401).json({ message: "Sesión inválida" }));
}
