/**
 * Interface para representar uma etapa
 */
export interface Stage {
  id: string;
  name: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  raceTrackId: string;
  trackLayoutId?: string;
  streamLink?: string;
  seasonId: string;
  categoryIds: string[];
  doublePoints: boolean;
  briefing?: string;
  briefingTime?: string; // HH:MM format
  schedule?: any; // JSONB field for schedule items
  fleets?: any[]; // JSONB field for fleets configuration
  kart_draw_assignments?: {
    results: {
      [categoryId: string]: {
        [pilotId: string]: {
          [batteryIndex: number]: {
            kart: number;
          };
        };
      };
    };
    categoryFleetAssignments: {
      [categoryId: string]: string;
    };
  };
  stage_results?: {
    [categoryId: string]: {
      [pilotId: string]: {
        [batteryIndex: number]: {
          bestLap?: string;
          totalTime?: string;
          startPosition?: number;
          finishPosition?: number;
          qualifyingBestLap?: string;
          weight?: boolean;
        };
      };
    };
  };
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
  raceTrackId: string;
  trackLayoutId?: string;
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
  raceTrackId?: string;
  trackLayoutId?: string;
  streamLink?: string;
  categoryIds?: string[];
  doublePoints?: boolean;
  briefing?: string;
  briefingTime?: string; // HH:MM format
  fleets?: any[]; // JSONB field for fleets configuration
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