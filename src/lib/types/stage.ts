/**
 * Interface para representar uma etapa
 */
export interface Stage {
  id: string;
  name: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  kartodrome: string;
  kartodromeAddress: string;
  streamLink?: string;
  seasonId: string;
  categoryIds: string[];
  doublePoints: boolean;
  briefing?: string;
  briefingTime?: string; // HH:MM format
  schedule?: any; // JSONB field for schedule items
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para criar uma nova etapa
 */
export interface CreateStageData {
  name: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  kartodrome: string;
  kartodromeAddress: string;
  streamLink?: string;
  seasonId: string;
  categoryIds: string[];
  doublePoints?: boolean;
  briefing?: string;
  briefingTime?: string; // HH:MM format
}

/**
 * Interface para atualizar uma etapa
 */
export interface UpdateStageData {
  name?: string;
  date?: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  kartodrome?: string;
  kartodromeAddress?: string;
  streamLink?: string;
  categoryIds?: string[];
  doublePoints?: boolean;
  briefing?: string;
  briefingTime?: string; // HH:MM format
}

/**
 * Interface para estatísticas de etapas
 */
export interface StageStats {
  total: number;
  upcoming: number;
  past: number;
  doublePoints: number;
}

/**
 * Interface para etapa expandida com informações relacionadas
 */
export interface StageWithDetails extends Stage {
  season?: {
    id: string;
    name: string;
    status: string;
  };
  categories?: {
    id: string;
    name: string;
    ballast: string;
  }[];

} 