import { RequestHandler } from 'express';
import { isFeatureEnabled, SETTING_KEYS } from '../services/setting.service';
import { auth } from '../lib/auth';
import logger from '../lib/logger';
import { ERROR_MESSAGES } from '../lib/errorMessages';

const validateMaintenance: RequestHandler = (req, res, next) => {
    (async () => {
        try {
            const isMaintenance = await isFeatureEnabled(SETTING_KEYS.MAINTENANCE_MODE, false);
            if (isMaintenance) {
                const isBypassRoute = 
                    req.path.startsWith('/api/v1/health') ||
                    req.path.startsWith('/api/v1/settings') ||
                    req.path.startsWith('/api/auth') ||
                    req.path.startsWith('/api/v1/admin');

                if (isBypassRoute) {
                    next();
                    return;
                }

                // For non-bypass routes, check if requester is an admin
                const headers = new Headers();
                Object.entries(req.headers).forEach(([key, value]) => {
                    if (typeof value === "string") {
                        headers.append(key, value);
                    } else if (Array.isArray(value)) {
                        value.forEach((v) => headers.append(key, v));
                    }
                });

                const session = await auth.api.getSession({ headers });
                const userRole = session?.user?.role;
                if (userRole === 'ADMIN') {
                    next();
                    return;
                }

                res.status(503).json({
                    message: ERROR_MESSAGES.MAINTENANCE_MODE
                });
                return;
            }
        } catch (error) {
            logger.error('Error checking maintenance mode middleware', { error: (error as Error).message });
        }
        next();
    })();
};

export default validateMaintenance;
