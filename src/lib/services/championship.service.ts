import api from '../axios';

export interface Sponsor {
  id?: string;
  name: string;
  logoImage: string;
  website?: string;
}

export interface ChampionshipData {
  name: string;
  championshipImage?: string;
  shortDescription?: string;
  fullDescription?: string;
  personType: number;
  document: string;
  socialReason?: string;
  cep: string;
  state: string;
  city: string;
  fullAddress: string;
  number: string;
  complement?: string;
  isResponsible: boolean;
  responsibleName?: string;
  responsiblePhone?: string;
  sponsors?: Sponsor[];
}

export interface Championship extends ChampionshipData {
  id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChampionshipBasicInfo {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
}

export class ChampionshipService {
  private static readonly BASE_URL = '/championships';

  /**
   * Criar um novo campeonato
   */
  static async create(data: ChampionshipData): Promise<Championship> {
    try {
      const response = await api.post<Championship>(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating championship:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao criar campeonato. Tente novamente.'
      );
    }
  }

  /**
   * Buscar todos os campeonatos
   */
  static async getAll(): Promise<Championship[]> {
    try {
      const response = await api.get<Championship[]>(this.BASE_URL);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching championships:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar campeonatos. Tente novamente.'
      );
    }
  }

  /**
   * Buscar campeonato por ID
   */
  static async getById(id: string): Promise<Championship> {
    try {
      const response = await api.get<Championship>(`${this.BASE_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching championship:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar campeonato. Tente novamente.'
      );
    }
  }

  /**
   * Buscar informações básicas do campeonato (otimizado para cache)
   */
  static async getBasicInfo(id: string): Promise<ChampionshipBasicInfo> {
    try {
      const response = await api.get<ChampionshipBasicInfo>(`${this.BASE_URL}/${id}/basic`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching championship basic info:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar informações do campeonato. Tente novamente.'
      );
    }
  }

  /**
   * Buscar campeonatos do usuário logado
   */
  static async getMy(): Promise<Championship[]> {
    try {
      const response = await api.get<Championship[]>(`${this.BASE_URL}/my`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my championships:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar seus campeonatos. Tente novamente.'
      );
    }
  }

  /**
   * Atualizar campeonato
   */
  static async update(id: string, data: Partial<ChampionshipData>): Promise<Championship> {
    try {
      const response = await api.put<Championship>(`${this.BASE_URL}/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating championship:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao atualizar campeonato. Tente novamente.'
      );
    }
  }

  /**
   * Deletar campeonato
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error('Error deleting championship:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao deletar campeonato. Tente novamente.'
      );
    }
  }
} 