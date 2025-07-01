import api from '../axios';

export interface ChampionshipStats {
  id: string;
  name: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  totalUsers: number;
  confirmedUsers: number;
  pilotsEnrolled: number;
  pilotsConfirmed: number;
  pilotsPending: number;
  pilotsOverdue: number;
}

export interface AdminStats {
  totalUsers: number;
  totalUsersWithRegistrations: number;
  totalConfirmedRegistrations: number;
  championshipsStats: ChampionshipStats[];
}

export class AdminStatsService {
  private static readonly BASE_URL = '/admin-stats';

  /**
   * Retrieves administrative statistics for the system.
   * @returns The administrative statistics.
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await api.get<{ message: string; data: AdminStats }>(AdminStatsService.BASE_URL);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get admin stats:", error);
      throw error;
    }
  }
} 