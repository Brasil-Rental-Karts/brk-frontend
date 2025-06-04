import api from '../axios';

export interface SeasonData {
  name: string;
  seasonImage: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'agendado' | 'em_andamento' | 'cancelado' | 'finalizado';
  inscriptionValue: number;
  inscriptionType: 'mensal' | 'anual' | 'semestral' | 'trimestral';
  paymentMethods: ('pix' | 'cartao_debito' | 'cartao_credito' | 'boleto')[];
  sponsors: Sponsor[];
  championshipId: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoImage: string;
  website?: string;
}

export interface Season extends SeasonData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSeasons {
  data: Season[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SeasonService {
  private static readonly BASE_URL = '/seasons';

  /**
   * Criar uma nova temporada
   */
  static async create(data: SeasonData): Promise<Season> {
    try {
      const response = await api.post<Season>(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating season:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao criar temporada. Tente novamente.'
      );
    }
  }

  /**
   * Buscar temporada por ID
   */
  static async getById(id: string): Promise<Season> {
    try {
      const response = await api.get<Season>(`${this.BASE_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching season:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar temporada.'
      );
    }
  }

  /**
   * Listar todas as temporadas com paginação
   */
  static async getAll(page: number = 1, limit: number = 10): Promise<PaginatedSeasons> {
    try {
      const response = await api.get<PaginatedSeasons>(
        `${this.BASE_URL}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching seasons:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar temporadas.'
      );
    }
  }

  /**
   * Listar temporadas de um campeonato específico
   */
  static async getByChampionshipId(
    championshipId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedSeasons> {
    try {
      const response = await api.get<PaginatedSeasons>(
        `${this.BASE_URL}/championship/${championshipId}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching seasons by championship:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar temporadas do campeonato.'
      );
    }
  }

  /**
   * Atualizar temporada
   */
  static async update(id: string, data: Partial<SeasonData>): Promise<Season> {
    try {
      const response = await api.put<Season>(`${this.BASE_URL}/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating season:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao atualizar temporada.'
      );
    }
  }

  /**
   * Deletar temporada
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error('Error deleting season:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao deletar temporada.'
      );
    }
  }
} 