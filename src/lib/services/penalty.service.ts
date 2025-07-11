import api from '../axios';

export enum PenaltyType {
  DISQUALIFICATION = 'disqualification',
  TIME_PENALTY = 'time_penalty',
  POSITION_PENALTY = 'position_penalty',
  SUSPENSION = 'suspension',
  WARNING = 'warning'
}

export enum PenaltyStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  CANCELLED = 'cancelled',
  APPEALED = 'appealed'
}

export interface CreatePenaltyData {
  type: PenaltyType;
  reason: string;
  description?: string;
  timePenaltySeconds?: number;
  positionPenalty?: number;
  suspensionStages?: number;
  suspensionUntil?: string;
  batteryIndex?: number;
  userId: string;
  championshipId: string;
  seasonId?: string;
  stageId?: string;
  categoryId?: string;
}

export interface UpdatePenaltyData {
  status?: PenaltyStatus;
  reason?: string;
  description?: string;
  timePenaltySeconds?: number;
  positionPenalty?: number;
  suspensionStages?: number;
  suspensionUntil?: string;
  batteryIndex?: number;
}

export interface AppealPenaltyData {
  appealReason: string;
}

export interface Penalty {
  id: string;
  type: PenaltyType;
  status: PenaltyStatus;
  reason: string;
  description?: string;
  timePenaltySeconds?: number;
  positionPenalty?: number;
  suspensionStages?: number;
  suspensionUntil?: string;
  batteryIndex?: number;
  userId: string;
  championshipId: string;
  seasonId?: string;
  stageId?: string;
  categoryId?: string;
  appliedByUserId: string;
  appealReason?: string;
  appealedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  appliedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  appealedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  championship?: {
    id: string;
    name: string;
  };
  season?: {
    id: string;
    name: string;
  };
  stage?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export class PenaltyService {
  static async createPenalty(data: CreatePenaltyData): Promise<Penalty> {
    const response = await api.post('/penalties', data);
    return response.data;
  }

  static async updatePenalty(id: string, data: UpdatePenaltyData): Promise<Penalty> {
    const response = await api.put(`/penalties/${id}`, data);
    return response.data;
  }

  static async applyPenalty(id: string): Promise<Penalty> {
    const response = await api.post(`/penalties/${id}/apply`);
    return response.data;
  }

  static async cancelPenalty(id: string): Promise<Penalty> {
    const response = await api.post(`/penalties/${id}/cancel`);
    return response.data;
  }

  static async appealPenalty(id: string, data: AppealPenaltyData): Promise<Penalty> {
    const response = await api.post(`/penalties/${id}/appeal`, data);
    return response.data;
  }

  static async getPenaltyById(id: string): Promise<Penalty> {
    const response = await api.get(`/penalties/${id}`);
    return response.data;
  }

  static async getPenaltiesByUserId(userId: string): Promise<Penalty[]> {
    const response = await api.get(`/penalties/user/${userId}`);
    return response.data;
  }

  static async getPenaltiesByChampionshipId(championshipId: string): Promise<Penalty[]> {
    const response = await api.get(`/penalties/championship/${championshipId}`);
    return response.data;
  }

  static async getPenaltiesBySeasonId(seasonId: string): Promise<Penalty[]> {
    const response = await api.get(`/penalties/season/${seasonId}`);
    return response.data;
  }

  static async getPenaltiesByStageId(stageId: string): Promise<Penalty[]> {
    const response = await api.get(`/penalties/stage/${stageId}`);
    return response.data;
  }

  static async getPenaltiesByCategoryId(categoryId: string): Promise<Penalty[]> {
    const response = await api.get(`/penalties/category/${categoryId}`);
    return response.data;
  }

  static async getActivePenalties(userId: string, championshipId: string): Promise<Penalty[]> {
    const response = await api.get(`/penalties/active/${userId}/${championshipId}`);
    return response.data;
  }

  static async getPendingPenalties(): Promise<Penalty[]> {
    const response = await api.get('/penalties/pending');
    return response.data;
  }

  static async getPenaltiesByType(type: PenaltyType): Promise<Penalty[]> {
    const response = await api.get(`/penalties/type/${type}`);
    return response.data;
  }

  static async getPenaltiesByStatus(status: PenaltyStatus): Promise<Penalty[]> {
    const response = await api.get(`/penalties/status/${status}`);
    return response.data;
  }

  static async deletePenalty(id: string): Promise<boolean> {
    const response = await api.delete(`/penalties/${id}`);
    return response.status === 204;
  }

  // Helper methods for UI
  static getPenaltyTypeLabel(type: PenaltyType): string {
    switch (type) {
      case PenaltyType.DISQUALIFICATION:
        return 'Desqualificação';
      case PenaltyType.TIME_PENALTY:
        return 'Penalidade de Tempo';
      case PenaltyType.POSITION_PENALTY:
        return 'Penalidade de Posição';
      case PenaltyType.SUSPENSION:
        return 'Suspensão';
      case PenaltyType.WARNING:
        return 'Advertência';
      default:
        return type;
    }
  }

  static getPenaltyStatusLabel(status: PenaltyStatus): string {
    switch (status) {
      case PenaltyStatus.PENDING:
        return 'Pendente';
      case PenaltyStatus.APPLIED:
        return 'Aplicada';
      case PenaltyStatus.CANCELLED:
        return 'Cancelada';
      case PenaltyStatus.APPEALED:
        return 'Recorrida';
      default:
        return status;
    }
  }

  static getPenaltyStatusColor(status: PenaltyStatus): string {
    switch (status) {
      case PenaltyStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PenaltyStatus.APPLIED:
        return 'bg-red-100 text-red-800';
      case PenaltyStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      case PenaltyStatus.APPEALED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  static getPenaltyTypeColor(type: PenaltyType): string {
    switch (type) {
      case PenaltyType.DISQUALIFICATION:
        return 'bg-red-100 text-red-800';
      case PenaltyType.TIME_PENALTY:
        return 'bg-orange-100 text-orange-800';
      case PenaltyType.POSITION_PENALTY:
        return 'bg-yellow-100 text-yellow-800';
      case PenaltyType.SUSPENSION:
        return 'bg-purple-100 text-purple-800';
      case PenaltyType.WARNING:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
} 