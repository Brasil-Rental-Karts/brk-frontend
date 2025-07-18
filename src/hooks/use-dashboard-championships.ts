import { useState, useEffect } from 'react';
import { ChampionshipService } from '@/lib/services/championship.service';

export interface UseDashboardChampionshipsReturn {
  loadingChampionships: boolean;
  championshipsError: string | null;
  refreshChampionships: () => Promise<void>;
  championshipsOrganized: any[];
}

export const useDashboardChampionships = (): UseDashboardChampionshipsReturn => {
  const [loadingChampionships, setLoadingChampionships] = useState(true);
  const [championshipsError, setChampionshipsError] = useState<string | null>(null);
  const [championshipsOrganized, setChampionshipsOrganized] = useState<any[]>([]);

  const fetchMyChampionships = async () => {
    try {
      setLoadingChampionships(true);
      setChampionshipsError(null);
      const allChampionships = await ChampionshipService.getMy();
      
      // Filtrar apenas campeonatos onde o usuário é owner ou staff (organizando)
      const filteredChampionships = allChampionships.filter(championship => 
        championship.isOwner || championship.isStaff
      );
      
      setChampionshipsOrganized(filteredChampionships);
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
  }, []);

  return {
    loadingChampionships,
    championshipsError,
    refreshChampionships,
    championshipsOrganized,
  };
}; 