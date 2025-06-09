import api from '../axios';
import { GridType, GridTypeFormData } from '@/lib/types/grid-type';

/**
 * Serviço para gerenciar tipos de grid do campeonato
 */
export class GridTypeService {
  private static readonly BASE_URL = '/championships';

  /**
   * Buscar todos os tipos de grid de um campeonato
   */
  static async getByChampionship(championshipId: string): Promise<GridType[]> {
    try {
      const response = await api.get<GridType[]>(`${this.BASE_URL}/${championshipId}/grid-types`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching grid types:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar tipos de grid. Tente novamente.'
      );
    }
  }

  /**
   * Buscar um tipo de grid por ID
   */
  static async getById(championshipId: string, gridTypeId: string): Promise<GridType> {
    try {
      const response = await api.get<GridType>(`${this.BASE_URL}/${championshipId}/grid-types/${gridTypeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching grid type:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar tipo de grid. Tente novamente.'
      );
    }
  }

  /**
   * Criar um novo tipo de grid
   */
  static async create(championshipId: string, data: GridTypeFormData): Promise<GridType> {
    try {
      const response = await api.post<GridType>(`${this.BASE_URL}/${championshipId}/grid-types`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating grid type:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao criar tipo de grid. Tente novamente.'
      );
    }
  }

  /**
   * Atualizar um tipo de grid existente
   */
  static async update(championshipId: string, gridTypeId: string, data: Partial<GridTypeFormData>): Promise<GridType> {
    try {
      const response = await api.put<GridType>(`${this.BASE_URL}/${championshipId}/grid-types/${gridTypeId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating grid type:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao atualizar tipo de grid. Tente novamente.'
      );
    }
  }

  /**
   * Excluir um tipo de grid
   */
  static async delete(championshipId: string, gridTypeId: string): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/${championshipId}/grid-types/${gridTypeId}`);
    } catch (error: any) {
      console.error('Error deleting grid type:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao excluir tipo de grid. Tente novamente.'
      );
    }
  }

  /**
   * Criar tipos de grid pré-configurados para um campeonato
   */
  static async createPredefined(championshipId: string): Promise<GridType[]> {
    try {
      const response = await api.post<GridType[]>(`${this.BASE_URL}/${championshipId}/grid-types/predefined`);
      return response.data;
    } catch (error: any) {
      console.error('Error creating predefined grid types:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao criar tipos de grid pré-configurados. Tente novamente.'
      );
    }
  }

  /**
   * Definir um tipo de grid como padrão
   */
  static async setAsDefault(championshipId: string, gridTypeId: string): Promise<GridType> {
    try {
      const response = await api.patch<GridType>(`${this.BASE_URL}/${championshipId}/grid-types/${gridTypeId}/set-default`);
      return response.data;
    } catch (error: any) {
      console.error('Error setting grid type as default:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao definir tipo de grid padrão. Tente novamente.'
      );
    }
  }

  /**
   * Ativar/desativar um tipo de grid
   */
  static async toggleActive(championshipId: string, gridTypeId: string): Promise<GridType> {
    try {
      const response = await api.patch<GridType>(`${this.BASE_URL}/${championshipId}/grid-types/${gridTypeId}/toggle-active`);
      return response.data;
    } catch (error: any) {
      console.error('Error toggling grid type active status:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao alterar status do tipo de grid. Tente novamente.'
      );
    }
  }
} 