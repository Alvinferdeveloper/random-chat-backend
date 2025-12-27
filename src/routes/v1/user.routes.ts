import { Router } from 'express';
import { completeUserProfile, getUserSession, getUserProfile, updateUserProfile, generateProfileUploadUrl } from '@/controllers/user.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate';
import { completeUserProfileSchema, updateUserProfileSchema, generateUploadUrlSchema } from '@/validations/user.validation';

const router = Router();

router.get('/profile', asyncHandler(getUserProfile));
router.patch('/profile', validate(updateUserProfileSchema), asyncHandler(updateUserProfile));
router.post('/profile/generate-upload-url', validate(generateUploadUrlSchema), asyncHandler(generateProfileUploadUrl));


router.post('/complete-profile', validate(completeUserProfileSchema), asyncHandler(completeUserProfile));
router.get('/session', asyncHandler(getUserSession));

export default router;