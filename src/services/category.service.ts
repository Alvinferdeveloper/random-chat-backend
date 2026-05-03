import * as CategoryRepository from '../repositories/category.repository';

export const getCategories = async (page: number = 1, limit: number = 10, search?: string) => {
    return CategoryRepository.getAllCategories(page, limit, search);
};

export const getCategoryById = async (id: string) => {
    return CategoryRepository.findCategoryById(id);
};