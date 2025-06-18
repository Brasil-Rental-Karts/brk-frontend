import { useState, useEffect } from 'react';
import { Championship, ChampionshipService } from '@/lib/services/championship.service';
import { CategoryService, Category } from '@/lib/services/category.service';
import { StageService } from '@/lib/services/stage.service';
import { Stage } from '@/lib/types/stage';

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

      // Popular categorias e etapas nas temporadas, se existirem
      if (data.seasons && data.seasons.length > 0) {
        const seasonsWithDetails = await Promise.all(
          data.seasons.map(async (season) => {
            let categories: Category[] = [];
            let stages: Stage[] = [];
            try {
              categories = await CategoryService.getBySeasonId(season.id);
            } catch (error) {
              console.error(`Failed to fetch categories for season ${season.id}`, error);
            }
            try {
              stages = await StageService.getBySeasonId(season.id);
            } catch (error) {
              console.error(`Failed to fetch stages for season ${season.id}`, error);
            }
            return { ...season, categories, stages };
          })
        );
        data.seasons = seasonsWithDetails;
      }
      
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