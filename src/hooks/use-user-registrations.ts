import { useState, useEffect } from 'react';
import { SeasonRegistrationService, type SeasonRegistration } from '@/lib/services/season-registration.service';
import { ChampionshipService, type Championship } from '@/lib/services/championship.service';
import { useAuth } from '@/contexts/AuthContext';

export interface UserChampionshipParticipation {
  championship: Championship;
  seasons: {
    id: string;
    name: string;
    registrationStatus: string;
    paymentStatus: string;
  }[];
}

export const useUserRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [championshipsParticipating, setChampionshipsParticipating] = useState<UserChampionshipParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRegistrations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar todas as inscrições do usuário
      const userRegistrations = await SeasonRegistrationService.getMyRegistrations();
      setRegistrations(userRegistrations);

      // Buscar todos os campeonatos do usuário (incluindo onde é apenas piloto)
      const allUserChampionships = await ChampionshipService.getMy();
      
      // Filtrar apenas campeonatos onde o usuário é piloto (não owner nem staff)
      const pilotChampionships = allUserChampionships.filter(championship => 
        championship.isPilot && !championship.isOwner && !championship.isStaff
      );

      // Agrupar por campeonato
      const grouped: UserChampionshipParticipation[] = pilotChampionships.map(championship => {
        const championshipRegistrations = userRegistrations.filter(reg => 
          reg.season?.championshipId === championship.id
        );

        const seasons = championshipRegistrations.map(reg => ({
          id: reg.season.id,
          name: reg.season.name,
          registrationStatus: reg.status,
          paymentStatus: reg.paymentStatus
        }));

        return {
          championship,
          seasons
        };
      });

      setChampionshipsParticipating(grouped);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar inscrições');
      setRegistrations([]);
      setChampionshipsParticipating([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRegistrations();
  }, [user]);

  return {
    registrations,
    championshipsParticipating,
    loading,
    error,
    refresh: fetchUserRegistrations
  };
}; 