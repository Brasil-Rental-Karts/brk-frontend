import api from '../axios';

export interface ClassificationPilot {
  id: string;
  name: string;
  nickname?: string;
}

export interface ClassificationCategory {
  id: string;
  name: string;
  ballast: number;
  maxPilots: number;
  minimumAge: number;
}

export interface ClassificationEntry {
  totalPoints: number;
  totalStages: number;
  wins: number;
  podiums: number;
  polePositions: number;
  fastestLaps: number;
  bestPosition: number | null;
  averagePosition: number | null;
  user: ClassificationPilot;
  category: ClassificationCategory;
}

export interface SeasonClassification {
  lastUpdated: string;
  totalCategories: number;
  totalPilots: number;
  classificationsByCategory: {
    [categoryId: string]: {
      category: ClassificationCategory;
      pilots: ClassificationEntry[];
    };
  };
}

export class ChampionshipClassificationService {
  private static readonly BASE_URL = '/classification';

  /**
   * Buscar classificação por temporada e categoria
   */
  static async getBySeasonAndCategory(
    seasonId: string, 
    categoryId: string
  ): Promise<ClassificationEntry[]> {
    try {
      const response = await api.get<ClassificationEntry[]>(
        `${ChampionshipClassificationService.BASE_URL}/season/${seasonId}/category/${categoryId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching classification by season and category:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar classificação da categoria.'
      );
    }
  }

  /**
   * Buscar classificação completa do campeonato (todas as categorias)
   */
  static async getByChampionship(championshipId: string): Promise<{[categoryId: string]: ClassificationEntry[]}> {
    try {
      const response = await api.get<{[categoryId: string]: ClassificationEntry[]}>(
        `${ChampionshipClassificationService.BASE_URL}/championship/${championshipId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching championship classification:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar classificação do campeonato.'
      );
    }
  }

  /**
   * Buscar classificação específica de um usuário
   */
  static async getUserClassification(
    userId: string,
    seasonId: string,
    categoryId: string
  ): Promise<ClassificationEntry> {
    try {
      const response = await api.get<ClassificationEntry>(
        `${ChampionshipClassificationService.BASE_URL}/user/${userId}/season/${seasonId}/category/${categoryId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user classification:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar classificação do usuário.'
      );
    }
  }

  /**
   * Buscar classificação otimizada da temporada (do Redis)
   */
  static async getSeasonClassificationOptimized(seasonId: string): Promise<SeasonClassification> {
    try {
      const response = await api.get<{ message: string; data: SeasonClassification }>(
        `${ChampionshipClassificationService.BASE_URL}/season/${seasonId}/optimized`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching optimized season classification:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar classificação da temporada.'
      );
    }
  }

  /**
   * Buscar classificação diretamente do Redis (alta performance)
   */
  static async getSeasonClassificationFromRedis(seasonId: string): Promise<any> {
    try {
      const response = await api.get<{ message: string; data: any }>(
        `${ChampionshipClassificationService.BASE_URL}/season/${seasonId}/redis`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching season classification from Redis:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar classificação da temporada do Redis.'
      );
    }
  }

  /**
   * Recalcular classificação de uma temporada
   */
  static async recalculateSeasonClassification(seasonId: string): Promise<void> {
    try {
      await api.post(
        `${ChampionshipClassificationService.BASE_URL}/season/${seasonId}/recalculate`
      );
    } catch (error: any) {
      console.error('Error recalculating season classification:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao recalcular classificação da temporada.'
      );
    }
  }

  /**
   * Atualizar cache da classificação de uma temporada
   */
  static async updateSeasonClassificationCache(seasonId: string): Promise<void> {
    try {
      await api.post(
        `${ChampionshipClassificationService.BASE_URL}/season/${seasonId}/update-cache`
      );
    } catch (error: any) {
      console.error('Error updating season classification cache:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao atualizar cache da classificação da temporada.'
      );
    }
  }

  /**
   * Recalcular posições da etapa baseado em voltas e tempo + punições
   */
  static async recalculateStagePositions(
    stageId: string,
    categoryId: string,
    batteryIndex: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `${ChampionshipClassificationService.BASE_URL}/stages/${stageId}/recalculate-positions`,
        {
          categoryId,
          batteryIndex
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error recalculating stage positions:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao recalcular posições da etapa.'
      );
    }
  }
} 