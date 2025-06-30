import api from '../axios';

export interface Regulation {
  id: string;
  title: string;
  content: string;
  order: number;
  seasonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegulationData {
  title: string;
  content: string;
  seasonId: string;
  order?: number;
}

export interface UpdateRegulationData {
  title?: string;
  content?: string;
  order?: number;
}

export interface ReorderRegulationsData {
  seasonId: string;
  regulationIds: string[];
}

export class RegulationService {
  static async getBySeasonId(seasonId: string): Promise<Regulation[]> {
    const response = await api.get(`/regulations/season/${seasonId}`);
    return response.data.data;
  }

  static async getBySeasonIdOrdered(seasonId: string): Promise<Regulation[]> {
    const response = await api.get(`/regulations/season/${seasonId}/ordered`);
    return response.data.data;
  }

  static async getById(id: string): Promise<Regulation> {
    const response = await api.get(`/regulations/${id}`);
    return response.data.data;
  }

  static async create(data: CreateRegulationData): Promise<Regulation> {
    const response = await api.post('/regulations', data);
    return response.data.data;
  }

  static async update(id: string, data: UpdateRegulationData): Promise<Regulation> {
    const response = await api.put(`/regulations/${id}`, data);
    return response.data.data;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`/regulations/${id}`);
  }

  static async reorder(data: ReorderRegulationsData): Promise<void> {
    await api.post('/regulations/reorder', data);
  }
} 