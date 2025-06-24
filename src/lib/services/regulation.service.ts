import api from '../axios';

export interface RegulationSection {
  id: string;
  title: string;
  markdownContent: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Regulation {
  id: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  seasonId: string;
  sections: RegulationSection[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegulationSectionRequest {
  title: string;
  markdownContent: string;
  order: number;
}

export interface CreateRegulationRequest {
  seasonId: string;
  sections: CreateRegulationSectionRequest[];
}

export interface UpdateRegulationSectionRequest {
  title?: string;
  markdownContent?: string;
  order?: number;
}

export interface UpdateRegulationRequest {
  status?: 'draft' | 'published';
  sections?: UpdateRegulationSectionRequest[];
}

export interface ReorderSectionRequest {
  id: string;
  order: number;
}

export class RegulationService {
  private static endpoint = '/regulations';

  static async getBySeasonId(seasonId: string): Promise<Regulation | null> {
    try {
      const response = await api.get(`${this.endpoint}/season/${seasonId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getPublishedBySeasonId(seasonId: string): Promise<Regulation | null> {
    try {
      const response = await api.get(`${this.endpoint}/season/${seasonId}/published`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getById(id: string): Promise<Regulation> {
    const response = await api.get(`${this.endpoint}/${id}`);
    return response.data;
  }

  static async create(data: CreateRegulationRequest): Promise<Regulation> {
    const response = await api.post(this.endpoint, data);
    return response.data;
  }

  static async update(id: string, data: UpdateRegulationRequest): Promise<Regulation> {
    const response = await api.put(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  static async publish(id: string): Promise<Regulation> {
    const response = await api.post(`${this.endpoint}/${id}/publish`);
    return response.data;
  }

  static async reorderSections(id: string, sections: ReorderSectionRequest[]): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${this.endpoint}/${id}/sections/reorder`, { sections });
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/${id}`);
  }
} 