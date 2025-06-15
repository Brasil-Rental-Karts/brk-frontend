import api from '../axios';

export interface UserStats {
  memberSince: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  totalChampionships: number;
  totalSeasons: number;
  totalUpcomingRaces: number;
  registrationsByStatus: {
    confirmed: number;
    payment_pending: number;
    pending: number;
    cancelled: number;
    expired: number;
  };
  paymentsByStatus: {
    paid: number;
    pending: number;
    processing: number;
    failed: number;
    cancelled: number;
    refunded: number;
  };
}

export interface UserBasicStats {
  memberSince: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  totalChampionships: number;
  totalSeasons: number;
  totalUpcomingRaces: number;
}

export class UserStatsService {
  private static readonly BASE_URL = '/user-stats';

  /**
   * Buscar estatísticas completas do usuário
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get<{
        message: string;
        data: UserStats;
      }>(this.BASE_URL);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar estatísticas do usuário.'
      );
    }
  }

  /**
   * Buscar estatísticas básicas do usuário (otimizado)
   */
  static async getUserBasicStats(): Promise<UserBasicStats> {
    try {
      const response = await api.get<{
        message: string;
        data: UserBasicStats;
      }>(`${this.BASE_URL}/basic`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user basic stats:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar estatísticas básicas do usuário.'
      );
    }
  }
} 