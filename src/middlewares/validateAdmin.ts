import { RequestHandler } from "express";

const validateAdmin: RequestHandler = (
    req,
    res,
    next
) => {
    if (!req.user) {
        res.status(401).json({ message: "No autorizado" });
        return;
    }

    if (req.user.role !== 'ADMIN') {
        res.status(403).json({ message: "Acceso denegado: Se requieren permisos de administrador" });
        return;
    }

    next();
}

export default validateAdmin;
