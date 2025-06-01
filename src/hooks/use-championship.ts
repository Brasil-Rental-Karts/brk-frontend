import { useState } from 'react';
import { ChampionshipService, ChampionshipData, Championship } from '@/lib/services/championship.service';

export interface UseChampionshipReturn {
  isLoading: boolean;
  error: string | null;
  createChampionship: (data: ChampionshipData) => Promise<Championship | null>;
  clearError: () => void;
}

export const useChampionship = (): UseChampionshipReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChampionship = async (data: ChampionshipData): Promise<Championship | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const championship = await ChampionshipService.create(data);
      return championship;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar campeonato. Tente novamente.';
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
    createChampionship,
    clearError,
  };
}; 