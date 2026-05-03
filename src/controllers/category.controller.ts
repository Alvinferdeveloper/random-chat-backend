import { Request, Response } from "express";
import * as CategoryRepository from "@/repositories/category.repository";

export const getCategories = async (_req: Request, res: Response) => {
    const categories = await CategoryRepository.getAllCategories();
    return res.json(categories);
};

export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await CategoryRepository.findCategoryById(id);
    return res.json(category);
};