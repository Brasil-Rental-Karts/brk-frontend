import { useState, useEffect } from 'react';
import { Championship, ChampionshipService } from '@/lib/services/championship.service';

export interface UseChampionshipReturn {
  championship: Championship | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para gerenciar dados de um campeonato específico
 * @param championshipId ID do campeonato
 * @returns Dados do campeonato, estado de loading, erro e função de refresh
 */
export const useChampionship = (championshipId: string | undefined): UseChampionshipReturn => {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChampionship = async () => {
    if (!championshipId) {
      setError("ID do campeonato não fornecido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await ChampionshipService.getById(championshipId);
      
      // Não buscar categorias e etapas aqui - o ChampionshipContext fará isso
      // para evitar duplicação de chamadas
      setChampionship(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar campeonato");
      setChampionship(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchChampionship();
  };

  useEffect(() => {
    fetchChampionship();
  }, [championshipId]);

  return {
    championship,
    loading,
    error,
    refresh,
  };
}; 