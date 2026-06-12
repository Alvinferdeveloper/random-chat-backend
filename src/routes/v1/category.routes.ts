import { Router } from 'express';
import { 
    getCategories, 
    getCategoryById, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '@/controllers/category.controller';
import { asyncHandler } from '@/utils/asyncHandler';
import { validate } from '@/middlewares/validate';
import { 
    createCategorySchema, 
    updateCategorySchema, 
    deleteCategorySchema 
} from '@/validations/category.validation';
import validateSession from '@/middlewares/validateSession';
import validateAdmin from '@/middlewares/validateAdmin';

const router = Router();

// Public routes
router.get('/', asyncHandler(getCategories));
router.get('/:id', asyncHandler(getCategoryById));

// Admin routes
router.use(validateSession, validateAdmin);

router.post('/', validate(createCategorySchema), asyncHandler(createCategory));
router.patch('/:id', validate(updateCategorySchema), asyncHandler(updateCategory));
router.delete('/:id', validate(deleteCategorySchema), asyncHandler(deleteCategory));

export default router;
