import { useCallback, useState } from "react";

import {
  AppealPenaltyData,
  CreatePenaltyData,
  Penalty,
  PenaltyService,
  PenaltyStatus,
  PenaltyType,
  UpdatePenaltyData,
} from "../lib/services/penalty.service";

export const usePenalties = (
  addPenaltyToContext?: (penalty: Penalty) => void,
  updatePenaltyInContext?: (
    penaltyId: string,
    updatedPenalty: Partial<Penalty>,
  ) => void,
  removePenaltyFromContext?: (penaltyId: string) => void,
) => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPenalty = useCallback(
    async (data: CreatePenaltyData): Promise<Penalty | null> => {
      setLoading(true);
      setError(null);
      try {
        const penalty = await PenaltyService.createPenalty(data);

        // Atualizar estado local
        setPenalties((prev) => [penalty, ...prev]);

        // Atualizar contexto se disponível
        if (addPenaltyToContext) {
          addPenaltyToContext(penalty);
        }

        return penalty;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao criar punição";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addPenaltyToContext],
  );

  const updatePenalty = useCallback(
    async (id: string, data: UpdatePenaltyData): Promise<Penalty | null> => {
      setLoading(true);
      setError(null);
      try {
        const penalty = await PenaltyService.updatePenalty(id, data);
        // Recarregar a punição completa com as relações
        const updatedPenalty = await PenaltyService.getPenaltyById(id);

        // Atualizar estado local
        setPenalties((prev) =>
          prev.map((p) => (p.id === id ? updatedPenalty : p)),
        );

        // Atualizar contexto se disponível
        if (updatePenaltyInContext) {
          updatePenaltyInContext(id, updatedPenalty);
        }

        return updatedPenalty;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao atualizar punição";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updatePenaltyInContext],
  );

  const applyPenalty = useCallback(
    async (id: string): Promise<Penalty | null> => {
      setLoading(true);
      setError(null);
      try {
        const penalty = await PenaltyService.applyPenalty(id);
        // Recarregar a punição completa com as relações
        const updatedPenalty = await PenaltyService.getPenaltyById(id);

        // Atualizar estado local
        setPenalties((prev) =>
          prev.map((p) => (p.id === id ? updatedPenalty : p)),
        );

        // Atualizar contexto se disponível
        if (updatePenaltyInContext) {
          updatePenaltyInContext(id, updatedPenalty);
        }

        return updatedPenalty;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao aplicar punição";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updatePenaltyInContext],
  );

  const cancelPenalty = useCallback(
    async (id: string): Promise<Penalty | null> => {
      setLoading(true);
      setError(null);
      try {
        const penalty = await PenaltyService.cancelPenalty(id);
        // Recarregar a punição completa com as relações
        const updatedPenalty = await PenaltyService.getPenaltyById(id);

        // Atualizar estado local
        setPenalties((prev) =>
          prev.map((p) => (p.id === id ? updatedPenalty : p)),
        );

        // Atualizar contexto se disponível
        if (updatePenaltyInContext) {
          updatePenaltyInContext(id, updatedPenalty);
        }

        return updatedPenalty;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao cancelar punição";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updatePenaltyInContext],
  );

  const appealPenalty = useCallback(
    async (id: string, data: AppealPenaltyData): Promise<Penalty | null> => {
      setLoading(true);
      setError(null);
      try {
        const penalty = await PenaltyService.appealPenalty(id, data);
        // Recarregar a punição completa com as relações
        const updatedPenalty = await PenaltyService.getPenaltyById(id);

        // Atualizar estado local
        setPenalties((prev) =>
          prev.map((p) => (p.id === id ? updatedPenalty : p)),
        );

        // Atualizar contexto se disponível
        if (updatePenaltyInContext) {
          updatePenaltyInContext(id, updatedPenalty);
        }

        return updatedPenalty;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao recorrer punição";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updatePenaltyInContext],
  );

  const deletePenalty = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const success = await PenaltyService.deletePenalty(id);
        if (success) {
          // Atualizar estado local
          setPenalties((prev) => prev.filter((p) => p.id !== id));

          // Atualizar contexto se disponível
          if (removePenaltyFromContext) {
            removePenaltyFromContext(id);
          }
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao deletar punição";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [removePenaltyFromContext],
  );

  const fetchPenaltiesByUserId = useCallback(
    async (userId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await PenaltyService.getPenaltiesByUserId(userId);
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao buscar punições do usuário";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPenaltiesByChampionshipId = useCallback(
    async (championshipId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data =
          await PenaltyService.getPenaltiesByChampionshipId(championshipId);
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao buscar punições do campeonato";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPenaltiesBySeasonId = useCallback(
    async (seasonId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await PenaltyService.getPenaltiesBySeasonId(seasonId);
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao buscar punições da temporada";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPenaltiesByStageId = useCallback(
    async (stageId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await PenaltyService.getPenaltiesByStageId(stageId);
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao buscar punições da etapa";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPenaltiesByCategoryId = useCallback(
    async (categoryId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await PenaltyService.getPenaltiesByCategoryId(categoryId);
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao buscar punições da categoria";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchActivePenalties = useCallback(
    async (userId: string, championshipId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await PenaltyService.getActivePenalties(
          userId,
          championshipId,
        );
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar punições ativas";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPendingPenalties = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await PenaltyService.getPendingPenalties();
      setPenalties(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro ao buscar punições pendentes";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPenaltiesByType = useCallback(
    async (type: PenaltyType): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await PenaltyService.getPenaltiesByType(type);
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao buscar punições por tipo";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPenaltiesByStatus = useCallback(
    async (status: PenaltyStatus): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await PenaltyService.getPenaltiesByStatus(status);
        setPenalties(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao buscar punições por status";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPenalties = useCallback(() => {
    setPenalties([]);
  }, []);

  return {
    penalties,
    loading,
    error,
    createPenalty,
    updatePenalty,
    applyPenalty,
    cancelPenalty,
    appealPenalty,
    deletePenalty,
    fetchPenaltiesByUserId,
    fetchPenaltiesByChampionshipId,
    fetchPenaltiesBySeasonId,
    fetchPenaltiesByStageId,
    fetchPenaltiesByCategoryId,
    fetchActivePenalties,
    fetchPendingPenalties,
    fetchPenaltiesByType,
    fetchPenaltiesByStatus,
    clearError,
    clearPenalties,
  };
};
