import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";


import { ChampionshipService } from "@/lib/services/championship.service";
import { RaceTrackService } from "@/lib/services/race-track.service";
import { SeasonService } from "@/lib/services/season.service";
import {
  type SeasonRegistration,
  SeasonRegistrationService,
} from "@/lib/services/season-registration.service";
import { StageService } from "@/lib/services/stage.service";
import {
  type AvailableCategory,
  StageParticipationService,
} from "@/lib/services/stage-participation.service";
import {
  type UserBasicStats,
  UserStatsService,
} from "@/lib/services/user-stats.service";
import type { Stage } from "@/lib/types/stage";

import { useAuth } from "./AuthContext";

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
    if (dateStr.includes("T")) {
      dateStr = dateStr.split("T")[0];
    }

    return new Date(`${dateStr}T${time}`);
  };

  // Estados dos dados
  const [championshipsOrganized, setChampionshipsOrganized] = useState<
    DashboardChampionship[]
  >([]);
  const [championshipsParticipating, setChampionshipsParticipating] = useState<
    DashboardChampionshipParticipation[]
  >([]);
  const [upcomingRaces, setUpcomingRaces] = useState<DashboardUpcomingRace[]>(
    [],
  );
  const [userStats, setUserStats] = useState<UserBasicStats | null>(null);
  const [raceTracks, setRaceTracks] = useState<
    Record<string, DashboardRaceTrack>
  >({});
  const [financialData, setFinancialData] = useState<DashboardFinancialData>({
    registrations: [],
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    syncing: false,
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
      setLoading((prev) => ({ ...prev, championships: true }));
      setErrors((prev) => ({ ...prev, championships: null }));

      const [champsRes, regsRes, statsRes] = await Promise.allSettled([
        ChampionshipService.getMy(),
        SeasonRegistrationService.getMyRegistrations(),
        UserStatsService.getBasicStats(),
      ]);

      const allChampionships =
        champsRes.status === "fulfilled" ? champsRes.value : [];
      const userRegistrations =
        regsRes.status === "fulfilled" ? regsRes.value : [];
      const stats = statsRes.status === "fulfilled" ? statsRes.value : null;

      if (champsRes.status === "rejected") {
        console.warn("Falha ao carregar campeonatos:", champsRes.reason);
      }
      if (regsRes.status === "rejected") {
        console.warn("Falha ao carregar inscrições:", regsRes.reason);
      }
      if (statsRes.status === "rejected") {
        console.warn("Falha ao carregar estatísticas:", statsRes.reason);
      }

      const organized = allChampionships
        .filter((championship: any) => championship.isOwner || championship.isStaff)
        .map((championship: any) => ({
          id: championship.id,
          name: championship.name,
          shortDescription: championship.shortDescription,
          createdAt: championship.createdAt,
          slug: championship.slug,
          isOwner: championship.isOwner || false,
          isStaff: championship.isStaff || false,
          isPilot: championship.isPilot || false,
          championshipImage: championship.championshipImage,
        }));

      setChampionshipsOrganized(organized);

      const pilotChampionships = allChampionships.filter(
        (championship: any) => championship.isPilot,
      );

      const participations: DashboardChampionshipParticipation[] =
        pilotChampionships.map((championship: any) => {
          const championshipRegistrations = userRegistrations.filter(
            (reg: any) => reg.season?.championshipId === championship.id,
          );

          const seasons = championshipRegistrations.map((reg: any) => {
            const totalInstallments = reg.payments?.length || 1;
            const paidInstallments =
              reg.payments?.filter((payment: any) =>
                ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(
                  payment.status,
                ),
              ).length || 0;

            return {
              id: reg.season.id,
              name: reg.season.name,
              registrationStatus: reg.status,
              paymentStatus: reg.paymentStatus,
              totalInstallments,
              paidInstallments,
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
              championshipImage: championship.championshipImage,
            },
            seasons,
          };
        });

      setChampionshipsParticipating(participations);
      setUserStats(stats);
    } catch (error: any) {
      console.error("Erro ao buscar dados dos campeonatos:", error);
      setErrors((prev) => ({
        ...prev,
        championships: error.message || "Erro ao carregar dados",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, championships: false }));
    }
  }, [user]);

  // CHAMADA 2: Buscar dados das etapas (próximas corridas com participação)
  const fetchRacesData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading((prev) => ({ ...prev, races: true }));
      setErrors((prev) => ({ ...prev, races: null }));

      const allChampionships = await ChampionshipService.getMy();

      const participatingChampionships = allChampionships.filter(
        (championship: any) =>
          championship.isPilot || championship.isOwner || championship.isStaff,
      );

      // Buscar temporadas para todos os campeonatos em paralelo
      const seasonsResults = await Promise.allSettled(
        participatingChampionships.map((championship: any) =>
          SeasonService.getByChampionshipId(championship.id, 1, 100)
        )
      );

      const seasonsWithChampionship: Array<{ season: any; championship: any }> = [];
      seasonsResults.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          const championship = participatingChampionships[idx];
          const seasons = res.value?.data || [];
          seasons.forEach((season: any) =>
            seasonsWithChampionship.push({ season, championship })
          );
        } else {
          console.warn(
            `Falha ao carregar temporadas do campeonato ${participatingChampionships[idx]?.id}:`,
            res.reason
          );
        }
      });

      // Buscar etapas futuras para todas as temporadas em paralelo
      const stagesResults = await Promise.allSettled(
        seasonsWithChampionship.map(({ season }) =>
          StageService.getUpcomingBySeasonId(season.id)
        )
      );

      const allRaces: DashboardUpcomingRace[] = [];
      stagesResults.forEach((res, idx) => {
        const { season, championship } = seasonsWithChampionship[idx];
        if (res.status === "fulfilled") {
          const upcomingStages = res.value || [];
          const basicRaces = upcomingStages.map((stage: any) => ({
            stage,
            championship: {
              id: championship.id,
              name: championship.name,
            },
            season: {
              id: season.id,
              name: season.name,
            },
            isOrganizer: !!(championship.isOwner || championship.isStaff),
            availableCategories: [],
            hasConfirmedParticipation: false,
          }));
          allRaces.push(...basicRaces);
        } else {
          console.warn(
            `Falha ao carregar etapas da temporada ${season?.id}:`,
            res.reason
          );
        }
      });

      // Remover duplicatas e ordenar
      const uniqueRaces = allRaces.reduce(
        (acc: DashboardUpcomingRace[], current) => {
          const existingRace = acc.find(
            (race) => race.stage.id === current.stage.id,
          );
          if (!existingRace) {
            acc.push(current);
          } else if (current.isOrganizer && !existingRace.isOrganizer) {
            existingRace.isOrganizer = true;
          }
          return acc;
        },
        [],
      );

      const sortedRaces = uniqueRaces.sort((a, b) => {
        const dateA = createDateTime(a.stage.date, a.stage.time);
        const dateB = createDateTime(b.stage.date, b.stage.time);
        return dateA.getTime() - dateB.getTime();
      });

      // Buscar categorias disponíveis em paralelo
      const categoriesResults = await Promise.allSettled(
        sortedRaces.map((race) =>
          StageParticipationService.getAvailableCategories(race.stage.id)
        )
      );

      const racesWithParticipation: DashboardUpcomingRace[] = sortedRaces.map(
        (race, idx) => {
          const res = categoriesResults[idx];
          if (res.status === "fulfilled") {
            const availableCategories = res.value || [];
            const hasConfirmedParticipation = availableCategories.some(
              (cat: any) => cat.isConfirmed,
            );
            return {
              ...race,
              availableCategories,
              hasConfirmedParticipation,
            };
          }
          console.warn(
            `Falha ao carregar categorias da etapa ${race.stage.id}:`,
            (res as any).reason
          );
          return {
            ...race,
            availableCategories: [],
            hasConfirmedParticipation: false,
          };
        }
      );

      setUpcomingRaces(racesWithParticipation);
    } catch (error: any) {
      console.error("Erro ao buscar dados das etapas:", error);
      setErrors((prev) => ({
        ...prev,
        races: error.message || "Erro ao carregar próximas corridas",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, races: false }));
    }
  }, [user]);

  // CHAMADA 3: Buscar dados financeiros
  const fetchFinancialData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading((prev) => ({ ...prev, financial: true }));
      setErrors((prev) => ({ ...prev, financial: null }));
      setFinancialData((prev) => ({ ...prev, syncing: false }));

      const registrations = await SeasonRegistrationService.getMyRegistrations();

      const paymentsResults = await Promise.allSettled(
        registrations.map((reg: any) =>
          SeasonRegistrationService.getPaymentData(reg.id)
        )
      );

      const registrationsWithPayments: DashboardFinancialRegistration[] = registrations.map(
        (reg: any, idx: number) => {
          const res = paymentsResults[idx];
          if (res.status === "fulfilled" && Array.isArray(res.value) && res.value.length > 0) {
            const payments = res.value;

            const paidStatusList = [
              "RECEIVED",
              "CONFIRMED",
              "RECEIVED_IN_CASH",
            ];
            const pendingStatusList = [
              "PENDING",
              "AWAITING_PAYMENT",
              "AWAITING_RISK_ANALYSIS",
            ];
            const overdueStatusList = ["OVERDUE"];

            const paidPayments = payments.filter((p: any) =>
              paidStatusList.includes(p.status),
            );
            const pendingPayments = payments.filter((p: any) =>
              pendingStatusList.includes(p.status),
            );
            const overduePayments = payments.filter((p: any) =>
              overdueStatusList.includes(p.status),
            );

            const paidAmount = paidPayments.reduce(
              (sum: number, p: any) => sum + Number(p.value),
              0,
            );
            const pendingAmount = pendingPayments.reduce(
              (sum: number, p: any) => sum + Number(p.value),
              0,
            );
            const overdueAmount = overduePayments.reduce(
              (sum: number, p: any) => sum + Number(p.value),
              0,
            );

            return {
              ...reg,
              paymentDetails: {
                totalInstallments: payments.length,
                paidInstallments: paidPayments.length,
                paidAmount,
                pendingAmount,
                overdueAmount,
                payments,
              },
            };
          }
          if (res.status === "rejected") {
            console.warn(`Falha ao carregar pagamentos da inscrição ${reg.id}:`, res.reason);
          }
          return {
            ...reg,
            paymentDetails: {
              totalInstallments: 1,
              paidInstallments: [
                "paid",
                "exempt",
                "direct_payment",
              ].includes(reg.paymentStatus)
                ? 1
                : 0,
              paidAmount: ["paid", "exempt", "direct_payment"].includes(
                reg.paymentStatus,
              )
                ? Number(reg.amount)
                : 0,
              pendingAmount:
                reg.paymentStatus === "pending" ||
                reg.paymentStatus === "processing"
                  ? Number(reg.amount)
                  : 0,
              overdueAmount:
                reg.paymentStatus === "failed" ||
                reg.paymentStatus === "overdue"
                  ? Number(reg.amount)
                  : 0,
              payments: [],
            },
          };
        }
      );

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
        syncing: false,
      });
    } catch (error: any) {
      console.error("Erro ao carregar dados financeiros:", error);
      setErrors((prev) => ({
        ...prev,
        financial: error.message || "Erro ao carregar dados financeiros",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, financial: false }));
    }
  }, [user]);

  // Função para buscar kartódromos (chamada separada apenas quando necessário)
  const fetchRaceTracks = useCallback(async () => {
    if (upcomingRaces.length === 0) return;

    try {
      setLoading((prev) => ({ ...prev, raceTracks: true }));
      setErrors((prev) => ({ ...prev, raceTracks: null }));

      const uniqueRaceTrackIds = [
        ...new Set(
          upcomingRaces.map((race) => race.stage.raceTrackId).filter(Boolean),
        ),
      ];

      if (uniqueRaceTrackIds.length === 0) return;

      // Filtrar apenas kartódromos que ainda não foram carregados
      const missingRaceTrackIds = uniqueRaceTrackIds.filter(
        (id) => !raceTracks[id],
      );

      if (missingRaceTrackIds.length === 0) {
        setLoading((prev) => ({ ...prev, raceTracks: false }));
        return;
      }

      const raceTracksData: Record<string, DashboardRaceTrack> = {};

      const raceTracksResults = await Promise.allSettled(
        missingRaceTrackIds.map((id) => RaceTrackService.getById(id))
      );
      raceTracksResults.forEach((res, idx) => {
        const id = missingRaceTrackIds[idx];
        if (res.status === "fulfilled") {
          const raceTrack = res.value;
          raceTracksData[id] = {
            id: raceTrack.id,
            name: raceTrack.name,
            address: raceTrack.address,
          };
        } else {
          console.warn(`Falha ao buscar kartódromo ${id}:`, res.reason);
        }
      });

      // Atualizar apenas os kartódromos que faltam
      setRaceTracks((prev) => ({
        ...prev,
        ...raceTracksData,
      }));
    } catch (error: any) {
      console.error("Erro ao buscar kartódromos:", error);
      setErrors((prev) => ({
        ...prev,
        raceTracks: error.message || "Erro ao carregar kartódromos",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, raceTracks: false }));
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
      fetchFinancialData(),
    ]);
  }, [fetchChampionshipsData, fetchRacesData, fetchFinancialData]);

  // Função para atualizar apenas a participação de uma corrida específica
  const updateRaceParticipation = useCallback(async (stageId: string) => {
    try {
      // Buscar informações atualizadas de participação para a etapa específica
      const availableCategories =
        await StageParticipationService.getAvailableCategories(stageId);
      const hasConfirmedParticipation = availableCategories.some(
        (cat) => cat.isConfirmed,
      );

      // Atualizar apenas a corrida específica no estado
      setUpcomingRaces((prevRaces) =>
        prevRaces.map((race) =>
          race.stage.id === stageId
            ? {
                ...race,
                availableCategories,
                hasConfirmedParticipation,
              }
            : race,
        ),
      );
    } catch (error) {
      console.error(
        `Erro ao atualizar participação da etapa ${stageId}:`,
        error,
      );
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
        .map((race) => race.stage.raceTrackId)
        .filter(Boolean);

      const missingRaceTracks = raceTrackIds.filter((id) => !raceTracks[id]);

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
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
