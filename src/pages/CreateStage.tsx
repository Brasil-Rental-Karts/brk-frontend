import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Card, CardContent, CardHeader, CardTitle } from "brk-design-system";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "brk-design-system";
import { Alert, AlertTitle, AlertDescription } from "brk-design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import { StageService, CreateStageData, Stage } from "@/lib/services/stage.service";
import { SeasonService } from "@/lib/services/season.service";
import { CategoryService, Category } from "@/lib/services/category.service";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { InputMask } from "@/components/ui/input-mask";
import { FormScreen } from "@/components/ui/FormScreen";
import { FormSectionConfig } from "@/components/ui/dynamic-form";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused = {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertTitle,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PageHeader,
  Skeleton,
  Checkbox,
  InputMask,
};

const formatDateToISO = (date?: string) => {
  if (!date) return undefined;
  const parts = date.split('/');
  if (parts.length !== 3) return undefined;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // month is 0-indexed in JS Date
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
  return new Date(Date.UTC(year, month, day)).toISOString();
};

const formatISOToDate = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const STAGE_INITIAL_VALUES = {
  name: "",
  date: "",
  time: "",
  kartodrome: "",
  kartodromeAddress: "",
  streamLink: "",
  seasonId: "",
  categoryIds: [] as string[],
  doublePoints: false,
  briefing: "",
  briefingTime: "",
};

