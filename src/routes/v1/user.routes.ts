import { Router } from 'express';
import { completeUserProfile, getUserSession, getUserProfile, updateUserProfile, generateProfileUploadUrl } from '@/controllers/user.controller';
import { getFavoriteGifs, addFavoriteGif, removeFavoriteGif } from '@/controllers/favorite-gif.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate';
import { completeUserProfileSchema, updateUserProfileSchema, generateUploadUrlSchema } from '@/validations/user.validation';
import { profileUpdateLimiter } from '@/config/rateLimiters';

const router = Router();

router.get('/profile', asyncHandler(getUserProfile));
router.patch('/profile', profileUpdateLimiter, validate(updateUserProfileSchema), asyncHandler(updateUserProfile));
router.post('/profile/generate-upload-url', profileUpdateLimiter, validate(generateUploadUrlSchema), asyncHandler(generateProfileUploadUrl));

router.get('/favorites/gifs', asyncHandler(getFavoriteGifs));
router.post('/favorites/gifs', asyncHandler(addFavoriteGif));
router.delete('/favorites/gifs/:giphyId', asyncHandler(removeFavoriteGif));


router.post('/complete-profile', validate(completeUserProfileSchema), asyncHandler(completeUserProfile));
router.get('/session', asyncHandler(getUserSession));

export default router;