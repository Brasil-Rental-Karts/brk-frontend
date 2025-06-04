import { useState } from 'react';
import { SeasonService, SeasonData, Season } from '@/lib/services/season.service';

export interface UseCreateSeasonReturn {
  isLoading: boolean;
  error: string | null;
  createSeason: (data: SeasonData) => Promise<Season | null>;
  clearError: () => void;
}

export const useCreateSeason = (): UseCreateSeasonReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSeason = async (data: SeasonData): Promise<Season | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const season = await SeasonService.create(data);
      return season;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar temporada. Tente novamente.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    createSeason,
    clearError,
  };
}; 