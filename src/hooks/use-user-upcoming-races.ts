import { useEffect, useState } from "react";

import { ChampionshipService } from "@/lib/services/championship.service";
import { SeasonService } from "@/lib/services/season.service";
import { StageService } from "@/lib/services/stage.service";
import {
  type AvailableCategory,
  StageParticipationService,
} from "@/lib/services/stage-participation.service";
import type { Stage } from "@/lib/types/stage";

import { useUserRegistrations } from "./use-user-registrations";

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
  isOrganizer?: boolean;
  availableCategories?: AvailableCategory[];
  hasConfirmedParticipation?: boolean;
}

export const useUserUpcomingRaces = () => {
  const { registrations, loading: registrationsLoading } =
    useUserRegistrations();
  const [upcomingRaces, setUpcomingRaces] = useState<UserUpcomingRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingRaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const allRaces: UserUpcomingRace[] = [];

      // 1. Buscar corridas onde o usuário está inscrito (se houver registrations)
      if (!registrationsLoading && registrations.length > 0) {
        const racePromises = registrations
          .filter(
            (registration) =>
              registration.status === "confirmed" ||
              registration.status === "payment_pending",
          )
          .map(async (registration) => {
            try {
              const upcomingStages = await StageService.getUpcomingBySeasonId(
                registration.seasonId,
              );

              return upcomingStages.map((stage) => ({
                stage,
                championship: {
                  id: registration.season.championshipId,
                  name: "Carregando...", // Será atualizado depois
                },
                season: {
                  id: registration.season.id,
                  name: registration.season.name,
                },
                isOrganizer: false,
              }));
            } catch (error) {
              console.error(
                `Erro ao buscar etapas da temporada ${registration.seasonId}:`,
                error,
              );
              return [];
            }
          });

        const participantRaces = await Promise.all(racePromises);
        allRaces.push(...participantRaces.flat());
      }

      // 2. Buscar corridas onde o usuário é organizador (owner ou staff)
      try {
        const myChampionships = await ChampionshipService.getMy();

        for (const championship of myChampionships) {
          // Verificar se o usuário é realmente organizador (owner ou staff), não apenas piloto
          const isOrganizer = championship.isOwner || championship.isStaff;

          if (isOrganizer) {
            try {
              // Buscar todas as temporadas do campeonato (buscar todas as páginas)
              const seasonsResult = await SeasonService.getByChampionshipId(
                championship.id,
                1,
                100,
              );

              for (const season of seasonsResult.data) {
                try {
                  const upcomingStages =
                    await StageService.getUpcomingBySeasonId(season.id);

                  const organizerRaces = upcomingStages.map((stage) => ({
                    stage,
                    championship: {
                      id: championship.id,
                      name: championship.name,
                    },
                    season: {
                      id: season.id,
                      name: season.name,
                    },
                    isOrganizer: true,
                  }));

                  allRaces.push(...organizerRaces);
                } catch (error) {
                  console.error(
                    `Erro ao buscar etapas da temporada ${season.id}:`,
                    error,
                  );
                }
              }
            } catch (error) {
              console.error(
                `Erro ao buscar temporadas do campeonato ${championship.id}:`,
                error,
              );
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar campeonatos do usuário:", error);
      }

      // 3. Remover duplicatas (caso o organizador também esteja inscrito na própria corrida)
      const uniqueRaces = allRaces.reduce(
        (acc: UserUpcomingRace[], current) => {
          const existingRace = acc.find(
            (race) => race.stage.id === current.stage.id,
          );

          if (!existingRace) {
            acc.push(current);
          } else if (current.isOrganizer && !existingRace.isOrganizer) {
            // Se a corrida já existe mas a atual é de organizador, manter como organizador
            existingRace.isOrganizer = true;
          }

          return acc;
        },
        [],
      );

      // 4. Ordenar por data e hora
      const sortedRaces = uniqueRaces.sort((a, b) => {
        const dateA = new Date(`${a.stage.date}T${a.stage.time}`);
        const dateB = new Date(`${b.stage.date}T${b.stage.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // 5. Buscar informações de participação para cada corrida
      const racesWithParticipation = await Promise.all(
        sortedRaces.map(async (race) => {
          try {
            const availableCategories =
              await StageParticipationService.getAvailableCategories(
                race.stage.id,
              );
            const hasConfirmedParticipation = availableCategories.some(
              (cat) => cat.isConfirmed,
            );

            return {
              ...race,
              availableCategories,
              hasConfirmedParticipation,
            };
          } catch (error) {
            console.error(
              `Erro ao buscar categorias da etapa ${race.stage.id}:`,
              error,
            );
            return {
              ...race,
              availableCategories: [],
              hasConfirmedParticipation: false,
            };
          }
        }),
      );

      // 6. Selecionar próximas corridas garantindo diversidade de campeonatos
      const limitedRaces = (() => {
        const maxRaces = 3;
        const selectedRaces: UserUpcomingRace[] = [];
        const championshipIds = new Set<string>();

        // Primeiro, tentar pegar uma corrida de cada campeonato diferente
        for (const race of racesWithParticipation) {
          if (selectedRaces.length >= maxRaces) break;

          if (!championshipIds.has(race.championship.id)) {
            selectedRaces.push(race);
            championshipIds.add(race.championship.id);
          }
        }

        // Se ainda há espaço, preencher com as próximas corridas cronologicamente
        if (selectedRaces.length < maxRaces) {
          for (const race of racesWithParticipation) {
            if (selectedRaces.length >= maxRaces) break;

            // Verificar se já não foi selecionada
            const alreadySelected = selectedRaces.some(
              (selected) => selected.stage.id === race.stage.id,
            );
            if (!alreadySelected) {
              selectedRaces.push(race);
            }
          }
        }

        // Ordenar novamente por data para garantir ordem cronológica
        return selectedRaces.sort((a, b) => {
          const dateA = new Date(`${a.stage.date}T${a.stage.time}`);
          const dateB = new Date(`${b.stage.date}T${b.stage.time}`);
          return dateA.getTime() - dateB.getTime();
        });
      })();

      setUpcomingRaces(limitedRaces);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar próximas corridas");
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
    refresh: fetchUpcomingRaces,
  };
};
