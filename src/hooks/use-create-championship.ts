import { useState } from 'react';
import { ChampionshipService, ChampionshipData, Championship } from '@/lib/services/championship.service';

export interface UseCreateChampionshipReturn {
  isLoading: boolean;
  error: any;
  createChampionship: (data: ChampionshipData) => Promise<Championship | null>;
  clearError: () => void;
}

export const useCreateChampionship = (): UseCreateChampionshipReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const createChampionship = async (data: ChampionshipData): Promise<Championship | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const championship = await ChampionshipService.create(data);
      return championship;
    } catch (err: any) {
      // Se for erro estruturado do Asaas, usa diretamente
      if (err.response?.data?.type === 'asaas_error') {
        setError(err.response.data);
      } else {
        // Para outros erros, usa formato simples
        const errorMessage = err.message || 'Erro ao criar campeonato. Tente novamente.';
        setError(errorMessage);
      }
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