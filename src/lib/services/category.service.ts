import api from '../axios';
import { BatteriesConfig } from '../types/battery.types';
import { Season } from './season.service';

export interface Category {
  id: string;
  name: string;
  ballast: number;
  maxPilots: number;
  batteriesConfig: BatteriesConfig;
  minimumAge: number;
  allowDiscarding: boolean;
  discardingType?: 'bateria' | 'etapa';
  discardingQuantity?: number;
  seasonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryData {
  name: string;
  ballast: number;
  maxPilots: number;
  batteriesConfig: BatteriesConfig;
  minimumAge: number;
  allowDiscarding: boolean;
  discardingType?: 'bateria' | 'etapa';
  discardingQuantity?: number;
  seasonId: string;
}

export interface PaginatedCategories {
  data: Category[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export class CategoryService {
  private static readonly BASE_URL = '/categories';

  /**
   * Retrieves all categories.
   * @returns A list of all categories.
   */
  static async getAll(): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>(CategoryService.BASE_URL);
      return response.data;
    } catch (error) {
      console.error("Failed to retrieve all categories:", error);
      throw error;
    }
  }

  /**
   * Retrieves a category by its ID.
   * @param id - The ID of the category.
   * @returns The category with the given ID.
   */
  static async getById(id: string): Promise<Category> {
    try {
      const response = await api.get<Category>(`${CategoryService.BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve category with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all categories for a given season.
   * @param seasonId - The ID of the season.
   * @returns A list of categories for the season.
   */
  static async getBySeasonId(seasonId: string): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>(`${CategoryService.BASE_URL}/season/${seasonId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve categories for season ID ${seasonId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves categories by name.
   * @param name - The name of the category.
   * @returns A list of categories with the given name.
   */
  static async getByName(name: string): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>(`${CategoryService.BASE_URL}/name/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve categories with name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a category by name and season ID.
   * @param name - The name of the category.
   * @param seasonId - The ID of the season.
   * @returns The category with the given name and season ID.
   */
  static async getByNameAndSeason(name: string, seasonId: string): Promise<Category> {
    try {
      const response = await api.get<Category>(`${CategoryService.BASE_URL}/name/${name}?seasonId=${seasonId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve category with name ${name} for season ID ${seasonId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves categories by ballast requirement.
   * @param ballast - The ballast value.
   * @returns A list of categories with the specified ballast.
   */
  static async getByBallast(ballast: number): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>(`${CategoryService.BASE_URL}/ballast/${ballast}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve categories with ballast ${ballast}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new category.
   * @param data - The data for the new category.
   * @returns The created category.
   */
  static async create(data: CategoryData): Promise<Category> {
    try {
      const response = await api.post<Category>(CategoryService.BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error;
    }
  }

  /**
   * Updates an existing category.
   * @param id - The ID of the category to update.
   * @param data - The data to update the category with.
   * @returns The updated category.
   */
  static async update(id: string, data: Partial<CategoryData>): Promise<Category> {
    try {
      const response = await api.put<Category>(`${CategoryService.BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update category with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a category by its ID.
   * @param id - The ID of the category to delete.
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`${CategoryService.BASE_URL}/${id}`);
    } catch (error) {
      console.error(`Failed to delete category with ID ${id}:`, error);
      throw error;
    }
  }
} 