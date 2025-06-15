import api from '../axios';

export interface ScoringPosition {
  position: number;
  points: number;
}

export interface ScoringSystemData {
  name: string;
  description?: string;
  positions: ScoringPosition[];
  polePositionPoints?: number;
  fastestLapPoints?: number;
  leaderLapPoints?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface ScoringSystem extends ScoringSystemData {
  id: string;
  championshipId: string;
  createdAt: string;
  updatedAt: string;
}

export class ScoringSystemService {
  private static readonly BASE_URL = '/scoring-systems';

  /**
   * Buscar sistemas de pontuação de um campeonato
   */
  static async getByChampionship(championshipId: string): Promise<ScoringSystem[]> {
    try {
      const response = await api.get<ScoringSystem[]>(`${this.BASE_URL}/championship/${championshipId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching scoring systems:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao buscar sistemas de pontuação. Tente novamente.'
      );
    }
  }

  /**
   * Buscar sistema de pontuação por ID
   */
  static async getById(id: string, championshipId: string): Promise<ScoringSystem> {
    try {
      const response = await api.get<ScoringSystem>(`${this.BASE_URL}/${id}/championship/${championshipId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching scoring system:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao buscar sistema de pontuação. Tente novamente.'
      );
    }
  }

  /**
   * Criar novo sistema de pontuação
   */
  static async create(championshipId: string, data: ScoringSystemData): Promise<ScoringSystem> {
    try {
      const response = await api.post<ScoringSystem>(`${this.BASE_URL}/championship/${championshipId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating scoring system:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao criar sistema de pontuação. Tente novamente.'
      );
    }
  }

  /**
   * Atualizar sistema de pontuação
   */
  static async update(id: string, championshipId: string, data: Partial<ScoringSystemData>): Promise<ScoringSystem> {
    try {
      const response = await api.put<ScoringSystem>(`${this.BASE_URL}/${id}/championship/${championshipId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating scoring system:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao atualizar sistema de pontuação. Tente novamente.'
      );
    }
  }

  /**
   * Excluir sistema de pontuação
   */
  static async delete(id: string, championshipId: string): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/${id}/championship/${championshipId}`);
    } catch (error: any) {
      console.error('Error deleting scoring system:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao excluir sistema de pontuação. Tente novamente.'
      );
    }
  }

  /**
   * Definir sistema como padrão
   */
  static async setAsDefault(id: string, championshipId: string): Promise<ScoringSystem> {
    try {
      const response = await api.patch<ScoringSystem>(`${this.BASE_URL}/${id}/championship/${championshipId}/set-default`);
      return response.data;
    } catch (error: any) {
      console.error('Error setting scoring system as default:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao definir sistema como padrão. Tente novamente.'
      );
    }
  }

  /**
   * Alternar status ativo/inativo
   */
  static async toggleActive(id: string, championshipId: string): Promise<ScoringSystem> {
    try {
      const response = await api.patch<ScoringSystem>(`${this.BASE_URL}/${id}/championship/${championshipId}/toggle-active`);
      return response.data;
    } catch (error: any) {
      console.error('Error toggling scoring system active status:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao alterar status do sistema. Tente novamente.'
      );
    }
  }

  /**
   * Criar sistemas pré-configurados
   */
  static async createPredefined(championshipId: string): Promise<ScoringSystem[]> {
    try {
      const response = await api.post<ScoringSystem[]>(`${this.BASE_URL}/championship/${championshipId}/create-predefined`);
      return response.data;
    } catch (error: any) {
      console.error('Error creating predefined scoring systems:', error);
      throw new Error(
        error.response?.data?.error || 
        'Erro ao criar sistemas pré-configurados. Tente novamente.'
      );
    }
  }
} 