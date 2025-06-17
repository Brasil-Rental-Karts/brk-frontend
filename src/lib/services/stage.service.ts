import api from '../axios';
import { Stage, CreateStageData, UpdateStageData, StageStats } from '../types/stage';

// Re-export types for easier importing
export type { Stage, CreateStageData, UpdateStageData, StageStats };

export class StageService {
  private static BASE_URL = '/stages';

  /**
   * Buscar todas as etapas
   */
  static async getAll(): Promise<Stage[]> {
    const response = await api.get<Stage[]>(this.BASE_URL);
    return response.data;
  }

  /**
   * Buscar etapa por ID
   */
  static async getById(id: string): Promise<Stage> {
    const response = await api.get<Stage>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Buscar etapas por temporada
   */
  static async getBySeasonId(seasonId: string): Promise<Stage[]> {
    const response = await api.get<Stage[]>(`${this.BASE_URL}/season/${seasonId}`);
    return response.data;
  }

  /**
   * Buscar próximas etapas por temporada
   */
  static async getUpcomingBySeasonId(seasonId: string): Promise<Stage[]> {
    const response = await api.get<Stage[]>(`${this.BASE_URL}/season/${seasonId}/upcoming`);
    return response.data;
  }

  /**
   * Buscar etapas passadas por temporada
   */
  static async getPastBySeasonId(seasonId: string): Promise<Stage[]> {
    const response = await api.get<Stage[]>(`${this.BASE_URL}/season/${seasonId}/past`);
    return response.data;
  }

  /**
   * Buscar próxima etapa por temporada
   */
  static async getNextBySeasonId(seasonId: string): Promise<Stage | null> {
    try {
      const response = await api.get<Stage>(`${this.BASE_URL}/season/${seasonId}/next`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Criar nova etapa
   */
  static async create(data: CreateStageData): Promise<Stage> {
    const response = await api.post<Stage>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Atualizar etapa
   */
  static async update(id: string, data: UpdateStageData): Promise<Stage> {
    const response = await api.put<Stage>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Deletar etapa
   */
  static async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  /**
   * Calcular estatísticas de etapas por temporada
   */
  static async getStatsBySeasonId(seasonId: string): Promise<StageStats> {
    const [all, upcoming, past] = await Promise.all([
      this.getBySeasonId(seasonId),
      this.getUpcomingBySeasonId(seasonId),
      this.getPastBySeasonId(seasonId)
    ]);

    const doublePoints = all.filter(stage => stage.doublePoints).length;

    return {
      total: all.length,
      upcoming: upcoming.length,
      past: past.length,
      doublePoints
    };
  }

  /**
   * Formatar data para exibição (DD/MM/YYYY)
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Formatar horário para exibição (HH:MM)
   */
  static formatTime(timeString: string): string {
    return timeString.substring(0, 5); // Remove seconds if present
  }

  /**
   * Formatar data e hora completa para exibição
   */
  static formatDateTime(dateString: string, timeString: string): string {
    const formattedDate = this.formatDate(dateString);
    const formattedTime = this.formatTime(timeString);
    return `${formattedDate} às ${formattedTime}`;
  }

  /**
   * Verificar se uma etapa já passou
   */
  static isPastStage(dateString: string, timeString: string): boolean {
    const stageDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    return stageDateTime < now;
  }

  /**
   * Verificar se uma etapa é hoje
   */
  static isTodayStage(dateString: string): boolean {
    const stageDate = new Date(dateString);
    const today = new Date();
    
    return stageDate.toDateString() === today.toDateString();
  }

  /**
   * Verificar se uma etapa é em breve (próximos 7 dias)
   */
  static isUpcomingSoon(dateString: string): boolean {
    const stageDate = new Date(dateString);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return stageDate >= today && stageDate <= nextWeek;
  }

  /**
   * Obter status da etapa (passada, hoje, em breve, futura)
   */
  static getStageStatus(dateString: string, timeString: string): 'past' | 'today' | 'soon' | 'future' {
    if (this.isPastStage(dateString, timeString)) {
      return 'past';
    }
    
    if (this.isTodayStage(dateString)) {
      return 'today';
    }
    
    if (this.isUpcomingSoon(dateString)) {
      return 'soon';
    }
    
    return 'future';
  }

  /**
   * Calcular tempo restante até a etapa
   */
  static getTimeUntilStage(dateString: string, timeString: string): {
    days: number;
    hours: number;
    minutes: number;
  } {
    const stageDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diff = stageDateTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes };
  }

  /**
   * Validar se os dados de uma etapa estão corretos
   */
  static validateStageData(data: CreateStageData | UpdateStageData): string[] {
    const errors: string[] = [];
    
    if ('name' in data && data.name && data.name.trim().length === 0) {
      errors.push('Nome da etapa é obrigatório');
    }
    
    if ('date' in data && data.date) {
      const stageDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (stageDate < today) {
        errors.push('Data da etapa não pode ser no passado');
      }
    }
    
    if ('time' in data && data.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
      errors.push('Horário deve estar no formato HH:MM');
    }
    
    if ('kartodrome' in data && data.kartodrome && data.kartodrome.trim().length === 0) {
      errors.push('Nome do kartódromo é obrigatório');
    }
    
    if ('kartodromeAddress' in data && data.kartodromeAddress && data.kartodromeAddress.trim().length === 0) {
      errors.push('Endereço do kartódromo é obrigatório');
    }
    
    if ('categoryIds' in data && data.categoryIds && data.categoryIds.length === 0) {
      errors.push('Pelo menos uma categoria deve ser selecionada');
    }
    
    if ('streamLink' in data && data.streamLink && data.streamLink.trim().length > 0) {
      try {
        new URL(data.streamLink);
      } catch {
        errors.push('Link de transmissão deve ser uma URL válida');
      }
    }
    
    return errors;
  }
} 