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
   * Retrieves the complete statistics for the current user.
   * @returns The user's complete statistics.
   */
  static async getFullStats(): Promise<UserStats> {
    try {
      const response = await api.get<{ message: string; data: UserStats }>(UserStatsService.BASE_URL);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get user stats:", error);
      throw error;
    }
  }

  /**
   * Retrieves the basic statistics for the current user.
   * @returns The user's basic statistics.
   */
  static async getBasicStats(): Promise<UserBasicStats> {
    try {
      const response = await api.get<{ message: string; data: UserBasicStats }>(
        `${UserStatsService.BASE_URL}/basic`
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to get basic user stats:", error);
      throw error;
    }
  }
} 