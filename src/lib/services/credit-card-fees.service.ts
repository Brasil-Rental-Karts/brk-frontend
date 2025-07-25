import api from "../axios";

export interface CreditCardFees {
  id: string;
  championshipId: string;
  installmentRange: string;
  percentageRate: number | string;
  fixedFee: number | string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  championship?: {
    id: string;
    name: string;
  };
}

export interface CreateCreditCardFeesData {
  championshipId: string;
  installmentRange: string;
  percentageRate: number;
  fixedFee: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCreditCardFeesData {
  installmentRange?: string;
  percentageRate?: number;
  fixedFee?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreditCardFeesRate {
  percentageRate: number;
  fixedFee: number;
  isDefault: boolean;
}

export class CreditCardFeesService {
  async findAll(): Promise<CreditCardFees[]> {
    const response = await api.get("/credit-card-fees");
    return response.data;
  }

  async findById(id: string): Promise<CreditCardFees> {
    const response = await api.get(`/credit-card-fees/${id}`);
    return response.data;
  }

  async findByChampionshipId(
    championshipId: string,
  ): Promise<CreditCardFees[]> {
    const response = await api.get(
      `/credit-card-fees/championship/${championshipId}`,
    );
    return response.data;
  }

  async create(data: CreateCreditCardFeesData): Promise<CreditCardFees> {
    const response = await api.post("/credit-card-fees", data);
    return response.data;
  }

  async update(
    id: string,
    data: UpdateCreditCardFeesData,
  ): Promise<CreditCardFees> {
    const response = await api.put(`/credit-card-fees/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/credit-card-fees/${id}`);
  }

  async getRateForInstallments(
    championshipId: string,
    installments: number,
  ): Promise<CreditCardFeesRate> {
    const response = await api.get(
      `/credit-card-fees/championship/${championshipId}/installments/${installments}`,
    );
    return response.data;
  }
}
