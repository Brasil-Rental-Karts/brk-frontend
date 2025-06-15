import { useState, useEffect } from 'react';
import { StageService } from '@/lib/services/stage.service';
import { useUserRegistrations } from './use-user-registrations';
import type { Stage } from '@/lib/types/stage';

export interface UserUpcomingRace {
  stage: Stage;
  championship: {
    id: string;
    name: string;
  };
  season: {
    id: string;
    name: string;
  };
}

export const useUserUpcomingRaces = () => {
  const { registrations, loading: registrationsLoading } = useUserRegistrations();
  const [upcomingRaces, setUpcomingRaces] = useState<UserUpcomingRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingRaces = async () => {
    if (registrationsLoading || registrations.length === 0) {
      setUpcomingRaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar etapas futuras para cada temporada onde o usuário está inscrito
      const racePromises = registrations
        .filter(registration => 
          registration.status === 'confirmed' || registration.status === 'payment_pending'
        )
        .map(async (registration) => {
          try {
            const upcomingStages = await StageService.getUpcomingBySeasonId(registration.seasonId);
            
            return upcomingStages.map(stage => ({
              stage,
              championship: {
                id: registration.season.championshipId,
                name: 'Carregando...' // Será atualizado depois
              },
              season: {
                id: registration.season.id,
                name: registration.season.name
              }
            }));
          } catch (error) {
            console.error(`Erro ao buscar etapas da temporada ${registration.seasonId}:`, error);
            return [];
          }
        });

      const allRaces = await Promise.all(racePromises);
      const flatRaces = allRaces.flat();

      // Ordenar por data e hora
      const sortedRaces = flatRaces.sort((a, b) => {
        const dateA = new Date(`${a.stage.date}T${a.stage.time}`);
        const dateB = new Date(`${b.stage.date}T${b.stage.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // Pegar apenas as próximas 10 corridas
      const limitedRaces = sortedRaces.slice(0, 10);

      setUpcomingRaces(limitedRaces);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar próximas corridas');
      setUpcomingRaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingRaces();
  }, [registrations, registrationsLoading]);

  return {
    upcomingRaces,
    loading: loading || registrationsLoading,
    error,
    refresh: fetchUpcomingRaces
  };
}; 