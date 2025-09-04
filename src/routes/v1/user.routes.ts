import { Router } from 'express';
import { completeUserProfile, getUserSession } from '../../controllers/user.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/user/complete-profile', asyncHandler(completeUserProfile));
router.get('/user/session', getUserSession);

export default router;
