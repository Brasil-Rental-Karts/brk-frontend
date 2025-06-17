import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const formatISOToDate = (iso?: string) => {
  if (!iso) return "";
  const parts = iso.split('T')[0].split('-');
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [initialValues, setInitialValues] = useState<Record<string, any> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

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
      return JSON.parse(JSON.stringify(newConfig));
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
        const activeSeasons = seasonsData.data.filter(s => s.status === 'agendado' || s.status === 'em_andamento');
        
        const seasonOptions = activeSeasons.map(s => ({ value: s.id, description: s.name }));
        const seasonField = baseConfig.find(s => s.section === 'Temporada e Categorias')?.fields.find(f => f.id === 'seasonId');
        if (seasonField) {
          seasonField.options = seasonOptions;
        }

        if (isEditMode) {
          const stageData = await StageService.getById(stageId!);
          if (stageData.seasonId) {
            const categories = await CategoryService.getBySeasonId(stageData.seasonId);
            const categoryOptions = categories.map(c => ({ value: c.id, description: c.name }));
            const categoryField = baseConfig.find(s => s.section === 'Temporada e Categorias')?.fields.find(f => f.id === 'categoryIds');
            if (categoryField) {
              categoryField.options = categoryOptions;
            }
          }
          setInitialValues({
            ...stageData,
            date: formatISOToDate(stageData.date),
          });
        } else {
          setInitialValues(STAGE_INITIAL_VALUES);
        }
        
        setFormConfig(JSON.parse(JSON.stringify(baseConfig)));
      } catch (error) {
        console.error("Failed to load initial data for stage form", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataAndConfig();
  }, [championshipId, stageId, isEditMode]);
  
  const transformSubmitData = useCallback((data: any): CreateStageData => ({
    ...data,
    date: formatDateToISO(data.date)!,
    championshipId: championshipId!,
  }), [championshipId]);
  
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