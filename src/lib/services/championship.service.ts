import api from '../axios';
import { Category } from './category.service';
import { Season } from './season.service';

export interface Sponsor {
  id?: string;
  name: string;
  logoImage: string;
  website?: string;
  type: 'sponsor' | 'supporter';
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
  province?: string; // Bairro
  isResponsible: boolean;
  responsibleName?: string;
  responsiblePhone?: string;
  responsibleEmail?: string; // E-mail do responsável (quando não é responsável)
  responsibleBirthDate?: string; // Data de nascimento do responsável (quando não é responsável) - obrigatório para pessoa física
  companyType?: string; // Tipo de empresa para pessoa jurídica
  sponsors?: Sponsor[];
  platformCommissionPercentage?: number; // Percentual de comissão da plataforma
  commissionAbsorbedByChampionship?: boolean; // Indica se a comissão é absorvida pelo campeonato (true) ou cobrada do piloto (false)
}

export interface Championship extends ChampionshipData {
  id: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  isStaff?: boolean;
  isPilot?: boolean;
  seasons?: Season[];
}

export interface ChampionshipBasicInfo {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
}

export interface AsaasStatus {
  championshipId: string;
  splitEnabled: boolean;
  asaasWalletId: string | null;
  configured: boolean;
  canRetry: boolean;
  document: string;
  personType: number;
}

export class ChampionshipService {
  private static readonly BASE_URL = '/championships';

  /**
   * Criar um novo campeonato
   */
  static async create(data: ChampionshipData): Promise<Championship> {
    try {
      const response = await api.post<Championship>(ChampionshipService.BASE_URL, data);
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
      const response = await api.get<Championship[]>(ChampionshipService.BASE_URL);
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
      const response = await api.get<Championship>(`${ChampionshipService.BASE_URL}/${id}`);
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
   * Buscar campeonato por slug ou ID (rota pública para inscrições)
   */
  static async getPublicById(slugOrId: string): Promise<Championship> {
    try {
      const response = await api.get<Championship>(`${ChampionshipService.BASE_URL}/public/${slugOrId}`);
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
      const response = await api.get<ChampionshipBasicInfo>(`${ChampionshipService.BASE_URL}/${id}/basic`);
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
      const response = await api.get<Championship[]>(`${ChampionshipService.BASE_URL}/my`);
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
      const response = await api.put<Championship>(`${ChampionshipService.BASE_URL}/${id}`, data);
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
      await api.delete(`${ChampionshipService.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error('Error deleting championship:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao deletar campeonato. Tente novamente.'
      );
    }
  }

  /**
   * Verificar status da configuração Asaas
   */
  static async getAsaasStatus(id: string): Promise<AsaasStatus> {
    try {
      const response = await api.get<AsaasStatus>(`${ChampionshipService.BASE_URL}/${id}/asaas-status`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Asaas status:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao verificar status da conta Asaas. Tente novamente.'
      );
    }
  }

  /**
   * Atualizar Wallet ID do Asaas
   */
  static async updateAsaasWalletId(id: string, walletId: string): Promise<Championship> {
    try {
      const response = await api.put<Championship>(`${ChampionshipService.BASE_URL}/${id}/asaas-wallet`, {
        walletId: walletId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating Asaas wallet ID:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao atualizar Wallet ID. Tente novamente.'
      );
    }
  }
} 