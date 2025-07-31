import api from "../axios";

export interface SeasonRegistration {
  id: string;
  userId: string;
  seasonId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  amount: number;
  paymentDate?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  inscriptionType: 'por_temporada' | 'por_etapa';
  createdAt: string;
  updatedAt: string;
  user: any; // Simplified for now
  season: any; // Simplified for now
  categories: any[]; // Simplified for now
  stages?: any[]; // Simplified for now
  payments: RegistrationPaymentData[];
}

export interface CreateRegistrationData {
  userId: string;
  seasonId: string;
  categoryIds: string[];
  stageIds?: string[]; // Array de IDs das etapas selecionadas (opcional)
  paymentMethod: "pix" | "cartao_credito";
  userDocument: string;
  installments?: number;
  totalAmount?: number; // Valor total calculado incluindo taxas
}

export interface CreateAdminRegistrationData {
  userId: string;
  seasonId: string;
  categoryIds: string[];
  stageIds?: string[];
  paymentStatus: "exempt" | "direct_payment";
  amount: number;
  notes?: string;
}

export interface UpdateCategoriesData {
  categoryIds: string[];
}

export interface RegistrationPaymentData {
  id: string;
  registrationId: string;
  billingType: string;
  value: number;
  dueDate: string;
  status: string;
  installmentNumber?: number | null;
  installmentCount?: number | null;
  expirationDate?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  paymentLink?: string | null;
  pixKey?: string | null;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
}

export interface PilotDetails {
  registration: SeasonRegistration;
  user: any;
  profile: any;
  payments: RegistrationPaymentData[];
}

export class SeasonRegistrationService {
  private static readonly BASE_URL = "/season-registrations";

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
      }>("/season-registrations", data);

      return response.data.data;
    } catch (error: any) {
      console.error("Error creating registration:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao criar inscrição. Tente novamente.",
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
      console.error("Error fetching my registrations:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar inscrições.",
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
      console.error("Error fetching registration:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar inscrição.",
      );
    }
  }

  /**
   * Buscar dados de pagamento de uma inscrição (pode retornar várias parcelas)
   */
  static async getPaymentData(
    registrationId: string,
  ): Promise<RegistrationPaymentData[]> {
    try {
      const response = await api.get<{
        message: string;
        data: RegistrationPaymentData[];
      }>(`/season-registrations/${registrationId}/payment`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching payment data:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar dados de pagamento.",
      );
    }
  }

  /**
   * Buscar inscrições de um usuário em uma temporada específica
   */
  static async getUserRegistrationsBySeason(
    userId: string,
    seasonId: string,
  ): Promise<SeasonRegistration[]> {
    try {
      const response = await api.get<{
        message: string;
        data: SeasonRegistration[];
      }>(`/season-registrations/user/${userId}/season/${seasonId}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching user registrations by season:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao buscar inscrições do usuário na temporada.",
      );
    }
  }

  /**
   * Sincronizar status de pagamento com o Asaas
   */
  static async syncPaymentStatus(
    registrationId: string,
  ): Promise<RegistrationPaymentData[]> {
    try {
      const response = await api.post<{
        message: string;
        data: RegistrationPaymentData[];
      }>(`/season-registrations/${registrationId}/sync-payment`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error syncing payment status:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao sincronizar status de pagamento.",
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
      console.error("Error cancelling registration:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao cancelar inscrição.",
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
      console.error("Error fetching season registrations:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao buscar inscrições da temporada.",
      );
    }
  }

  /**
   * Listar todas as inscrições de um campeonato (apenas para admins/managers)
   */
  static async getByChampionshipId(
    championshipId: string,
  ): Promise<SeasonRegistration[]> {
    try {
      const response = await api.get<{
        message: string;
        data: SeasonRegistration[];
      }>(
        `${SeasonRegistrationService.BASE_URL}/championship/${championshipId}`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching championship registrations:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao buscar inscrições do campeonato.",
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
      }>(
        `${SeasonRegistrationService.BASE_URL}/championship/${championshipId}/split-status`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error checking championship split status:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao verificar status de configuração do campeonato.",
      );
    }
  }

  /**
   * Contar inscrições confirmadas de uma categoria
   */
  static async getCategoryRegistrationCount(
    categoryId: string,
  ): Promise<number> {
    try {
      const response = await api.get<{
        message: string;
        data: { count: number };
      }>(`${SeasonRegistrationService.BASE_URL}/category/${categoryId}/count`);
      return response.data.data.count;
    } catch (error: any) {
      console.error("Error getting category registration count:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao contar inscrições da categoria.",
      );
    }
  }

  /**
   * Atualizar categorias de uma inscrição
   */
  static async updateCategories(
    registrationId: string,
    data: UpdateCategoriesData,
  ): Promise<SeasonRegistration> {
    try {
      const response = await api.put<{
        message: string;
        data: SeasonRegistration;
      }>(
        `${SeasonRegistrationService.BASE_URL}/${registrationId}/categories`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating registration categories:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao atualizar categorias da inscrição.",
      );
    }
  }

  /**
   * Buscar detalhes completos do piloto inscrito
   */
  static async getPilotDetails(registrationId: string): Promise<PilotDetails> {
    try {
      const response = await api.get<{
        message: string;
        data: PilotDetails;
      }>(
        `${SeasonRegistrationService.BASE_URL}/${registrationId}/pilot-details`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching pilot details:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar detalhes do piloto.",
      );
    }
  }

  /**
   * Criar ou atualizar inscrição administrativa
   */
  static async createAdminRegistration(
    data: CreateAdminRegistrationData,
  ): Promise<{
    registration: SeasonRegistration;
    isUpdate: boolean;
  }> {
    try {
      const response = await api.post<{
        message: string;
        data: SeasonRegistration;
        isUpdate?: boolean;
      }>(`${SeasonRegistrationService.BASE_URL}/admin`, data);

      return {
        registration: response.data.data,
        isUpdate: response.data.isUpdate || false,
      };
    } catch (error: any) {
      console.error("Error creating/updating admin registration:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao criar/atualizar inscrição administrativa.",
      );
    }
  }
}
