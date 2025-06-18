import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormScreen } from "@/components/ui/FormScreen";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { CategoryData, CategoryService } from "@/lib/services/category.service";
import { SeasonService, Season } from "@/lib/services/season.service";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { ScoringSystemService, ScoringSystem } from "@/lib/services/scoring-system.service";
import { BatteriesConfigForm } from "@/components/category/BatteriesConfigForm";
import { GridType } from "@/lib/types/grid-type";

export const CreateCategory = () => {
  const navigate = useNavigate();
  const { championshipId, seasonId: routeSeasonId, categoryId } = useParams<{
    championshipId: string;
    seasonId?: string;
    categoryId?: string;
  }>();

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [gridTypes, setGridTypes] = useState<GridType[]>([]);
  const [scoringSystems, setScoringSystems] = useState<ScoringSystem[]>([]);

  const isEditMode = !!categoryId;

  useEffect(() => {
    const loadDependencies = async () => {
      if (!championshipId) return;
      try {
        const [seasonsData, gridTypesData, scoringSystemsData] = await Promise.all([
          SeasonService.getByChampionshipId(championshipId, 1, 1000),
          GridTypeService.getByChampionship(championshipId),
          ScoringSystemService.getByChampionshipId(championshipId),
        ]);
        
        setAllSeasons(seasonsData.data);
        setGridTypes(gridTypesData);
        setScoringSystems(scoringSystemsData);
      } catch (error) {
        console.error("Failed to load category dependencies", error);
      }
    };
    loadDependencies();
  }, [championshipId]);

  useEffect(() => {
    const prepareSeasonsForDropdown = async () => {
        let availableSeasons = allSeasons.filter(s => s.status !== 'cancelado');
        
        if (isEditMode && categoryId) {
            try {
                const categoryData = await CategoryService.getById(categoryId);
                const categorySeason = allSeasons.find(s => s.id === categoryData.seasonId);

                if (categorySeason && categorySeason.status === 'cancelado') {
                    if (!availableSeasons.some(s => s.id === categorySeason.id)) {
                        availableSeasons.push(categorySeason);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch category for season check", error);
            }
        }
        setSeasons(availableSeasons);
    };

    if (allSeasons.length > 0) {
      prepareSeasonsForDropdown();
    }
  }, [allSeasons, isEditMode, categoryId]);

  const getSeasonStatusLabel = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'em_andamento': return 'Em Andamento';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
      default: return status;
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
            options: seasons.map(season => ({
              value: season.id,
              description: `${season.name} (${getSeasonStatusLabel(season.status)})`,
            })),
          },
        ],
      },
      {
        section: "Configuração de Baterias",
        detail: "Configure as baterias, seus tipos de grid e sistemas de pontuação",
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

  const transformInitialData = useCallback((data: CategoryData) => ({
    ...data,
    ballast: data.ballast.toString(),
    maxPilots: data.maxPilots.toString(),
    minimumAge: data.minimumAge.toString(),
  }), []);
  
  const transformSubmitData = useCallback((data: any): CategoryData => {
    const selectedSeason = allSeasons.find(s => s.id === data.seasonId);
    if (selectedSeason && selectedSeason.status === 'cancelado') {
        throw new Error("Não é possível salvar a categoria em uma temporada cancelada.");
    }
    
    return {
      ...data,
      ballast: parseInt(data.ballast, 10),
      maxPilots: parseInt(data.maxPilots, 10),
      minimumAge: parseInt(data.minimumAge, 10),
      championshipId: championshipId!,
    }
  }, [championshipId, allSeasons]);

  const onSuccess = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=categories`);
  }, [navigate, championshipId]);

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=categories`);
  }, [navigate, championshipId]);

  const fetchData = useCallback(() => CategoryService.getById(categoryId!), [categoryId]);
  const createData = useCallback((data: CategoryData) => CategoryService.create(data), []);
  const updateData = useCallback((id: string, data: CategoryData) => CategoryService.update(id, data), []);

  return (
    <FormScreen
      title={isEditMode ? "Editar Categoria" : "Criar Categoria"}
      formId="category-form"
      formConfig={formConfig}
      id={categoryId}
      fetchData={isEditMode ? fetchData : undefined}
      createData={createData}
      updateData={updateData}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={{
        name: "",
        ballast: "",
        maxPilots: "",
        minimumAge: "",
        seasonId: routeSeasonId || "",
        batteriesConfig: [],
      }}
      successMessage={isEditMode ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!"}
      errorMessage={isEditMode ? "Erro ao atualizar categoria." : "Erro ao criar categoria."}
    />
  );
};

export default CreateCategory; 