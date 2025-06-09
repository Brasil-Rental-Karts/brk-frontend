import api from '../axios';
import { BatteriesConfig } from '../types/battery.types';

export interface Category {
  id: string;
  name: string;
  ballast: string;
  maxPilots: number;
  batteriesConfig: BatteriesConfig;
  minimumAge: number;
  seasonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryData {
  name: string;
  ballast: string;
  maxPilots: number;
  batteriesConfig: BatteriesConfig;
  minimumAge: number;
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
   * Busca todas as categorias
   */
  static async getAll(): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>(this.BASE_URL);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar categorias.'
      );
    }
  }

  /**
   * Busca categoria por ID
   */
  static async getById(id: string): Promise<Category> {
    try {
      const response = await api.get<Category>(`${this.BASE_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching category:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar categoria.'
      );
    }
  }

  /**
   * Busca categorias por temporada
   */
  static async getBySeasonId(seasonId: string): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>(`${this.BASE_URL}/season/${seasonId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories by season:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar categorias da temporada.'
      );
    }
  }

  /**
   * Busca categoria por nome
   */
  static async getByName(name: string): Promise<Category> {
    try {
      const response = await api.get<Category>(`${this.BASE_URL}/name/${name}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching category by name:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar categoria por nome.'
      );
    }
  }

  /**
   * Busca categorias por lastro
   */
  static async getByBallast(ballast: string): Promise<Category[]> {
    try {
      const response = await api.get<Category[]>(`${this.BASE_URL}/ballast/${ballast}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories by ballast:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar categorias por lastro.'
      );
    }
  }

  /**
   * Cria uma nova categoria
   */
  static async create(data: CategoryData): Promise<Category> {
    try {
      const response = await api.post<Category>(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao criar categoria. Tente novamente.'
      );
    }
  }

  /**
   * Atualiza uma categoria
   */
  static async update(id: string, data: Partial<CategoryData>): Promise<Category> {
    try {
      const response = await api.put<Category>(`${this.BASE_URL}/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating category:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao atualizar categoria.'
      );
    }
  }

  /**
   * Exclui uma categoria
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao deletar categoria.'
      );
    }
  }
} 