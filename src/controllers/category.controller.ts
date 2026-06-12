import { Request, Response } from "express";
import * as CategoryRepository from "@/repositories/category.repository";
import ApiError, { ERROR_MESSAGES } from "@/utils/ApiError";

export const getCategories = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const categories = await CategoryRepository.getAllCategories(page, limit, search);
    return res.json(categories);
};

export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await CategoryRepository.findCategoryById(id);
    if (!category) throw new ApiError(404, ERROR_MESSAGES.NOT_FOUND);
    return res.json(category);
};

export const createCategory = async (req: Request, res: Response) => {
    const { name, icon } = req.body;
    const category = await CategoryRepository.create({ name, icon });
    return res.status(201).json({
        success: true,
        message: "Categoría creada correctamente.",
        data: category
    });
};

export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, icon } = req.body;
    const category = await CategoryRepository.update(id, { name, icon });
    return res.json({
        success: true,
        message: "Categoría actualizada correctamente.",
        data: category
    });
};

export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    await CategoryRepository.remove(id);
    return res.json({
        success: true,
        message: "Categoría eliminada correctamente."
    });
};