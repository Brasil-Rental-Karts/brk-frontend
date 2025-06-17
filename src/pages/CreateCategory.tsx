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
          ScoringSystemService.getByChampionship(championshipId),
        ]);
        
        const activeSeasons = seasonsData.data.filter(season => 
          season.status === 'agendado' || season.status === 'em_andamento'
        );
        setSeasons(activeSeasons);
        setGridTypes(gridTypesData);
        setScoringSystems(scoringSystemsData);
      } catch (error) {
        console.error("Failed to load category dependencies", error);
      }
    };
    loadDependencies();
  }, [championshipId]);

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
            name: "Lastro",
            type: "input",
            mandatory: true,
            placeholder: "Ex: 75Kg",
            max_char: 10,
          },
          {
            id: "maxPilots",
            name: "Máximo de pilotos",
            type: "input",
            mandatory: true,
            placeholder: "Ex: 20",
          },
          {
            id: "minimumAge",
            name: "Idade mínima",
            type: "input",
            mandatory: true,
            placeholder: "Ex: 18",
          },
          {
            id: "seasonId",
            name: "Temporada",
            type: "select",
            mandatory: true,
            options: seasons.map(season => ({
              value: season.id,
              description: `${season.name} (${season.status === 'agendado' ? 'Agendado' : 'Em Andamento'})`,
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
    maxPilots: data.maxPilots.toString(),
    minimumAge: data.minimumAge.toString(),
  }), []);
  
  const transformSubmitData = useCallback((data: any): CategoryData => ({
    ...data,
    maxPilots: parseInt(data.maxPilots, 10),
    minimumAge: parseInt(data.minimumAge, 10),
    championshipId: championshipId!,
  }), [championshipId]);

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