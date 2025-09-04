import { Router } from 'express';
import { getAllHobbies } from '../../controllers/hobby.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getAllHobbies));

export default router;
