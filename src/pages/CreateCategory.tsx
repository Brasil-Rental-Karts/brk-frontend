import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { BatteriesConfigForm } from "@/components/category/BatteriesConfigForm";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { FormScreen } from "@/components/ui/FormScreen";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { CategoryData, CategoryService } from "@/lib/services/category.service";
import { ScoringSystem } from "@/lib/services/scoring-system.service";
import { Season } from "@/lib/services/season.service";
import { GridType } from "@/lib/types/grid-type";

export const CreateCategory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { championshipId, categoryId } = useParams<{
    championshipId: string;
    categoryId?: string;
  }>();

  // Usar o contexto de dados do campeonato
  const {
    getSeasons,
    getCategories,
    getGridTypes,
    getScoringSystems,
    addCategory,
    updateCategory,
  } = useChampionshipData();

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [gridTypes, setGridTypes] = useState<GridType[]>([]);
  const [scoringSystems, setScoringSystems] = useState<ScoringSystem[]>([]);
  const duplicatedData = location.state?.initialData;

  const isEditMode = categoryId !== "new";
  const currentCategoryId = isEditMode ? categoryId : undefined;

  useEffect(() => {
    const loadDependencies = async () => {
      if (!championshipId) return;
      try {
        // Usar dados do contexto em vez de buscar do backend
        const seasonsData = getSeasons();
        const filteredSeasons = seasonsData.filter(
          (season) => season.championshipId === championshipId,
        );
        const gridTypesData = getGridTypes();
        const scoringSystemsData = getScoringSystems();

        setAllSeasons(filteredSeasons);
        setGridTypes(gridTypesData);
        setScoringSystems(scoringSystemsData);
      } catch (error) {
        console.error("Failed to load category dependencies", error);
      }
    };
    loadDependencies();
  }, [championshipId, getSeasons, getGridTypes, getScoringSystems]);

  useEffect(() => {
    const prepareSeasonsForDropdown = () => {
      const availableSeasons = allSeasons.filter(
        (s) => s.status !== "cancelado",
      );

      if (isEditMode && categoryId) {
        // Buscar categoria do contexto
        const categoriesFromContext = getCategories();
        const categoryData = categoriesFromContext.find(
          (cat: any) => cat.id === categoryId,
        );

        if (categoryData) {
          const categorySeason = allSeasons.find(
            (s) => s.id === categoryData.seasonId,
          );

          if (categorySeason && categorySeason.status === "cancelado") {
            if (!availableSeasons.some((s) => s.id === categorySeason.id)) {
              availableSeasons.push(categorySeason);
            }
          }
        }
      }
      setSeasons(availableSeasons);
    };

    if (allSeasons.length > 0) {
      prepareSeasonsForDropdown();
    }
  }, [allSeasons, isEditMode, categoryId, getCategories]);

  const getSeasonStatusLabel = (status: string) => {
    switch (status) {
      case "agendado":
        return "Agendado";
      case "em_andamento":
        return "Em Andamento";
      case "finalizado":
        return "Finalizado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  useEffect(() => {
    const config: FormSectionConfig[] = [
      {
        section: "Dados da Categoria",
        detail: "Informações gerais da categoria",
        fields: [
          {
            id: "name",
            name: "Nome da categoria",
            type: "input",
            mandatory: true,
            max_char: 75,
            placeholder: "Ex: Categoria A",
          },
          {
            id: "ballast",
            name: "Lastro (Kg)",
            type: "inputMask",
            mask: "number",
            mandatory: true,
            placeholder: "Ex: 75",
            min_value: 0,
            max_value: 999,
          },
          {
            id: "maxPilots",
            name: "Máximo de pilotos",
            type: "inputMask",
            mask: "number",
            mandatory: true,
            placeholder: "Ex: 20",
            min_value: 0,
            max_value: 999,
          },
          {
            id: "minimumAge",
            name: "Idade mínima",
            type: "inputMask",
            mask: "number",
            mandatory: true,
            placeholder: "Ex: 18",
            min_value: 0,
            max_value: 999,
          },
          {
            id: "seasonId",
            name: "Temporada",
            type: "select",
            mandatory: true,
            options: seasons.map((season) => ({
              value: season.id,
              description: `${season.name} (${getSeasonStatusLabel(season.status)})`,
            })),
          },
        ],
      },
      {
        section: "Configuração de Baterias",
        detail:
          "Configure as baterias, seus tipos de grid e sistemas de pontuação",
        fields: [
          {
            id: "batteriesConfig",
            name: "Baterias",
            type: "custom",
            customComponent: BatteriesConfigForm,
            customComponentProps: {
              gridTypes,
              scoringSystems,
            },
          },
        ],
      },
    ];
    setFormConfig(config);
  }, [seasons, gridTypes, scoringSystems]);

  const transformInitialData = useCallback(
    (data: any) => ({
      ...data,
      ballast: data.ballast.toString(),
      maxPilots: data.maxPilots.toString(),
      minimumAge: data.minimumAge.toString(),
    }),
    [],
  );

  const transformSubmitData = useCallback(
    (data: any): CategoryData => {
      const selectedSeason = allSeasons.find((s) => s.id === data.seasonId);
      if (selectedSeason && selectedSeason.status === "cancelado") {
        throw new Error(
          "Não é possível salvar a categoria em uma temporada cancelada.",
        );
      }

      return {
        ...data,
        ballast: parseInt(data.ballast, 10),
        maxPilots: parseInt(data.maxPilots, 10),
        minimumAge: parseInt(data.minimumAge, 10),
        championshipId: championshipId!,
      };
    },
    [championshipId, allSeasons],
  );

  const onSuccess = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=categories`);
  }, [navigate, championshipId]);

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=categories`);
  }, [navigate, championshipId]);

  const fetchData = useCallback(async () => {
    if (!currentCategoryId) {
      throw new Error("ID da categoria não fornecido");
    }

    // Sempre buscar do contexto, nunca do backend
    const categoriesFromContext = getCategories();
    const categoryFromContext = categoriesFromContext.find(
      (cat: any) => cat.id === currentCategoryId,
    );

    if (categoryFromContext) {
      return categoryFromContext;
    } else {
      throw new Error(
        "Categoria não encontrada no contexto. Recarregue a página.",
      );
    }
  }, [currentCategoryId, getCategories]);

  // Preparar dados iniciais do contexto quando disponíveis
  const getInitialDataFromContext = useCallback(() => {
    if (!currentCategoryId) return null;

    const categoriesFromContext = getCategories();
    const categoryFromContext = categoriesFromContext.find(
      (cat: any) => cat.id === currentCategoryId,
    );

    if (categoryFromContext) {
      return transformInitialData(categoryFromContext);
    }

    return null;
  }, [currentCategoryId, getCategories, transformInitialData]);

  const createData = useCallback(
    async (data: CategoryData) => {
      const createdCategory = await CategoryService.create(data);
      // Atualizar o contexto com a nova categoria
      addCategory(createdCategory);
      return createdCategory;
    },
    [addCategory],
  );

  const updateData = useCallback(
    async (id: string, data: CategoryData) => {
      const updatedCategory = await CategoryService.update(id, data);
      // Atualizar o contexto com a categoria atualizada
      updateCategory(id, updatedCategory);
      return updatedCategory;
    },
    [updateCategory],
  );

  return (
    <FormScreen
      title={isEditMode ? "Editar Categoria" : "Criar Categoria"}
      formId="category-form"
      formConfig={formConfig}
      id={currentCategoryId}
      fetchData={isEditMode ? fetchData : undefined}
      createData={createData}
      updateData={updateData}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={
        duplicatedData
          ? transformInitialData(duplicatedData)
          : getInitialDataFromContext() || {
              name: "",
              ballast: "",
              maxPilots: "",
              minimumAge: "",
              seasonId: "",
              batteriesConfig: [],
            }
      }
      successMessage={
        isEditMode
          ? "Categoria atualizada com sucesso!"
          : "Categoria criada com sucesso!"
      }
      errorMessage={
        isEditMode ? "Erro ao atualizar categoria." : "Erro ao criar categoria."
      }
    />
  );
};

export default CreateCategory;
