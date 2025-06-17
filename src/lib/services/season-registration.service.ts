import api from '../axios';
import { AxiosResponse } from 'axios';

export interface SeasonRegistration {
  id: string;
  userId: string;
  seasonId: string;
  status: 'pending' | 'payment_pending' | 'confirmed' | 'cancelled' | 'expired';
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  paymentDate?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  season: {
    id: string;
    name: string;
    championshipId: string;
  };
  categories: {
    id: string;
    category: {
      id: string;
      name: string;
      ballast: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegistrationData {
  seasonId: string;
  categoryIds: string[];
  paymentMethod: 'boleto' | 'pix' | 'cartao_credito';
  userDocument?: string;
}

export interface RegistrationPaymentData {
  id: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  status: string;
  pixQrCode?: string;
  pixKey?: string;
  expirationDate?: string;
  bankSlipUrl?: string;
  creditCardToken?: string;
  installmentCount?: number;
  paymentLink?: string;
  description?: string;
  registrationId: string;
  dueDate: string;
  invoiceUrl?: string;
  pixCopyPaste?: string;
}

export class SeasonRegistrationService {
  private static readonly BASE_URL = '/season-registrations';

  /**
   * Criar uma nova inscrição em temporada
   */
  static async create(data: CreateRegistrationData): Promise<{
    registration: SeasonRegistration;
    paymentData: RegistrationPaymentData;
  }> {
    try {
      const response = await api.post<{
        message: string;
        data: {
          registration: SeasonRegistration;
          paymentData: RegistrationPaymentData;
        };
      }>(SeasonRegistrationService.BASE_URL, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating registration:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao criar inscrição. Tente novamente.'
      );
    }
  }

  /**
   * Buscar minhas inscrições
   */
  static async getMyRegistrations(): Promise<SeasonRegistration[]> {
    try {
      const response = await api.get<{
        message: string;
        data: SeasonRegistration[];
      }>(`${SeasonRegistrationService.BASE_URL}/my`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching my registrations:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar inscrições.'
      );
    }
  }

  /**
   * Buscar inscrição por ID
   */
  static async getById(id: string): Promise<SeasonRegistration> {
    try {
      const response = await api.get<{
        message: string;
        data: SeasonRegistration;
      }>(`${SeasonRegistrationService.BASE_URL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching registration:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar inscrição.'
      );
    }
  }

  /**
   * Buscar dados de pagamento de uma inscrição
   */
  static async getPaymentData(registrationId: string): Promise<RegistrationPaymentData> {
    try {
      const response: AxiosResponse<{ data: RegistrationPaymentData }> = await api.get(
        `${SeasonRegistrationService.BASE_URL}/${registrationId}/payment`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching payment data:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar dados de pagamento.'
      );
    }
  }

  /**
   * Cancelar inscrição
   */
  static async cancel(id: string, reason: string): Promise<SeasonRegistration> {
    try {
      const response = await api.post<{
        message: string;
        data: SeasonRegistration;
      }>(`${SeasonRegistrationService.BASE_URL}/${id}/cancel`, { reason });
      return response.data.data;
    } catch (error: any) {
      console.error('Error cancelling registration:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao cancelar inscrição.'
      );
    }
  }

  /**
   * Listar inscrições de uma temporada (apenas para admins/managers)
   */
  static async getBySeasonId(seasonId: string): Promise<SeasonRegistration[]> {
    try {
      const response = await api.get<{
        message: string;
        data: SeasonRegistration[];
      }>(`${SeasonRegistrationService.BASE_URL}/season/${seasonId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching season registrations:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar inscrições da temporada.'
      );
    }
  }

  /**
   * Listar todas as inscrições de um campeonato (apenas para admins/managers)
   */
  static async getByChampionshipId(championshipId: string): Promise<SeasonRegistration[]> {
    try {
      const response = await api.get<{
        message: string;
        data: SeasonRegistration[];
      }>(`${SeasonRegistrationService.BASE_URL}/championship/${championshipId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching championship registrations:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar inscrições do campeonato.'
      );
    }
  }

  /**
   * Verificar status de configuração de split de um campeonato
   */
  static async checkChampionshipSplitStatus(championshipId: string): Promise<{
    isValid: boolean;
    errors: string[];
    championship: any;
  }> {
    try {
      const response = await api.get<{
        message: string;
        data: {
          isValid: boolean;
          errors: string[];
          championship: any;
        };
      }>(`${SeasonRegistrationService.BASE_URL}/championship/${championshipId}/split-status`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking championship split status:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao verificar status de split do campeonato.'
      );
    }
  }
} 