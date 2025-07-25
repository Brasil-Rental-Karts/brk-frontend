import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { FormScreen } from "@/components/ui/FormScreen";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { GridType, GridTypeEnum } from "@/lib/types/grid-type";

export const CreateGridType = () => {
  const { championshipId, gridTypeId } = useParams<{
    championshipId: string;
    gridTypeId?: string;
  }>();
  const navigate = useNavigate();

  // Usar o contexto de dados do campeonato
  const {
    getGridTypes,
    addGridType,
    updateGridType,
    loading: contextLoading,
    error: contextError,
  } = useChampionshipData();

  const isEditing = !!gridTypeId;

  // Configuração do formulário
  const formConfig: FormSectionConfig[] = [
    {
      section: "Configurações do Grid",
      detail: "Configure as propriedades do tipo de grid",
      fields: [
        {
          id: "name",
          name: "Nome",
          type: "input",
          mandatory: true,
          max_char: 100,
          placeholder: "Ex: Grid Principal",
        },
        {
          id: "description",
          name: "Descrição",
          type: "textarea",
          mandatory: false,
          placeholder: "Descrição opcional do tipo de grid",
          max_char: 500,
        },
        {
          id: "type",
          name: "Tipo",
          type: "select",
          mandatory: true,
          options: [
            { value: GridTypeEnum.SUPER_POLE, description: "Super Pole" },
            { value: GridTypeEnum.INVERTED, description: "Invertido" },
            {
              value: GridTypeEnum.INVERTED_PARTIAL,
              description: "Invertido + 10",
            },
            {
              value: GridTypeEnum.QUALIFYING_SESSION,
              description: "Classificação 5min",
            },
          ],
        },
        { id: "isActive", name: "Ativo", type: "checkbox" },
      ],
    },
  ];

  // Carregar dados do tipo de grid se estiver editando
  const fetchGridType = useCallback(
    async (id: string) => {
      try {
        // Buscar do contexto em vez do backend
        const gridTypes = getGridTypes();
        const foundGridType = gridTypes.find((gt) => gt.id === id);

        if (!foundGridType) {
          throw new Error("Tipo de grid não encontrado");
        }

        return foundGridType;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao carregar tipo de grid";
        throw new Error(errorMessage);
      }
    },
    [getGridTypes],
  );

  // Transformar dados para o formulário
  const transformInitialData = useCallback((data: GridType) => {
    return {
      name: data.name || "",
      description: data.description || "",
      type: data.type || GridTypeEnum.SUPER_POLE,
      isActive: data.isActive ?? true,
    };
  }, []);

  // Transformar dados do formulário para envio
  const transformSubmitData = useCallback((formData: any) => {
    return {
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      isActive: formData.isActive ?? true,
    };
  }, []);

  // Criar grid type
  const createGridType = useCallback(
    async (data: any) => {
      if (!championshipId) throw new Error("ID do campeonato não encontrado");

      const newGridType = await GridTypeService.create(championshipId, data);
      // Adicionar o novo grid type ao contexto
      addGridType(newGridType);
      return newGridType;
    },
    [championshipId, addGridType],
  );

  // Atualizar grid type
  const updateGridTypeData = useCallback(
    async (id: string, data: any) => {
      if (!championshipId) throw new Error("ID do campeonato não encontrado");

      const updatedGridType = await GridTypeService.update(
        championshipId,
        id,
        data,
      );
      // Atualizar o contexto com o grid type atualizado
      updateGridType(id, updatedGridType);
      return updatedGridType;
    },
    [championshipId, updateGridType],
  );

  // Handlers
  const onSuccess = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=config-grid`);
  }, [navigate, championshipId]);

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=config-grid`);
  }, [navigate, championshipId]);

  // Loading state
  const isLoading = contextLoading.gridTypes;

  if (isLoading) {
    return null; // FormScreen já trata o loading
  }

  return (
    <FormScreen
      title={isEditing ? "Editar Tipo de Grid" : "Novo Tipo de Grid"}
      description={
        isEditing
          ? "Modifique as configurações do tipo de grid"
          : "Configure um novo tipo de grid para o campeonato"
      }
      formId="grid-type-form"
      formConfig={formConfig}
      id={gridTypeId}
      fetchData={fetchGridType}
      createData={createGridType}
      updateData={updateGridTypeData}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      successMessage={
        isEditing
          ? "Tipo de grid atualizado com sucesso!"
          : "Tipo de grid criado com sucesso!"
      }
      errorMessage={
        isEditing
          ? "Erro ao atualizar tipo de grid."
          : "Erro ao criar tipo de grid."
      }
    />
  );
};
