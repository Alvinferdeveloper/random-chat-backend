import { Router } from 'express';
import { completeUserProfile, getUserSession } from '../../controllers/user.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/complete-profile', asyncHandler(completeUserProfile));
router.get('/session', asyncHandler(getUserSession));

export default router;
