import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "brk-design-system";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { FormScreen } from "@/components/ui/FormScreen";
import { InputMask } from "@/components/ui/input-mask";
import { Loading } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { Category } from "@/lib/services/category.service";
import { CreateStageData, StageService } from "@/lib/services/stage.service";
import { parseCurrencyMask, formatCurrency } from "@/utils/currency";

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

  Checkbox,
  InputMask,
};

const formatDateToISO = (date?: string) => {
  if (!date) return undefined;
  const parts = date.split("/");
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
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const STAGE_INITIAL_VALUES = {
  name: "",
  date: "",
  time: "",
  raceTrackId: "",
  trackLayoutId: "undefined",
  streamLink: "",
  seasonId: "",
  categoryIds: [] as string[],
  doublePoints: false,
  doubleRound: false,
  briefing: "",
  briefingTime: "",
  price: "",
};

export const CreateStage = () => {
  const navigate = useNavigate();
  const { championshipId, stageId } = useParams<{
    championshipId: string;
    stageId?: string;
  }>();
  const location = useLocation();

  // Usar o contexto de dados do campeonato
  const {
    getSeasons,
    getCategories,
    getStages,
    getRaceTracks,
    addStage,
    updateStage,
  } = useChampionshipData();

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [initialValues, setInitialValues] = useState<
    Record<string, any> | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [allSeasons, setAllSeasons] = useState<any[]>([]);

  const isEditMode = !!stageId;

  const loadCategoriesForSeason = useCallback(
    async (seasonId: string) => {
      let categories: Category[] = [];
      if (seasonId) {
        try {
          // Usar categorias do contexto em vez de buscar do backend
          const allCategories = getCategories();
          categories = allCategories.filter((cat) => cat.seasonId === seasonId);
        } catch (error) {
          console.error("Failed to load categories", error);
        }
      }
      setFormConfig((prevConfig) => {
        const newConfig = prevConfig.map((section) => {
          if (section.section === "Temporada e Categorias") {
            return {
              ...section,
              fields: section.fields.map((field) => {
                if (field.id === "categoryIds") {
                  return {
                    ...field,
                    options: categories.map((c) => ({
                      value: c.id,
                      description: c.name,
                    })),
                  };
                }
                return field;
              }),
            };
          }
          return section;
        });
        // Deep copy to ensure re-render
        return newConfig;
      });
    },
    [getCategories],
  );

  useEffect(() => {
    const baseConfig: FormSectionConfig[] = [
      {
        section: "Informações Básicas",
        detail: "Dados principais da etapa",
        fields: [
          {
            id: "name",
            name: "Nome da etapa",
            type: "input",
            mandatory: true,
            max_char: 100,
            placeholder: "Ex: Etapa 1",
          },
          {
            id: "date",
            name: "Data",
            type: "inputMask",
            mask: "date",
            mandatory: true,
            placeholder: "DD/MM/AAAA",
          },
          {
            id: "time",
            name: "Horário",
            type: "inputMask",
            mask: "time",
            mandatory: true,
            placeholder: "HH:MM",
          },
          {
            id: "raceTrackId",
            name: "Kartódromo",
            type: "select",
            mandatory: true,
            options: [],
          },
          {
            id: "trackLayoutId",
            name: "Traçado",
            type: "select",
            mandatory: false,
            options: [{ value: "undefined", description: "Não definido" }],
          },
          {
            id: "streamLink",
            name: "Link da transmissão",
            type: "input",
            mandatory: false,
            placeholder: "https://...",
          },
          {
            id: "briefingTime",
            name: "Horário do Briefing",
            type: "inputMask",
            mask: "time",
            placeholder: "HH:MM",
          },
          {
            id: "briefing",
            name: "Briefing",
            type: "textarea",
            placeholder: "Instruções e informações para os pilotos",
            max_char: 2000,
          },
          { id: "doublePoints", name: "Pontuação em dobro", type: "checkbox" },
          { id: "doubleRound", name: "Rodada Dupla", type: "checkbox" },
          {
            id: "price",
            name: "Preço diferenciado",
            type: "inputMask",
            mask: "currency",
            placeholder: "R$ 0,00",
          },
        ],
      },
      {
        section: "Temporada e Categorias",
        detail: "Selecione a temporada e as categorias que participarão",
        fields: [
          {
            id: "seasonId",
            name: "Temporada",
            type: "select",
            mandatory: true,
            options: [],
          },
          {
            id: "categoryIds",
            name: "Categorias",
            type: "checkbox-group",
            mandatory: true,
            options: [],
          },
        ],
      },
    ];

    const loadDataAndConfig = async () => {
      setIsLoading(true);
      try {
        // Usar temporadas do contexto em vez de buscar do backend
        const seasonsData = getSeasons();
        const filteredSeasons = seasonsData.filter(
          (season) => season.championshipId === championshipId,
        );
        setAllSeasons(filteredSeasons);
        const activeSeasons = filteredSeasons.filter(
          (s) => s.status !== "cancelado",
        );

        let categoryOptions: { value: string; description: string }[] = [];
        let stageDataToSet: Record<string, any> = STAGE_INITIAL_VALUES;
        let raceTrackOptions: { value: string; description: string }[] = [];
        let configToUse = [...baseConfig];

        // Usar kartódromos do contexto em vez de buscar do backend
        const allRaceTracks = getRaceTracks();
        const raceTrackEntries = Object.entries(allRaceTracks);
        raceTrackOptions = raceTrackEntries.map(([id, raceTrack]) => ({
          value: id,
          description: `${raceTrack.name} - ${raceTrack.city}/${raceTrack.state}`,
        }));

        const duplicatedData = location.state?.initialData;

        if (isEditMode) {
          // Usar dados do contexto em vez de buscar do backend
          const allStages = getStages();
          const stageData = allStages.find(
            (stage: any) => stage.id === stageId,
          );

          if (!stageData) {
            throw new Error("Etapa não encontrada");
          }

          stageDataToSet = {
            ...STAGE_INITIAL_VALUES,
            ...stageData,
            date: formatISOToDate(stageData.date),
            raceTrackId: stageData.raceTrackId || "",
            trackLayoutId: stageData.trackLayoutId || "undefined",
            price: stageData.price ? formatCurrency(stageData.price) : "",
          };

          if (stageData.seasonId) {
            // Usar categorias do contexto em vez de buscar do backend
            const allCategories = getCategories();
            const stageCategories = allCategories.filter(
              (cat) => cat.seasonId === stageData.seasonId,
            );
            categoryOptions = stageCategories.map((c) => ({
              value: c.id,
              description: c.name,
            }));

            const stageSeason = filteredSeasons.find(
              (s) => s.id === stageData.seasonId,
            );
            if (
              stageSeason &&
              stageSeason.status === "cancelado" &&
              !activeSeasons.some((s) => s.id === stageSeason.id)
            ) {
              activeSeasons.push(stageSeason);
            }
          }

          // Carregar traçados se houver kartódromo selecionado
          if (stageData.raceTrackId && allRaceTracks[stageData.raceTrackId]) {
            try {
              const raceTrack = allRaceTracks[stageData.raceTrackId];
              const trackLayoutOptions = [
                { value: "undefined", description: "Não definido" },
                ...raceTrack.trackLayouts.map((layout: any) => ({
                  value: layout.name,
                  description: `${layout.name} (${layout.length}m)`,
                })),
              ];

              // Atualizar as opções do campo trackLayoutId
              configToUse = configToUse.map((section) => {
                if (section.section === "Informações Básicas") {
                  return {
                    ...section,
                    fields: section.fields.map((field) => {
                      if (field.id === "trackLayoutId") {
                        return { ...field, options: trackLayoutOptions };
                      }
                      return field;
                    }),
                  };
                }
                return section;
              });
            } catch (error) {
              console.error("Erro ao carregar traçados:", error);
            }
          }
        } else if (duplicatedData) {
          stageDataToSet = {
            ...STAGE_INITIAL_VALUES,
            ...duplicatedData,
            date: /^\d{2}\/\d{2}\/\d{4}$/.test(duplicatedData.date)
              ? duplicatedData.date
              : formatISOToDate(duplicatedData.date),
            raceTrackId: duplicatedData.raceTrackId || "",
            trackLayoutId: duplicatedData.trackLayoutId || "undefined",
            price: duplicatedData.price ? formatCurrency(duplicatedData.price) : "",
          };

          if (duplicatedData.seasonId) {
            // Usar categorias do contexto em vez de buscar do backend
            const allCategories = getCategories();
            const duplicatedCategories = allCategories.filter(
              (cat) => cat.seasonId === duplicatedData.seasonId,
            );
            categoryOptions = duplicatedCategories.map((c) => ({
              value: c.id,
              description: c.name,
            }));
          }
        }

        const seasonOptions = activeSeasons.map((s) => ({
          value: s.id,
          description: s.name,
        }));
        setInitialValues(stageDataToSet);

        const newConfig = configToUse.map((section) => {
          if (section.section === "Informações Básicas") {
            return {
              ...section,
              fields: section.fields.map((field) => {
                if (field.id === "raceTrackId") {
                  return { ...field, options: raceTrackOptions };
                }
                return field;
              }),
            };
          }
          if (section.section === "Temporada e Categorias") {
            return {
              ...section,
              fields: section.fields.map((field) => {
                if (field.id === "seasonId") {
                  return { ...field, options: seasonOptions };
                }
                if (field.id === "categoryIds") {
                  // For edit mode, we preload the options
                  return { ...field, options: categoryOptions };
                }
                return field;
              }),
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
  }, [
    championshipId,
    isEditMode,
    stageId,
    loadCategoriesForSeason,
    location.state?.initialData,
    getSeasons,
    getCategories,
    getRaceTracks,
  ]);

  const transformSubmitData = useCallback(
    (data: any): CreateStageData => {
      const selectedSeason = allSeasons.find((s) => s.id === data.seasonId);
      if (selectedSeason && selectedSeason.status === "cancelado") {
        throw new Error(
          "Não é possível salvar a etapa em uma temporada cancelada.",
        );
      }

      const transformedData = { ...data };
      if (transformedData.briefingTime === "") {
        transformedData.briefingTime = null;
      }
      if (transformedData.streamLink === "") {
        transformedData.streamLink = null;
      }
      if (
        transformedData.trackLayoutId === "" ||
        transformedData.trackLayoutId === "undefined"
      ) {
        transformedData.trackLayoutId = null;
      }
      if (transformedData.price === "" || transformedData.price === null) {
        transformedData.price = null;
      } else {
        // Converter o valor da máscara de moeda para número
        transformedData.price = parseCurrencyMask(String(transformedData.price));
      }

      // Garantir que doublePoints seja boolean
      if (
        transformedData.doublePoints === undefined ||
        transformedData.doublePoints === null
      ) {
        transformedData.doublePoints = false;
      } else {
        transformedData.doublePoints = Boolean(transformedData.doublePoints);
      }

      // Garantir que doubleRound seja boolean
      if (
        transformedData.doubleRound === undefined ||
        transformedData.doubleRound === null
      ) {
        transformedData.doubleRound = false;
      } else {
        transformedData.doubleRound = Boolean(transformedData.doubleRound);
      }

      // Garantir que categoryIds seja um array válido
      if (
        !Array.isArray(transformedData.categoryIds) ||
        transformedData.categoryIds.length === 0
      ) {
        throw new Error("Selecione pelo menos uma categoria");
      }

      // Converter data de DD/MM/YYYY para objeto Date
      const dateISO = formatDateToISO(data.date);
      if (!dateISO) {
        throw new Error("Data inválida");
      }

      return {
        ...transformedData,
        date: dateISO, // Enviar como string ISO que será convertida para Date pelo backend
      };
    },
    [allSeasons],
  );

  // Event handlers
  const onFieldChange = useCallback(
    async (
      fieldId: string,
      value: any,
      _formData: any,
      formActions: { setValue: (name: string, value: any) => void },
    ) => {
      if (fieldId === "seasonId") {
        if (formActions.setValue) {
          formActions.setValue("categoryIds", []);
        }
        await loadCategoriesForSeason(value);
      }

      if (fieldId === "raceTrackId") {
        if (formActions.setValue) {
          formActions.setValue("trackLayoutId", "undefined");
        }

        // Carregar traçados do kartódromo selecionado usando dados do contexto
        if (value) {
          try {
            const allRaceTracks = getRaceTracks();
            const raceTrack = allRaceTracks[value];

            if (raceTrack) {
              const trackLayoutOptions = [
                { value: "undefined", description: "Não definido" },
                ...raceTrack.trackLayouts.map((layout: any) => ({
                  value: layout.name,
                  description: `${layout.name} (${layout.length}m)`,
                })),
              ];

              // Atualizar as opções do campo trackLayoutId
              setFormConfig((prevConfig) =>
                prevConfig.map((section) => {
                  if (section.section === "Informações Básicas") {
                    return {
                      ...section,
                      fields: section.fields.map((field) => {
                        if (field.id === "trackLayoutId") {
                          return { ...field, options: trackLayoutOptions };
                        }
                        return field;
                      }),
                    };
                  }
                  return section;
                }),
              );
            }
          } catch (error) {
            console.error("Erro ao carregar traçados:", error);
          }
        }
      }
    },
    [loadCategoriesForSeason, getRaceTracks],
  );

  const onSuccess = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=etapas`);
  }, [navigate, championshipId]);

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=etapas`);
  }, [navigate, championshipId]);

  // Wrappers para interceptar erro 409 e atualizar contexto
  const createStageWithErrorHandling = useCallback(
    async (data: any) => {
      try {
        const createdStage = await StageService.create(data);

        // Atualizar o contexto com a nova etapa
        addStage(createdStage);

        return createdStage;
      } catch (error: any) {
        if (error.response?.status === 409) {
          throw new Error(
            "Já existe uma etapa cadastrada para esta data nesta temporada. Por favor, escolha outra data.",
          );
        }
        throw error;
      }
    },
    [addStage],
  );

  const updateStageWithErrorHandling = useCallback(
    async (id: string, data: any) => {
      try {
        const updatedStage = await StageService.update(id, data);

        // Atualizar o contexto com a etapa atualizada
        updateStage(id, updatedStage);

        return updatedStage;
      } catch (error: any) {
        if (error.response?.status === 409) {
          throw new Error(
            "Já existe uma etapa cadastrada para esta data nesta temporada. Por favor, escolha outra data.",
          );
        }
        throw error;
      }
    },
    [updateStage],
  );

  if (isLoading || !initialValues) {
    return (
      <div className="p-6">
        <PageHeader title={isEditMode ? "Editar Etapa" : "Criar Etapa"} />
        <Card>
          <CardContent>
            <Loading type="spinner" size="lg" />
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
      createData={createStageWithErrorHandling}
      updateData={updateStageWithErrorHandling}
      onFieldChange={onFieldChange}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={initialValues}
      successMessage={
        isEditMode
          ? "Etapa atualizada com sucesso!"
          : "Etapa criada com sucesso!"
      }
      errorMessage={
        isEditMode ? "Erro ao atualizar etapa." : "Erro ao criar etapa."
      }
    />
  );
};

export default CreateStage;