export const CreateStage = () => {
  const navigate = useNavigate();
  const { championshipId, stageId } = useParams<{ 
    championshipId: string; 
    stageId?: string; 
  }>();
  const location = useLocation();

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [initialValues, setInitialValues] = useState<Record<string, any> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [allSeasons, setAllSeasons] = useState<any[]>([]);

  const isEditMode = !!stageId;

  const loadCategoriesForSeason = useCallback(async (seasonId: string) => {
    let categories: Category[] = [];
    if (seasonId) {
      try {
        categories = await CategoryService.getBySeasonId(seasonId);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    }
    setFormConfig(prevConfig => {
      const newConfig = prevConfig.map(section => {
        if (section.section === "Temporada e Categorias") {
          return {
            ...section,
            fields: section.fields.map(field => {
              if (field.id === 'categoryIds') {
                return { ...field, options: categories.map(c => ({ value: c.id, description: c.name })) };
              }
              return field;
            })
          };
        }
        return section;
      });
      // Deep copy to ensure re-render
      return newConfig;
    });
  }, []);

  useEffect(() => {
    const baseConfig: FormSectionConfig[] = [
      {
        section: "Informações Básicas",
        detail: "Detalhes principais da etapa",
        fields: [
          { id: "name", name: "Nome da etapa", type: "input", mandatory: true, max_char: 75, placeholder: "Ex: Etapa 1 - Interlagos" },
          { id: "date", name: "Data", type: "inputMask", mask: "date", mandatory: true, placeholder: "DD/MM/AAAA" },
          { id: "time", name: "Hora", type: "inputMask", mask: "time", mandatory: true, placeholder: "HH:MM" },
          { id: "kartodrome", name: "Kartódromo", type: "input", mandatory: true, max_char: 100 },
          { id: "kartodromeAddress", name: "Endereço do Kartódromo", type: "input", mandatory: true, max_char: 200 },
          { id: "streamLink", name: "Link da transmissão", type: "input", placeholder: "https://..." },
        ],
      },
      {
        section: "Temporada e Categorias",
        detail: "Associe a etapa a uma temporada e suas categorias",
        fields: [
          { id: "seasonId", name: "Temporada", type: "select", mandatory: true, options: [] },
          { id: "categoryIds", name: "Categorias da temporada", type: "checkbox-group", mandatory: true, options: [], conditionalField: { dependsOn: 'seasonId', showWhen: (value: string) => !!value } },
        ],
      },
      {
        section: "Briefing e Configurações",
        detail: "Informações adicionais e regras da etapa",
        fields: [
          { id: "briefingTime", name: "Horário do Briefing", type: "inputMask", mask: "time", placeholder: "HH:MM" },
          { id: "briefing", name: "Briefing", type: "textarea", placeholder: "Instruções e informações para os pilotos", max_char: 2000 },
          { id: "doublePoints", name: "Pontuação em dobro", type: "checkbox" },
        ],
      },
    ];

    const loadDataAndConfig = async () => {
      setIsLoading(true);
      try {
        const seasonsData = await SeasonService.getByChampionshipId(championshipId!, 1, 1000);
        setAllSeasons(seasonsData.data);
        let activeSeasons = seasonsData.data.filter(s => s.status !== 'cancelado');
        
        let categoryOptions: { value: string; description: string }[] = [];
        let stageDataToSet: Record<string, any> = STAGE_INITIAL_VALUES;

        const duplicatedData = location.state?.initialData;

        if (isEditMode) {
          const stageData = await StageService.getById(stageId!);
          stageDataToSet = {
            ...STAGE_INITIAL_VALUES,
            ...stageData,
            date: formatISOToDate(stageData.date),
          };

          if (stageData.seasonId) {
            const categories = await CategoryService.getBySeasonId(stageData.seasonId);
            categoryOptions = categories.map(c => ({ value: c.id, description: c.name }));

            const stageSeason = seasonsData.data.find(s => s.id === stageData.seasonId);
            if (stageSeason && stageSeason.status === 'cancelado' && !activeSeasons.some(s => s.id === stageSeason.id)) {
              activeSeasons.push(stageSeason);
            }
          }
        } else if (duplicatedData) {
          stageDataToSet = {
            ...STAGE_INITIAL_VALUES,
            ...duplicatedData,
            date: formatISOToDate(duplicatedData.date),
          };

          if (duplicatedData.seasonId) {
            const categories = await CategoryService.getBySeasonId(duplicatedData.seasonId);
            categoryOptions = categories.map(c => ({ value: c.id, description: c.name }));
          }
        }
        
        const seasonOptions = activeSeasons.map(s => ({ value: s.id, description: s.name }));
        setInitialValues(stageDataToSet);

        const newConfig = baseConfig.map(section => {
          if (section.section === "Temporada e Categorias") {
            return {
              ...section,
              fields: section.fields.map(field => {
                if (field.id === 'seasonId') {
                  return { ...field, options: seasonOptions };
                }
                if (field.id === 'categoryIds') {
                  // For edit mode, we preload the options
                  return { ...field, options: categoryOptions };
                }
                return field;
              })
            };
          }
          return section;
        });
        
        setFormConfig(newConfig);
      } catch (error) {
        console.error("Failed to load initial data for stage form", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataAndConfig();
  }, [championshipId, isEditMode, stageId, loadCategoriesForSeason, location.state?.initialData]);
  
  const transformSubmitData = useCallback((data: any): CreateStageData => {
    const selectedSeason = allSeasons.find(s => s.id === data.seasonId);
    if (selectedSeason && selectedSeason.status === 'cancelado') {
        throw new Error("Não é possível salvar a etapa em uma temporada cancelada.");
    }

    const transformedData = { ...data };
    if (transformedData.briefingTime === '') {
      transformedData.briefingTime = null;
    }
    if (transformedData.streamLink === '') {
      transformedData.streamLink = null;
    }

    return {
      ...transformedData,
      date: formatDateToISO(data.date)!,
      championshipId: championshipId!,
    }
  }, [championshipId, allSeasons]);
  
  // Event handlers
  const onFieldChange = useCallback(async (fieldId: string, value: any, _formData: any, formActions: { setValue: (name: string, value: any) => void }) => {
    if (fieldId === 'seasonId') {
      if (formActions.setValue) {
        formActions.setValue('categoryIds', []);
      }
      await loadCategoriesForSeason(value);
    }
  }, [loadCategoriesForSeason]);

  const onSuccess = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=etapas`);
  }, [navigate, championshipId]);

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=etapas`);
  }, [navigate, championshipId]);

  if (isLoading || !initialValues) {
    return (
      <div className="p-6">
        <PageHeader title={isEditMode ? "Editar Etapa" : "Criar Etapa"} />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FormScreen
      title={isEditMode ? "Editar Etapa" : "Criar Etapa"}
      formId="stage-form"
      formConfig={formConfig}
      id={stageId}
      createData={StageService.create}
      updateData={StageService.update}
      onFieldChange={onFieldChange}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={initialValues}
      successMessage={isEditMode ? "Etapa atualizada com sucesso!" : "Etapa criada com sucesso!"}
      errorMessage={isEditMode ? "Erro ao atualizar etapa." : "Erro ao criar etapa."}
    />
  );
};

export default CreateStage; 