import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ScoringPositionsForm } from "@/components/championship/settings/ScoringPositionsForm";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { FormScreen } from "@/components/ui/FormScreen";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { ScoringSystem } from "@/lib/services/scoring-system.service";
import { ScoringSystemService } from "@/lib/services/scoring-system.service";

export const CreateScoringSystem = () => {
  const { championshipId, scoringSystemId } = useParams<{
    championshipId: string;
    scoringSystemId?: string;
  }>();
  const navigate = useNavigate();

  // Usar o contexto de dados do campeonato
  const {
    getScoringSystems,
    addScoringSystem,
    updateScoringSystem,
    loading: contextLoading,
    error: contextError,
  } = useChampionshipData();

  const isEditing = !!scoringSystemId;

  // Configuração do formulário
  const formConfig: FormSectionConfig[] = [
    {
      section: "Configurações do Sistema",
      detail: "Configure as propriedades do sistema de pontuação",
      fields: [
        {
          id: "name",
          name: "Nome",
          type: "input",
          mandatory: true,
          max_char: 100,
          placeholder: "Ex: Fórmula 1, Kart Brasileiro",
        },
        { id: "isActive", name: "Ativo", type: "checkbox" },
        { id: "isDefault", name: "Padrão", type: "checkbox" },
      ],
    },
    {
      section: "Pontuação por Posição",
      detail: "Configure os pontos para cada posição de chegada",
      fields: [
        {
          id: "positions",
          name: "Posições",
          type: "custom",
          mandatory: true,
          customComponent: ScoringPositionsForm,
        },
      ],
    },
    {
      section: "Pontos Extras",
      detail:
        "Configure pontos adicionais para pole position e volta mais rápida",
      fields: [
        {
          id: "polePositionPoints",
          name: "Pontos para Pole Position",
          type: "input",
          mandatory: false,
          placeholder: "0",
        },
        {
          id: "fastestLapPoints",
          name: "Pontos para Volta Mais Rápida",
          type: "input",
          mandatory: false,
          placeholder: "0",
        },
      ],
    },
  ];

  // Carregar dados do sistema de pontuação se estiver editando
  const fetchScoringSystem = useCallback(
    async (id: string) => {
      try {
        // Buscar do contexto em vez do backend
        const scoringSystems = getScoringSystems();
        const foundSystem = scoringSystems.find((ss) => ss.id === id);

        if (!foundSystem) {
          throw new Error("Sistema de pontuação não encontrado");
        }

        return foundSystem;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao carregar sistema de pontuação";
        throw new Error(errorMessage);
      }
    },
    [getScoringSystems],
  );

  // Transformar dados para o formulário
  const transformInitialData = useCallback((data: ScoringSystem) => {
    return {
      name: data.name || "",
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
      positions: data.positions || [{ position: 1, points: 25 }],
      polePositionPoints: data.polePositionPoints || 0,
      fastestLapPoints: data.fastestLapPoints || 0,
    };
  }, []);

  // Transformar dados do formulário para envio
  const transformSubmitData = useCallback(
    (formData: Record<string, unknown>) => {
      return {
        name: formData.name,
        isActive: formData.isActive ?? true,
        isDefault: formData.isDefault ?? false,
        positions: formData.positions || [{ position: 1, points: 25 }],
        polePositionPoints: formData.polePositionPoints || 0,
        fastestLapPoints: formData.fastestLapPoints || 0,
      };
    },
    [],
  );

  // Criar sistema de pontuação
  const createScoringSystem = useCallback(
    async (data: any) => {
      if (!championshipId) throw new Error("ID do campeonato não encontrado");

      const newSystem = await ScoringSystemService.create(championshipId, data);
      // Adicionar o novo sistema ao contexto
      addScoringSystem(newSystem);
      return newSystem;
    },
    [championshipId, addScoringSystem],
  );

  // Atualizar sistema de pontuação
  const updateScoringSystemData = useCallback(
    async (id: string, data: any) => {
      if (!championshipId) throw new Error("ID do campeonato não encontrado");

      const updatedSystem = await ScoringSystemService.update(
        id,
        championshipId,
        data,
      );
      // Atualizar o contexto com o sistema atualizado
      updateScoringSystem(id, updatedSystem);
      return updatedSystem;
    },
    [championshipId, updateScoringSystem],
  );

  // Handlers
  const onSuccess = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=scoring-systems`);
  }, [navigate, championshipId]);

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=scoring-systems`);
  }, [navigate, championshipId]);

  // Loading state
  const isLoading = contextLoading.scoringSystems;

  if (isLoading) {
    return null; // FormScreen já trata o loading
  }

  return (
    <FormScreen
      title={
        isEditing ? "Editar Sistema de Pontuação" : "Novo Sistema de Pontuação"
      }
      description={
        isEditing
          ? "Modifique as configurações do sistema de pontuação"
          : "Configure um novo sistema de pontuação para o campeonato"
      }
      formId="scoring-system-form"
      formConfig={formConfig}
      id={scoringSystemId}
      fetchData={fetchScoringSystem}
      createData={createScoringSystem}
      updateData={updateScoringSystemData}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      successMessage={
        isEditing
          ? "Sistema de pontuação atualizado com sucesso!"
          : "Sistema de pontuação criado com sucesso!"
      }
      errorMessage={
        isEditing
          ? "Erro ao atualizar sistema de pontuação."
          : "Erro ao criar sistema de pontuação."
      }
    />
  );
};
