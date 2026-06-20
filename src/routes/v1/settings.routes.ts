import { Router } from 'express';
import { getPublicSettings } from '../../controllers/setting.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

/**
 * GET /api/v1/settings
 * Public: returns the platform feature flags visible to the frontend.
 */
router.get('/', asyncHandler(getPublicSettings));

export default router;
