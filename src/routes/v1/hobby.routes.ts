import { Router } from 'express';
import { getAllHobbies } from '../../controllers/hobby.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Usamos asyncHandler por si en el futuro la lógica se vuelve más compleja
router.get('/hobbies', asyncHandler(getAllHobbies));

export default router;
