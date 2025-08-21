import api from "../axios";

export interface PaymentCondition {
  type: "por_temporada" | "por_etapa";
  value: number;
  description?: string;
  enabled: boolean;
  paymentMethods: ("pix" | "cartao_credito")[];
  pixInstallments?: number;
  creditCardInstallments?: number;
}

export interface SeasonData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "agendado" | "em_andamento" | "cancelado" | "finalizado";
  registrationOpen: boolean;
  // Nova estrutura para múltiplas condições de pagamento
  paymentConditions?: PaymentCondition[];
  // Campos legados para compatibilidade
  inscriptionValue?: number | string; // Decimal vem como string do backend
  inscriptionType?: "por_temporada" | "por_etapa";
  paymentMethods: ("pix" | "cartao_credito")[];
  championshipId: string;
  pixInstallments?: number;
  creditCardInstallments?: number;
  regulationsEnabled?: boolean;
}

export interface Season extends SeasonData {
  id: string;
  slug: string;
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
  private static readonly BASE_URL = "/seasons";

  /**
   * Criar uma nova temporada
   */
  static async create(data: SeasonData): Promise<Season> {
    try {
      const response = await api.post<Season>(SeasonService.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating season:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao criar temporada. Tente novamente.",
      );
    }
  }

  /**
   * Salvar classificação calculada no Redis (season:{id} -> field classification)
   */
  static async setClassification(
    seasonId: string,
    payload: any,
  ): Promise<void> {
    try {
      await api.post(`${SeasonService.BASE_URL}/${seasonId}/classification`, payload);
    } catch (error: any) {
      console.error("Error setting season classification:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao salvar classificação da temporada.",
      );
    }
  }

  /**
   * Buscar temporada por ID
   */
  static async getById(id: string): Promise<Season> {
    try {
      const response = await api.get<Season>(`${SeasonService.BASE_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching season:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar temporada.",
      );
    }
  }

  /**
   * Listar todas as temporadas com paginação
   */
  static async getAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedSeasons> {
    try {
      const response = await api.get<PaginatedSeasons>(
        `${SeasonService.BASE_URL}?page=${page}&limit=${limit}`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching seasons:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar temporadas.",
      );
    }
  }

  /**
   * Listar temporadas de um campeonato específico
   */
  static async getByChampionshipId(
    championshipId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedSeasons> {
    try {
      const response = await api.get<PaginatedSeasons>(
        `${SeasonService.BASE_URL}/championship/${championshipId}?page=${page}&limit=${limit}`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching seasons by championship:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erro ao buscar temporadas do campeonato.",
      );
    }
  }

  /**
   * Atualizar temporada
   */
  static async update(id: string, data: Partial<SeasonData>): Promise<Season> {
    try {
      const response = await api.put<Season>(
        `${SeasonService.BASE_URL}/${id}`,
        data,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating season:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao atualizar temporada.",
      );
    }
  }

  /**
   * Deletar temporada
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`${SeasonService.BASE_URL}/${id}`);
    } catch (error: any) {
      console.error("Error deleting season:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao deletar temporada.",
      );
    }
  }

  /**
   * Métodos auxiliares para compatibilidade
   */
  static getInscriptionValue(season: Season): number {
    if (season.paymentConditions && season.paymentConditions.length > 0) {
      // Retorna o valor da primeira condição ativa por temporada
      const tempCondition = season.paymentConditions.find(
        (c) => c.type === "por_temporada" && c.enabled,
      );
      return tempCondition ? tempCondition.value : 0;
    }
    return Number(season.inscriptionValue) || 0;
  }

  static getInscriptionType(season: Season): "por_temporada" | "por_etapa" {
    if (season.paymentConditions && season.paymentConditions.length > 0) {
      // Se há condições por etapa ativas, retorna por_etapa
      const hasStageConditions = season.paymentConditions.some(
        (c) => c.type === "por_etapa" && c.enabled,
      );
      return hasStageConditions ? "por_etapa" : "por_temporada";
    }
    return season.inscriptionType || "por_temporada";
  }

  static hasPaymentCondition(
    season: Season,
    type: "por_temporada" | "por_etapa",
  ): boolean {
    return (
      season.paymentConditions?.some((c) => c.type === type && c.enabled) ||
      false
    );
  }

  static getPaymentCondition(
    season: Season,
    type: "por_temporada" | "por_etapa",
  ): PaymentCondition | undefined {
    return season.paymentConditions?.find((c) => c.type === type && c.enabled);
  }

  /**
   * Métodos auxiliares para métodos de pagamento por condição
   */
  static getPaymentMethodsForCondition(
    season: Season,
    type: "por_temporada" | "por_etapa",
  ): ("pix" | "cartao_credito")[] {
    const condition = SeasonService.getPaymentCondition(season, type);
    return condition?.paymentMethods || [];
  }

  static getPixInstallmentsForCondition(
    season: Season,
    type: "por_temporada" | "por_etapa",
  ): number {
    const condition = SeasonService.getPaymentCondition(season, type);
    return condition?.pixInstallments || season.pixInstallments || 1;
  }

  static getCreditCardInstallmentsForCondition(
    season: Season,
    type: "por_temporada" | "por_etapa",
  ): number {
    const condition = SeasonService.getPaymentCondition(season, type);
    return (
      condition?.creditCardInstallments || season.creditCardInstallments || 1
    );
  }
}
