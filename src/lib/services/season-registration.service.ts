import api from "../axios";

export interface MemberProfile {
  id: string;
  lastLoginAt: string;
  nickName: string;
  birthDate?: string;
  gender?: number;
  city: string;
  state: string;
  experienceTime?: number;
  raceFrequency?: number;
  championshipParticipation?: number;
  competitiveLevel?: number;
  hasOwnKart: boolean;
  isTeamMember: boolean;
  teamName?: string;
  usesTelemetry: boolean;
  telemetryType?: string;
  attendsEvents?: number;
  interestCategories?: number[];
  preferredTrack?: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    nickname?: string | null;
  };
  season: any; // Simplified for now
  categories: any[]; // Simplified for now
  stages?: any[]; // Simplified for now
  payments: RegistrationPaymentData[];
  profile: MemberProfile | null;
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
  inscriptionType?: "por_temporada" | "por_etapa"; // Tipo de inscrição selecionado pelo usuário
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

// UpdateCategoriesData removido (funcionalidade da aba Pilotos)

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

// PilotDetails removido (funcionalidade da aba Pilotos)

export class SeasonRegistrationService {
  private static readonly BASE_URL = "/season-registrations";

  /**
   * Verificar elegibilidade do usuário para pré-inscrição
   */
  static async checkPreRegistrationEligibility(
    seasonId: string
  ): Promise<{ eligible: boolean; previousSeasonId?: string }> {
    try {
      const response = await api.get<{
        eligible: boolean;
        previousSeasonId?: string;
      }>(`/season-registrations/pre-registration-eligibility/${seasonId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error checking pre-registration eligibility:", error);
      // Se houver erro, assumir não elegível
      return { eligible: false };
    }
  }

  /**
   * Criar uma nova inscrição em temporada
   */
  static async create(data: CreateRegistrationData): Promise<{
    registration: SeasonRegistration;
    paymentData: RegistrationPaymentData;
    message?: string;
    preRegistrationPeriod?: boolean;
  }> {
    try {
      const response = await api.post<{
        message: string;
        data: {
          registration: SeasonRegistration;
          paymentData: RegistrationPaymentData;
        };
        preRegistrationPeriod?: boolean;
      }>("/season-registrations", data);

      return {
        ...response.data.data,
        message: response.data.message,
        preRegistrationPeriod: response.data.preRegistrationPeriod,
      };
    } catch (error: any) {
      console.error("Error creating registration:", error);
      
      // Se for erro 403 de pré-inscrição, preservar a resposta completa
      if (error.response?.status === 403 && error.response?.data?.code === 'PRE_REGISTRATION_PERIOD_ACTIVE') {
        const customError: any = new Error(error.response.data.message || "Erro ao criar inscrição.");
        customError.status = 403;
        customError.code = error.response.data.code;
        customError.generalRegistrationDate = error.response.data.generalRegistrationDate;
        throw customError;
      }
      
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
   * Contar inscrições confirmadas de uma etapa
   */
  static async getStageRegistrationCount(
    stageId: string,
  ): Promise<number> {
    try {
      const response = await api.get<{
        message: string;
        data: { count: number };
      }>(`${SeasonRegistrationService.BASE_URL}/stage/${stageId}/count`);
      return response.data.data.count;
    } catch (error: any) {
      console.error("Error getting stage registration count:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao contar inscrições da etapa.",
      );
    }
  }

  /**
   * Contar inscrições confirmadas de uma etapa por categoria
   */
  static async getStageCategoryRegistrationCount(
    stageId: string,
    categoryId: string,
  ): Promise<number> {
    try {
      const response = await api.get<{
        message: string;
        data: { count: number };
      }>(`${SeasonRegistrationService.BASE_URL}/stage/${stageId}/category/${categoryId}/count`);
      return response.data.data.count;
    } catch (error: any) {
      console.error("Error getting stage+category registration count:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao contar inscrições da etapa por categoria.",
      );
    }
  }

  /**
   * Atualizar categorias de uma inscrição
   */
  // updateCategories removido (funcionalidade da aba Pilotos)

  /**
   * Buscar detalhes completos do piloto inscrito
   */
  // getPilotDetails removido (funcionalidade da aba Pilotos)

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
