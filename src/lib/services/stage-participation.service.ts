import api from '../axios';

export interface StageParticipation {
  id: string;
  userId: string;
  stageId: string;
  categoryId: string;
  status: 'confirmed' | 'cancelled';
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    ballast: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmParticipationData {
  stageId: string;
  categoryId: string;
}

export interface CancelParticipationData {
  stageId: string;
  categoryId: string;
  reason?: string;
}

export interface AvailableCategory {
  id: string;
  name: string;
  ballast: string;
  isConfirmed: boolean;
}

export class StageParticipationService {
  private static readonly BASE_URL = '/stage-participations';

  /**
   * Confirmar participação do usuário em uma etapa
   */
  static async confirmParticipation(data: ConfirmParticipationData): Promise<StageParticipation> {
    try {
      const response = await api.post<{
        message: string;
        data: StageParticipation;
      }>(`${StageParticipationService.BASE_URL}/confirm`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error confirming participation:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao confirmar participação. Tente novamente.'
      );
    }
  }

  /**
   * Cancelar participação do usuário em uma etapa
   */
  static async cancelParticipation(data: CancelParticipationData): Promise<void> {
    try {
      await api.post(`${StageParticipationService.BASE_URL}/cancel`, data);
    } catch (error: any) {
      console.error('Error cancelling participation:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao cancelar participação. Tente novamente.'
      );
    }
  }

  /**
   * Buscar participações do usuário logado
   */
  static async getMyParticipations(): Promise<StageParticipation[]> {
    try {
      const response = await api.get<{
        message: string;
        data: StageParticipation[];
      }>(`${StageParticipationService.BASE_URL}/my`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching my participations:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar suas participações. Tente novamente.'
      );
    }
  }

  /**
   * Buscar participações de uma etapa específica
   */
  static async getStageParticipations(stageId: string): Promise<StageParticipation[]> {
    try {
      const response = await api.get<{
        message: string;
        data: StageParticipation[];
      }>(`${StageParticipationService.BASE_URL}/stage/${stageId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching stage participations:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar participações da etapa. Tente novamente.'
      );
    }
  }

  /**
   * Buscar categorias disponíveis para o usuário confirmar em uma etapa
   */
  static async getAvailableCategories(stageId: string): Promise<AvailableCategory[]> {
    try {
      const response = await api.get<{
        message: string;
        data: AvailableCategory[];
      }>(`${StageParticipationService.BASE_URL}/available-categories/${stageId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching available categories:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar categorias disponíveis. Tente novamente.'
      );
    }
  }
} 