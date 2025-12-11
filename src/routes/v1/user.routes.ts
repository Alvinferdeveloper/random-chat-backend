import { Router } from 'express';
import { completeUserProfile, getUserSession } from '../../controllers/user.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import { completeUserProfileSchema } from '../../validations/user.validation';

const router = Router();

router.post('/complete-profile', validate(completeUserProfileSchema), asyncHandler(completeUserProfile));
router.get('/session', asyncHandler(getUserSession));

export default router;
