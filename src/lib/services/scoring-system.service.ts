import api from '../axios';

export interface ScoringPosition {
  position: number;
  points: number;
}

export interface ScoringSystemData {
  name: string;
  positions: ScoringPosition[];
  polePositionPoints?: number;
  fastestLapPoints?: number;
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
   * Retrieves all scoring systems for a given championship.
   * @param championshipId - The ID of the championship.
   * @returns A list of scoring systems.
   */
  static async getByChampionshipId(championshipId: string): Promise<ScoringSystem[]> {
    try {
      const response = await api.get<ScoringSystem[]>(`${ScoringSystemService.BASE_URL}/championship/${championshipId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get scoring systems for championship ${championshipId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a scoring system by its ID and championship ID.
   * @param id - The ID of the scoring system.
   * @param championshipId - The ID of the championship.
   * @returns The scoring system.
   */
  static async getById(id: string, championshipId: string): Promise<ScoringSystem> {
    try {
      const response = await api.get<ScoringSystem>(`${ScoringSystemService.BASE_URL}/${id}/championship/${championshipId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get scoring system with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new scoring system for a championship.
   * @param championshipId - The ID of the championship.
   * @param data - The data for the new scoring system.
   * @returns The created scoring system.
   */
  static async create(championshipId: string, data: ScoringSystemData): Promise<ScoringSystem> {
    try {
      const response = await api.post<ScoringSystem>(`${ScoringSystemService.BASE_URL}/championship/${championshipId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to create scoring system for championship ${championshipId}:`, error);
      throw error;
    }
  }

  /**
   * Updates a scoring system.
   * @param id - The ID of the scoring system to update.
   * @param championshipId - The ID of the championship.
   * @param data - The data to update the scoring system with.
   * @returns The updated scoring system.
   */
  static async update(id: string, championshipId: string, data: Partial<ScoringSystemData>): Promise<ScoringSystem> {
    try {
      const response = await api.put<ScoringSystem>(`${ScoringSystemService.BASE_URL}/${id}/championship/${championshipId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update scoring system with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a scoring system.
   * @param id - The ID of the scoring system to delete.
   * @param championshipId - The ID of the championship.
   */
  static async delete(id: string, championshipId: string): Promise<void> {
    try {
      await api.delete(`${ScoringSystemService.BASE_URL}/${id}/championship/${championshipId}`);
    } catch (error) {
      console.error(`Failed to delete scoring system with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Sets a scoring system as the default for a championship.
   * @param id - The ID of the scoring system.
   * @param championshipId - The ID of the championship.
   * @returns The updated scoring system.
   */
  static async setDefault(id: string, championshipId: string): Promise<ScoringSystem> {
    try {
      const response = await api.patch<ScoringSystem>(`${ScoringSystemService.BASE_URL}/${id}/championship/${championshipId}/set-default`);
      return response.data;
    } catch (error) {
      console.error(`Failed to set default scoring system with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggles the active status of a scoring system.
   * @param id - The ID of the scoring system.
   * @param championshipId - The ID of the championship.
   * @returns The updated scoring system.
   */
  static async toggleActive(id: string, championshipId: string): Promise<ScoringSystem> {
    try {
      const response = await api.patch<ScoringSystem>(`${ScoringSystemService.BASE_URL}/${id}/championship/${championshipId}/toggle-active`);
      return response.data;
    } catch (error) {
      console.error(`Failed to toggle active for scoring system with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates predefined scoring systems for a championship.
   * @param championshipId - The ID of the championship.
   * @returns The created scoring systems.
   */
  static async createPredefined(championshipId: string): Promise<ScoringSystem[]> {
    try {
      const response = await api.post<ScoringSystem[]>(`${ScoringSystemService.BASE_URL}/championship/${championshipId}/create-predefined`);
      return response.data;
    } catch (error) {
      console.error(`Failed to create predefined scoring systems for championship ${championshipId}:`, error);
      throw error;
    }
  }
} 