import { useState } from 'react';
import { CategoryService, CategoryData, Category } from '@/lib/services/category.service';

export interface UseCreateCategoryReturn {
  isLoading: boolean;
  error: string | null;
  createCategory: (data: CategoryData) => Promise<Category | null>;
  clearError: () => void;
}

export const useCreateCategory = (): UseCreateCategoryReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (data: CategoryData): Promise<Category | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const category = await CategoryService.create(data);
      return category;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar categoria. Tente novamente.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    createCategory,
    clearError,
  };
}; 