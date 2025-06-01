import { useState, useEffect } from 'react';
import { ChampionshipService } from '@/lib/services/championship.service';
import { useChampionshipContext } from '@/contexts/ChampionshipContext';

export interface UseDashboardChampionshipsReturn {
  loadingChampionships: boolean;
  championshipsError: string | null;
  refreshChampionships: () => Promise<void>;
}

export const useDashboardChampionships = (): UseDashboardChampionshipsReturn => {
  const [loadingChampionships, setLoadingChampionships] = useState(true);
  const [championshipsError, setChampionshipsError] = useState<string | null>(null);
  
  const { 
    setChampionshipsOrganized, 
    refreshTrigger 
  } = useChampionshipContext();

  const fetchMyChampionships = async () => {
    try {
      setLoadingChampionships(true);
      setChampionshipsError(null);
      const championships = await ChampionshipService.getMy();
      setChampionshipsOrganized(championships);
    } catch (error: any) {
      console.error('Error fetching my championships:', error);
      setChampionshipsError(error.message || 'Erro ao carregar campeonatos');
    } finally {
      setLoadingChampionships(false);
    }
  };

  const refreshChampionships = async () => {
    await fetchMyChampionships();
  };

  useEffect(() => {
    fetchMyChampionships();
  }, [refreshTrigger]);

  return {
    loadingChampionships,
    championshipsError,
    refreshChampionships,
  };
}; 