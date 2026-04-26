import { Router } from 'express';
import { completeUserProfile, getUserSession, getUserProfile, updateUserProfile, generateProfileUploadUrl, getUserProfileByUsername } from '@/controllers/user.controller';
import { getFavoriteGifs, addFavoriteGif, removeFavoriteGif } from '@/controllers/favorite-gif.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate';
import { completeUserProfileSchema, updateUserProfileSchema, generateUploadUrlSchema } from '@/validations/user.validation';
import { profileUpdateLimiter } from '@/config/rateLimiters';
import validateSession from '@/middlewares/validateSession';

const router = Router();

// Public / Proxy accessible
router.get('/profile/:username', asyncHandler(getUserProfileByUsername));

// Protected routes
router.use(validateSession);

router.get('/session', asyncHandler(getUserSession));
router.get('/profile', asyncHandler(getUserProfile));
router.patch('/profile', profileUpdateLimiter, validate(updateUserProfileSchema), asyncHandler(updateUserProfile));
router.post('/profile/generate-upload-url', profileUpdateLimiter, validate(generateUploadUrlSchema), asyncHandler(generateProfileUploadUrl));

router.get('/favorites/gifs', asyncHandler(getFavoriteGifs));
router.post('/favorites/gifs', asyncHandler(addFavoriteGif));
router.delete('/favorites/gifs/:giphyId', asyncHandler(removeFavoriteGif));


router.post('/complete-profile', validate(completeUserProfileSchema), asyncHandler(completeUserProfile));

export default router;