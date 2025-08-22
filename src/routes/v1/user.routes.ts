import { Router } from 'express';
import { completeUserProfile } from '../../controllers/user.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/user/complete-profile', asyncHandler(completeUserProfile));

export default router;
