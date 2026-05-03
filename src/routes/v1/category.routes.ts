import { Router } from 'express';
import * as CategoryService from '@/services/category.service';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.q as string | undefined;
    
    const result = await CategoryService.getCategories(page, limit, search);
    res.json(result.data);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(id);
    res.json(category);
}));

export default router;