import api from "../axios";

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

export interface PreloadUsersResult {
  totalUsers: number;
  duration: string;
}

export interface PreloadCategoriesResult {
  totalCategories: number;
  totalPilots: number;
  duration: string;
}

export class AdminStatsService {
  private static readonly BASE_URL = "/admin-stats";

  /**
   * Retrieves administrative statistics for the system.
   * @returns The administrative statistics.
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await api.get<{ message: string; data: AdminStats }>(
        AdminStatsService.BASE_URL,
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to get admin stats:", error);
      throw error;
    }
  }

  /**
   * Preloads all users into Redis cache for better performance.
   * @returns The preload result with total users and duration.
   */
  static async preloadUsersCache(): Promise<PreloadUsersResult> {
    try {
      const response = await api.post<{
        message: string;
        data: PreloadUsersResult;
      }>(`${AdminStatsService.BASE_URL}/cache/users/preload`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to preload users cache:", error);
      throw error;
    }
  }

  /**
   * Updates categories pilots cache in Redis for better performance.
   * @returns The update result with total categories, pilots and duration.
   */
  static async updateCategoriesCache(): Promise<PreloadCategoriesResult> {
    try {
      const response = await api.post<{
        message: string;
        data: PreloadCategoriesResult;
      }>(`${AdminStatsService.BASE_URL}/cache/categories/update`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to update categories cache:", error);
      throw error;
    }
  }
}
