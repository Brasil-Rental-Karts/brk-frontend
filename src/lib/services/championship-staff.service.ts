import api from '../axios';
import { AxiosError } from 'axios';

export interface StaffMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: 'staff' | 'owner';
  addedAt: string;
  addedBy: {
    id: string;
    name: string;
    email: string;
  };
  isOwner?: boolean;
}

export interface AddStaffMemberRequest {
  email: string;
}

export interface StaffMemberResponse {
  message: string;
  data: StaffMember;
}

export interface StaffListResponse {
  data: StaffMember[];
}

/**
 * Serviço para gerenciar staff de campeonatos
 */
export class ChampionshipStaffService {
  private static readonly BASE_URL = '/championships';

  /**
   * Buscar membros do staff de um campeonato
   */
  static async getStaffMembers(championshipId: string): Promise<StaffMember[]> {
    try {
      const response = await api.get<StaffListResponse>(`${ChampionshipStaffService.BASE_URL}/${championshipId}/staff`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar membros da equipe. Tente novamente.'
      );
    }
  }

  /**
   * Adicionar membro ao staff
   */
  static async addStaffMember(championshipId: string, request: AddStaffMemberRequest): Promise<StaffMember> {
    try {
      const response = await api.post<StaffMemberResponse>(`${ChampionshipStaffService.BASE_URL}/${championshipId}/staff`, request);
      return response.data.data;
    } catch (error: any) {
      console.error('Error adding staff member:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao adicionar membro à equipe. Tente novamente.'
      );
    }
  }

  /**
   * Remover membro do staff
   */
  static async removeStaffMember(championshipId: string, staffMemberId: string): Promise<void> {
    try {
      await api.delete(`${ChampionshipStaffService.BASE_URL}/${championshipId}/staff/${staffMemberId}`);
    } catch (error: any) {
      console.error('Error removing staff member:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao remover membro da equipe. Tente novamente.'
      );
    }
  }
} 