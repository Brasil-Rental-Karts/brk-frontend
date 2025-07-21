import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChampionshipService, Championship } from '@/lib/services/championship.service';
import { StageService } from '@/lib/services/stage.service';
import { SeasonService } from '@/lib/services/season.service';
import { StageParticipationService, type AvailableCategory } from '@/lib/services/stage-participation.service';
import { UserStatsService, type UserBasicStats } from '@/lib/services/user-stats.service';
import { RaceTrackService } from '@/lib/services/race-track.service';
import { SeasonRegistrationService, type SeasonRegistration } from '@/lib/services/season-registration.service';
import { useAuth } from './AuthContext';
import type { Stage } from '@/lib/types/stage';

// Interfaces para os dados do Dashboard
export interface DashboardChampionship {
  id: string;
  name: string;
  shortDescription?: string;
  createdAt: string;
  slug: string;
  isOwner: boolean;
  isStaff: boolean;
  isPilot: boolean;
}

export interface DashboardSeason {
  id: string;
  name: string;
  registrationStatus: string;
  paymentStatus: string;
  totalInstallments: number;
  paidInstallments: number;
}

export interface DashboardChampionshipParticipation {
  championship: DashboardChampionship;
  seasons: DashboardSeason[];
}

export interface DashboardUpcomingRace {
  stage: Stage;
  championship: {
    id: string;
    name: string;
  };
  season: {
    id: string;
    name: string;
  };
  isOrganizer: boolean;
  availableCategories?: AvailableCategory[];
  hasConfirmedParticipation: boolean;
}

export interface DashboardRaceTrack {
  id: string;
  name: string;
  address?: string;
}

// Interfaces para dados financeiros
export interface DashboardFinancialRegistration extends SeasonRegistration {
  paymentDetails?: {
    totalInstallments: number;
    paidInstallments: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    payments: any[];
  };
}

export interface DashboardFinancialData {
  registrations: DashboardFinancialRegistration[];
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  syncing: boolean;
}

export interface DashboardData {
  // Campeonatos organizados (onde é owner ou staff)
  championshipsOrganized: DashboardChampionship[];
  
  // Campeonatos onde participa como piloto
  championshipsParticipating: DashboardChampionshipParticipation[];
  
  // Próximas corridas
  upcomingRaces: DashboardUpcomingRace[];
  
  // Estatísticas do usuário
  userStats: UserBasicStats | null;
  
  // Kartódromos das corridas
  raceTracks: Record<string, DashboardRaceTrack>;
  
  // Dados financeiros
  financialData: DashboardFinancialData;
  
  // Estados de loading
  loading: {
    championships: boolean;
    races: boolean;
    raceTracks: boolean;
    financial: boolean;
  };
  
  // Estados de erro
  errors: {
    championships: string | null;
    races: string | null;
    raceTracks: string | null;
    financial: string | null;
  };
}

