import * as CategoryRepository from '../repositories/category.repository';

export const getCategories = async (page: number = 1, limit: number = 10, search?: string) => {
    return CategoryRepository.getAllCategories(page, limit, search);
};

export const getCategoryById = async (id: string) => {
    return CategoryRepository.findCategoryById(id);
};

export const createCategory = async (data: { name: string, icon?: string }) => {
    return CategoryRepository.create(data);
};

export const updateCategory = async (id: string, data: { name?: string, icon?: string }) => {
    return CategoryRepository.update(id, data);
};

export const deleteCategory = async (id: string) => {
    return CategoryRepository.remove(id);
};