interface UserContextType extends DashboardData {
  refreshAll: () => Promise<void>;
  refreshChampionships: () => Promise<void>;
  refreshUserStats: () => Promise<void>;
  refreshRaceTracks: () => Promise<void>;
  refreshFinancial: () => Promise<void>;
  updateRaceParticipation: (stageId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Função utilitária para criar data a partir de date e time
  const createDateTime = (date: string, time: string): Date => {
    let dateStr = date;
    
    // Se a data vier com T e Z, extrair apenas a parte da data
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    return new Date(`${dateStr}T${time}`);
  };
  
  // Estados dos dados
  const [championshipsOrganized, setChampionshipsOrganized] = useState<DashboardChampionship[]>([]);
  const [championshipsParticipating, setChampionshipsParticipating] = useState<DashboardChampionshipParticipation[]>([]);
  const [upcomingRaces, setUpcomingRaces] = useState<DashboardUpcomingRace[]>([]);
  const [userStats, setUserStats] = useState<UserBasicStats | null>(null);
  const [raceTracks, setRaceTracks] = useState<Record<string, DashboardRaceTrack>>({});
  const [financialData, setFinancialData] = useState<DashboardFinancialData>({
    registrations: [],
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    syncing: false
  });
  
  // Estados de loading
  const [loading, setLoading] = useState({
    championships: false,
    races: false,
    raceTracks: false,
    financial: false,
  });
  
  // Estados de erro
  const [errors, setErrors] = useState({
    championships: null,
    races: null,
    raceTracks: null,
    financial: null,
  });

  // CHAMADA 1: Buscar dados dos campeonatos (incluindo inscrições e estatísticas)
  const fetchChampionshipsData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, championships: true }));
      setErrors(prev => ({ ...prev, championships: null }));
      
      // Buscar todos os dados em paralelo
      const [allChampionships, userRegistrations, stats] = await Promise.all([
        ChampionshipService.getMy(),
        SeasonRegistrationService.getMyRegistrations(),
        UserStatsService.getBasicStats()
      ]);
      
      // Processar campeonatos organizados
      const organized = allChampionships
        .filter(championship => championship.isOwner || championship.isStaff)
        .map(championship => ({
          id: championship.id,
          name: championship.name,
          shortDescription: championship.shortDescription,
          createdAt: championship.createdAt,
          slug: championship.slug,
          isOwner: championship.isOwner || false,
          isStaff: championship.isStaff || false,
          isPilot: championship.isPilot || false,
        }));
      
      setChampionshipsOrganized(organized);
      
      // Processar campeonatos participando
      const pilotChampionships = allChampionships.filter(championship => 
        championship.isPilot
      );

      const participations: DashboardChampionshipParticipation[] = pilotChampionships.map(championship => {
        const championshipRegistrations = userRegistrations.filter(reg => 
          reg.season?.championshipId === championship.id
        );

        const seasons = championshipRegistrations.map(reg => {
          const totalInstallments = reg.payments?.length || 1;
          const paidInstallments = reg.payments?.filter(payment => 
            ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status)
          ).length || 0;

          return {
            id: reg.season.id,
            name: reg.season.name,
            registrationStatus: reg.status,
            paymentStatus: reg.paymentStatus,
            totalInstallments,
            paidInstallments
          };
        });

        return {
          championship: {
            id: championship.id,
            name: championship.name,
            shortDescription: championship.shortDescription,
            createdAt: championship.createdAt,
            slug: championship.slug,
            isOwner: championship.isOwner || false,
            isStaff: championship.isStaff || false,
            isPilot: championship.isPilot || false,
          },
          seasons
        };
      });
      
      setChampionshipsParticipating(participations);
      setUserStats(stats);
      
    } catch (error: any) {
      console.error('Erro ao buscar dados dos campeonatos:', error);
      setErrors(prev => ({ ...prev, championships: error.message || 'Erro ao carregar dados' }));
    } finally {
      setLoading(prev => ({ ...prev, championships: false }));
    }
  }, [user]);

  // CHAMADA 2: Buscar dados das etapas (próximas corridas com participação)
  const fetchRacesData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, races: true }));
      setErrors(prev => ({ ...prev, races: null }));
      
      // Buscar campeonatos do usuário
      const allChampionships = await ChampionshipService.getMy();
      
      // Filtrar apenas campeonatos onde o usuário está participando (é piloto)
      const participatingChampionships = allChampionships.filter(championship => 
        championship.isPilot || championship.isOwner || championship.isStaff
      );
      
      // Buscar todas as temporadas e etapas em paralelo
      const championshipPromises = participatingChampionships.map(async (championship) => {
        try {
          const seasonsResult = await SeasonService.getByChampionshipId(championship.id, 1, 100);
          
          const seasonPromises = seasonsResult.data.map(async (season) => {
            try {
              const upcomingStages = await StageService.getUpcomingBySeasonId(season.id);
              
              // Para cada etapa, criar objeto básico sem participação ainda
              const basicRaces = upcomingStages.map(stage => ({
                stage,
                championship: {
                  id: championship.id,
                  name: championship.name
                },
                season: {
                  id: season.id,
                  name: season.name
                },
                isOrganizer: !!(championship.isOwner || championship.isStaff),
                availableCategories: [],
                hasConfirmedParticipation: false
              }));
              
              return basicRaces;
            } catch (error) {
              console.error(`Erro ao buscar etapas da temporada ${season.id}:`, error);
              return [];
            }
          });
          
          const allStages = await Promise.all(seasonPromises);
          return allStages.flat();
        } catch (error) {
          console.error(`Erro ao buscar temporadas do campeonato ${championship.id}:`, error);
          return [];
        }
      });
      
      const allRaces = await Promise.all(championshipPromises);
      const flatRaces = allRaces.flat();

      // Remover duplicatas e ordenar
      const uniqueRaces = flatRaces.reduce((acc: DashboardUpcomingRace[], current) => {
        const existingRace = acc.find(race => race.stage.id === current.stage.id);
        
        if (!existingRace) {
          acc.push(current);
        } else if (current.isOrganizer && !existingRace.isOrganizer) {
          existingRace.isOrganizer = true;
        }
        
        return acc;
      }, []);

      // Ordenar por data e hora (cronologicamente)
      const sortedRaces = uniqueRaces.sort((a, b) => {
        const dateA = createDateTime(a.stage.date, a.stage.time);
        const dateB = createDateTime(b.stage.date, b.stage.time);
        
        return dateA.getTime() - dateB.getTime();
      });

      // Limitar a 3 corridas mantendo ordem cronológica
      const top3Races = sortedRaces.slice(0, 3);
      
      // AGORA buscar stage participation apenas para as 3 corridas selecionadas
      const racesWithParticipation = await Promise.all(
        top3Races.map(async (race) => {
          try {
            const availableCategories = await StageParticipationService.getAvailableCategories(race.stage.id);
            const hasConfirmedParticipation = availableCategories.some(cat => cat.isConfirmed);
            
            return {
              ...race,
              availableCategories,
              hasConfirmedParticipation
            };
          } catch (error) {
            console.error(`Erro ao buscar categorias da etapa ${race.stage.id}:`, error);
            return {
              ...race,
              availableCategories: [],
              hasConfirmedParticipation: false
            };
          }
        })
      );

      setUpcomingRaces(racesWithParticipation);
    } catch (error: any) {
      console.error('Erro ao buscar dados das etapas:', error);
      setErrors(prev => ({ ...prev, races: error.message || 'Erro ao carregar próximas corridas' }));
    } finally {
      setLoading(prev => ({ ...prev, races: false }));
    }
  }, [user]);

  // CHAMADA 3: Buscar dados financeiros
  const fetchFinancialData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, financial: true }));
      setErrors(prev => ({ ...prev, financial: null }));
      setFinancialData(prev => ({ ...prev, syncing: false }));

      // Buscar todas as inscrições do usuário
      const registrations = await SeasonRegistrationService.getMyRegistrations();
      
      // Verificar se há inscrições com pagamentos pendentes
      const registrationsWithPendingPayments = [];
      for (const reg of registrations) {
        try {
          const payments = await SeasonRegistrationService.getPaymentData(reg.id);
          if (payments && payments.some(p => ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(p.status))) {
            registrationsWithPendingPayments.push(reg.id);
          }
        } catch (error) {
          console.warn(`Erro ao verificar pagamentos pendentes da inscrição ${reg.id}:`, error);
        }
      }
      
      // Se há pagamentos pendentes, mostrar indicador de sincronização
      if (registrationsWithPendingPayments.length > 0) {
        setFinancialData(prev => ({ ...prev, syncing: true }));
      }
      
      // Buscar detalhes de pagamento para cada inscrição
      const registrationsWithPayments: DashboardFinancialRegistration[] = await Promise.all(
        registrations.map(async (reg) => {
          try {
            const payments = await SeasonRegistrationService.getPaymentData(reg.id);
            
            if (payments && payments.length > 0) {
              // Verificar se há pagamentos pendentes que precisam ser sincronizados
              const pendingPaymentsToSync = payments.filter(p => 
                ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(p.status)
              );
              
              // Sincronizar pagamentos pendentes com o Asaas
              if (pendingPaymentsToSync.length > 0) {
                try {
                  await SeasonRegistrationService.syncPaymentStatus(reg.id);
                  
                  // Buscar dados atualizados após a sincronização
                  const updatedPayments = await SeasonRegistrationService.getPaymentData(reg.id);
                  if (updatedPayments) {
                    // Usar os dados atualizados
                    payments.splice(0, payments.length, ...updatedPayments);
                  }
                } catch (syncError) {
                  console.warn(`⚠️ Erro ao sincronizar pagamentos da inscrição ${reg.id}:`, syncError);
                  // Continuar com os dados originais em caso de erro
                }
              }
              
              // Status que indicam pagamento completo
              const paidStatusList = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
              
              // Status que indicam pagamento pendente
              const pendingStatusList = ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'];
              
              // Status que indicam pagamento vencido
              const overdueStatusList = ['OVERDUE'];
              
              const paidPayments = payments.filter(p => paidStatusList.includes(p.status));
              const pendingPayments = payments.filter(p => pendingStatusList.includes(p.status));
              const overduePayments = payments.filter(p => overdueStatusList.includes(p.status));
              
              const paidAmount = paidPayments.reduce((sum, p) => sum + Number(p.value), 0);
              const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.value), 0);
              const overdueAmount = overduePayments.reduce((sum, p) => sum + Number(p.value), 0);
              
              return {
                ...reg,
                paymentDetails: {
                  totalInstallments: payments.length,
                  paidInstallments: paidPayments.length,
                  paidAmount,
                  pendingAmount,
                  overdueAmount,
                  payments
                }
              };
            }
            
            // Fallback em caso de erro
            return {
              ...reg,
              paymentDetails: {
                totalInstallments: 1,
                paidInstallments: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? 1 : 0,
                paidAmount: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? Number(reg.amount) : 0,
                pendingAmount: reg.paymentStatus === 'pending' || reg.paymentStatus === 'processing' ? Number(reg.amount) : 0,
                overdueAmount: reg.paymentStatus === 'failed' || reg.paymentStatus === 'overdue' ? Number(reg.amount) : 0,
                payments: []
              }
            };
          } catch (error) {
            console.warn(`Erro ao buscar pagamentos da inscrição ${reg.id}:`, error);
            // Fallback em caso de erro
            return {
              ...reg,
              paymentDetails: {
                totalInstallments: 1,
                paidInstallments: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? 1 : 0,
                paidAmount: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? reg.amount : 0,
                pendingAmount: reg.paymentStatus === 'pending' ? reg.amount : 0,
                overdueAmount: reg.paymentStatus === 'overdue' ? reg.amount : 0,
                payments: []
              }
            };
          }
        })
      );
      
      // Calcular totais baseado nos detalhes de pagamento
      let totalPaid = 0;
      let totalPending = 0;
      let totalOverdue = 0;

      registrationsWithPayments.forEach((reg) => {
        if (reg.paymentDetails) {
          totalPaid += reg.paymentDetails.paidAmount;
          totalPending += reg.paymentDetails.pendingAmount;
          totalOverdue += reg.paymentDetails.overdueAmount;
        }
      });

      setFinancialData({
        registrations: registrationsWithPayments,
        totalPaid,
        totalPending,
        totalOverdue,
        syncing: false
      });
      
    } catch (error: any) {
      console.error('Erro ao carregar dados financeiros:', error);
      setErrors(prev => ({ ...prev, financial: error.message || 'Erro ao carregar dados financeiros' }));
    } finally {
      setLoading(prev => ({ ...prev, financial: false }));
    }
  }, [user]);

  // Função para buscar kartódromos (chamada separada apenas quando necessário)
  const fetchRaceTracks = useCallback(async () => {
    if (upcomingRaces.length === 0) return;
    
    try {
      setLoading(prev => ({ ...prev, raceTracks: true }));
      setErrors(prev => ({ ...prev, raceTracks: null }));
      
      const uniqueRaceTrackIds = [...new Set(
        upcomingRaces
          .map(race => race.stage.raceTrackId)
          .filter(Boolean)
      )];
      
      if (uniqueRaceTrackIds.length === 0) return;
      
      // Filtrar apenas kartódromos que ainda não foram carregados
      const missingRaceTrackIds = uniqueRaceTrackIds.filter(id => !raceTracks[id]);
      
      if (missingRaceTrackIds.length === 0) {
        setLoading(prev => ({ ...prev, raceTracks: false }));
        return;
      }
      
      const raceTracksData: Record<string, DashboardRaceTrack> = {};
      
      for (const raceTrackId of missingRaceTrackIds) {
        try {
          const raceTrack = await RaceTrackService.getById(raceTrackId);
          raceTracksData[raceTrackId] = {
            id: raceTrack.id,
            name: raceTrack.name,
            address: raceTrack.address,
          };
        } catch (error) {
          console.error(`Erro ao buscar kartódromo ${raceTrackId}:`, error);
        }
      }
      
      // Atualizar apenas os kartódromos que faltam
      setRaceTracks(prev => ({
        ...prev,
        ...raceTracksData
      }));
    } catch (error: any) {
      console.error('Erro ao buscar kartódromos:', error);
      setErrors(prev => ({ ...prev, raceTracks: error.message || 'Erro ao carregar kartódromos' }));
    } finally {
      setLoading(prev => ({ ...prev, raceTracks: false }));
    }
  }, [upcomingRaces, raceTracks]);

  // Funções de refresh
  const refreshChampionships = useCallback(async () => {
    await fetchChampionshipsData();
  }, [fetchChampionshipsData]);

  const refreshRaces = useCallback(async () => {
    await fetchRacesData();
  }, [fetchRacesData]);

  const refreshFinancial = useCallback(async () => {
    await fetchFinancialData();
  }, [fetchFinancialData]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchChampionshipsData(),
      fetchRacesData(),
      fetchFinancialData()
    ]);
  }, [fetchChampionshipsData, fetchRacesData, fetchFinancialData]);

  // Função para atualizar apenas a participação de uma corrida específica
  const updateRaceParticipation = useCallback(async (stageId: string) => {
    try {
      // Buscar informações atualizadas de participação para a etapa específica
      const availableCategories = await StageParticipationService.getAvailableCategories(stageId);
      const hasConfirmedParticipation = availableCategories.some(cat => cat.isConfirmed);
      
      // Atualizar apenas a corrida específica no estado
      setUpcomingRaces(prevRaces => 
        prevRaces.map(race => 
          race.stage.id === stageId 
            ? {
                ...race,
                availableCategories,
                hasConfirmedParticipation
              }
            : race
        )
      );
    } catch (error) {
      console.error(`Erro ao atualizar participação da etapa ${stageId}:`, error);
    }
  }, []);

  // Efeitos para carregar dados
  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  // Efeito para buscar kartódromos quando as corridas mudam
  useEffect(() => {
    if (upcomingRaces.length > 0) {
      // Verificar se os kartódromos já foram carregados para essas corridas
      const raceTrackIds = upcomingRaces
        .map(race => race.stage.raceTrackId)
        .filter(Boolean);
      
      const missingRaceTracks = raceTrackIds.filter(id => !raceTracks[id]);
      
      // Só buscar kartódromos se não temos todos os necessários
      if (missingRaceTracks.length > 0) {
        fetchRaceTracks();
      }
    }
  }, [upcomingRaces, fetchRaceTracks, raceTracks]);

  const contextValue: UserContextType = {
    championshipsOrganized,
    championshipsParticipating,
    upcomingRaces,
    userStats,
    raceTracks,
    financialData,
    loading,
    errors,
    refreshAll,
    refreshChampionships,
    refreshUserStats: refreshRaces, // Using refreshRaces as it includes user stats
    refreshRaceTracks: fetchRaceTracks,
    refreshFinancial,
    updateRaceParticipation,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 