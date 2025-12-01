import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Alert, AlertDescription } from "brk-design-system";
import { Badge } from "@/components/ui/badge";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { FormScreen } from "@/components/ui/FormScreen";
import { useChampionshipData } from "@/contexts/ChampionshipContext";

import { PaymentConditions } from "../components/ui/payment-conditions";
import { SeasonData, SeasonService } from "../lib/services/season.service";
import { formatDateForDisplay, formatDateToISO } from "../utils/date";

// Componente de feedback visual para pré-inscrição
const PreRegistrationFeedback: React.FC<{
  hasPreviousSeason: boolean;
  preRegistrationEnabled?: boolean;
  preRegistrationEndDate?: string | Date | null;
  getValues?: () => { enabled?: boolean; endDate?: string | Date | null };
}> = ({ hasPreviousSeason, preRegistrationEnabled: propEnabled, preRegistrationEndDate: propEndDate, getValues }) => {
  const [enabled, setEnabled] = useState(propEnabled);
  const [endDate, setEndDate] = useState(propEndDate);

  // Observar mudanças nos valores do formulário apenas quando getValues mudar
  useEffect(() => {
    if (!getValues) return;
    const values = getValues();
    if (values.enabled !== undefined) setEnabled(values.enabled);
    if (values.endDate !== undefined) setEndDate(values.endDate);
  }, [getValues]);

  // Usar valores das props se disponíveis, senão usar estado
  const preRegistrationEnabled = enabled ?? propEnabled;
  const preRegistrationEndDate = endDate ?? propEndDate;
  if (preRegistrationEnabled && preRegistrationEndDate) {
    const formattedEndDate = preRegistrationEndDate instanceof Date
      ? formatDateForDisplay(preRegistrationEndDate.toISOString())
      : formatDateForDisplay(preRegistrationEndDate);
    
    // Calcular data de abertura geral (1 dia após término)
    const endDateObj = preRegistrationEndDate instanceof Date 
      ? preRegistrationEndDate 
      : new Date(preRegistrationEndDate);
    const generalRegistrationDate = new Date(endDateObj.getTime() + 24 * 60 * 60 * 1000);
    
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="text-green-800">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="bg-green-600">
              Pré-Inscrição Ativa
            </Badge>
            <span>
              Pré-inscrição configurada até <strong>{formattedEndDate}</strong>. 
              As inscrições gerais abrem automaticamente em <strong>{formatDateForDisplay(generalRegistrationDate.toISOString())}</strong>.
            </span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasPreviousSeason) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-blue-600">
              Disponível
            </Badge>
            <span>
              Pré-inscrição disponível. Você pode ativar um período exclusivo para pilotos que participaram da temporada anterior.
            </span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-gray-200 bg-gray-50">
      <AlertDescription className="text-gray-600">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Indisponível
          </Badge>
          <span>
            Pré-inscrição disponível apenas a partir da segunda temporada do campeonato. 
            É necessário ter uma temporada anterior com participantes para habilitar esta funcionalidade.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

type FormPaymentCondition = {
  type: "por_temporada" | "por_etapa";
  value: number;
  description: string;
  enabled: boolean;
  paymentMethods: ("pix" | "cartao_credito")[];
  pixInstallments?: number;
  creditCardInstallments?: number;
};

type FormData = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "agendado" | "em_andamento" | "cancelado" | "finalizado";
  registrationOpen: boolean;
  preRegistrationEnabled: boolean;
  preRegistrationEndDate: string;
  paymentConditions: FormPaymentCondition[];
};

export const CreateSeason = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { championshipId, seasonId } = useParams<{
    championshipId: string;
    seasonId?: string;
  }>();
  const { addSeason, updateSeason, getSeasons, getChampionshipInfo } =
    useChampionshipData();
  const isEditMode = seasonId !== "new" && seasonId !== undefined;

  // Obter dados duplicados do location.state
  const duplicatedData = location.state?.initialData;

  // Obter dados do campeonato do contexto
  const championship = getChampionshipInfo();

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [hasPreviousSeason, setHasPreviousSeason] = useState<boolean>(false);
  const [currentSeasonData, setCurrentSeasonData] = useState<any>(null);
  const preRegistrationValuesRef = useRef<{
    enabled?: boolean;
    endDate?: string | Date | null;
  }>({});

  // Configurar o formulário
  useEffect(() => {
    const config: FormSectionConfig[] = [
      {
        section: "Dados Gerais",
        detail: "Informações básicas da temporada",
        fields: [
          {
            id: "name",
            name: "Nome da temporada",
            type: "input",
            mandatory: true,
            max_char: 75,
            placeholder: "Ex: Temporada 2024/1",
          },
          {
            id: "description",
            name: "Descrição da temporada",
            type: "textarea",
            mandatory: true,
            max_char: 1000,
            placeholder:
              "Descrição detalhada da temporada, regulamento, categorias, etc.",
          },
          {
            id: "startDate",
            name: "Data de início",
            type: "inputMask",
            mask: "date",
            mandatory: true,
            placeholder: "DD/MM/AAAA",
            inline: true,
            inlineGroup: "dates",
          },
          {
            id: "endDate",
            name: "Data de fim",
            type: "inputMask",
            mask: "date",
            mandatory: true,
            placeholder: "DD/MM/AAAA",
            inline: true,
            inlineGroup: "dates",
          },
          {
            id: "status",
            name: "Status",
            type: "select",
            mandatory: true,
            options: [
              { value: "agendado", description: "Agendado" },
              { value: "em_andamento", description: "Em andamento" },
              { value: "cancelado", description: "Cancelado" },
              { value: "finalizado", description: "Finalizado" },
            ],
            inline: true,
            inlineGroup: "status",
          },
          {
            id: "registrationOpen",
            name: "Inscrições abertas",
            type: "select",
            mandatory: true,
            options: [
              { value: "true", description: "Sim" },
              { value: "false", description: "Não" },
            ],
            inline: true,
            inlineGroup: "status",
          },
        ],
      },
      {
        section: "Pré-Inscrição",
        detail: hasPreviousSeason
          ? "Ofereça um período exclusivo de inscrição para pilotos que participaram da temporada anterior"
          : "Pré-inscrição disponível apenas a partir da segunda temporada do campeonato",
        fields: [
          {
            id: "preRegistrationFeedback",
            name: "",
            type: "custom",
            customComponent: PreRegistrationFeedback,
            customComponentProps: {
              hasPreviousSeason,
              getValues: () => preRegistrationValuesRef.current,
            },
          },
          {
            id: "preRegistrationEnabled",
            name: "Habilitar Pré-Inscrição",
            type: "checkbox",
            mandatory: false,
            disabled: !hasPreviousSeason,
          },
          {
            id: "preRegistrationEndDate",
            name: "Data de término da pré-inscrição",
            type: "inputMask",
            mask: "date",
            mandatory: true,
            placeholder: "DD/MM/AAAA",
            conditionalField: {
              dependsOn: "preRegistrationEnabled",
              showWhen: (value: any) => value === true || value === "true",
            },
          },
        ],
      },
      {
        section: "Condições de Pagamento",
        detail:
          "Configure as condições de pagamento disponíveis. Cada condição pode ter métodos de pagamento específicos.",
        fields: [
          {
            id: "paymentConditions",
            name: "Condições de pagamento",
            type: "custom",
            customComponent: PaymentConditions,
          },
        ],
      },
    ];
    setFormConfig(config);
  }, [hasPreviousSeason]);

  // Verificar se existe temporada anterior com participantes
  useEffect(() => {
    const checkPreviousSeason = async () => {
      if (!championshipId) return;

      try {
        const seasons = getSeasons();
        // Filtrar temporada atual se estiver editando
        const otherSeasons = isEditMode && seasonId
          ? seasons.filter((s) => s.id !== seasonId)
          : seasons;

        // Ordenar por endDate descendente para pegar a mais recente
        const sortedSeasons = [...otherSeasons].sort((a, b) => {
          const dateA = new Date(a.endDate).getTime();
          const dateB = new Date(b.endDate).getTime();
          return dateB - dateA;
        });

        // Verificar se existe temporada anterior (que já terminou)
        // A validação completa de participantes será feita no backend
        const now = new Date();
        const previousSeason = sortedSeasons.find(
          (s) => new Date(s.endDate) < now
        );

        setHasPreviousSeason(!!previousSeason);
      } catch (error) {
        console.error("Erro ao verificar temporada anterior:", error);
        setHasPreviousSeason(false);
      }
    };

    checkPreviousSeason();
  }, [championshipId, getSeasons, isEditMode, seasonId]);

  // Handler para mudanças de campo - atualizar ref para feedback visual
  const handleFieldChange = useCallback((fieldId: string, value: any, formData: any) => {
    // Atualizar apenas os campos de pré-inscrição para feedback visual
    if (fieldId === 'preRegistrationEnabled' || fieldId === 'preRegistrationEndDate') {
      preRegistrationValuesRef.current = {
        enabled: formData.preRegistrationEnabled,
        endDate: formData.preRegistrationEndDate,
      };
    }
  }, []);

  const transformInitialData = useCallback((data: any) => {
    // Verificar se as datas são válidas antes de formatar
    const formatDateSafely = (dateValue: any): string => {
      if (!dateValue) return "";

      // Se já é uma string no formato DD/MM/YYYY, retornar como está
      if (
        typeof dateValue === "string" &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)
      ) {
        return dateValue;
      }

      // Se é uma string ISO (YYYY-MM-DD), formatar
      if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(dateValue)
      ) {
        return formatDateForDisplay(dateValue);
      }

      // Se é um objeto Date, formatar
      if (dateValue instanceof Date) {
        return formatDateForDisplay(dateValue);
      }

      console.warn("🔍 CreateSeason: Data inválida:", dateValue);
      return "";
    };

    return {
      ...data,
      startDate: formatDateSafely(data.startDate),
      endDate: formatDateSafely(data.endDate),
      registrationOpen: data.registrationOpen.toString(),
      preRegistrationEnabled: data.preRegistrationEnabled ?? false,
      preRegistrationEndDate: formatDateSafely(data.preRegistrationEndDate),
      paymentConditions: data.paymentConditions || [
        {
          type: "por_temporada",
          value: 0,
          description: "Pagamento por temporada",
          enabled: true,
          paymentMethods: [],
          pixInstallments: 1,
          creditCardInstallments: 1,
        },
        {
          type: "por_etapa",
          value: 0,
          description: "Pagamento por etapa",
          enabled: false,
          paymentMethods: [],
          pixInstallments: 1,
          creditCardInstallments: 1,
        },
      ],
    };
  }, []);

  const transformSubmitData = useCallback(
    (data: any): SeasonData => {
      const preRegistrationEnabled = 
        data.preRegistrationEnabled === true || 
        data.preRegistrationEnabled === "true";

      // Sempre enviar os campos de pré-inscrição explicitamente
      const submitData: SeasonData = {
        name: data.name,
        description: data.description,
        startDate: formatDateToISO(data.startDate) || "",
        endDate: formatDateToISO(data.endDate) || "",
        status: data.status,
        registrationOpen: data.registrationOpen === "true",
        preRegistrationEnabled: preRegistrationEnabled,
        preRegistrationEndDate: preRegistrationEnabled && data.preRegistrationEndDate
          ? formatDateToISO(data.preRegistrationEndDate) || null
          : null,
        paymentConditions: data.paymentConditions, // Enviar todas as condições, incluindo as inativas
        paymentMethods: [], // Campo legado - será removido
        championshipId: championshipId!,
        pixInstallments: 1, // Campo legado - será removido
        creditCardInstallments: 1, // Campo legado - será removido
      };

      return submitData;
    },
    [championshipId],
  );

  const onSuccess = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=seasons`);
  }, [navigate, championshipId]);

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}?tab=seasons`);
  }, [navigate, championshipId]);

  const fetchData = useCallback(async () => {
    if (!isEditMode || !seasonId) return null;

    try {
      // Buscar temporada do contexto primeiro
      const seasons = getSeasons();
      const seasonFromContext = seasons.find((s) => s.id === seasonId);

      let seasonData;
      if (seasonFromContext) {
        seasonData = seasonFromContext;
      } else {
        // Fallback para backend se não encontrar no contexto
        seasonData = await SeasonService.getById(seasonId);
      }

      // Armazenar dados da temporada para feedback visual
      setCurrentSeasonData(seasonData);

      return seasonData;
    } catch (err: any) {
      console.error("❌ CreateSeason: Erro ao carregar temporada:", err);
      throw new Error("Erro ao carregar temporada: " + err.message);
    }
  }, [isEditMode, seasonId, getSeasons]);

  const createData = useCallback(
    async (data: SeasonData) => {
      const createdSeason = await SeasonService.create(data);

      // Atualizar o contexto com a nova temporada
      addSeason(createdSeason);

      return createdSeason;
    },
    [addSeason],
  );

  const updateData = useCallback(
    async (id: string, data: SeasonData) => {
      const updatedSeason = await SeasonService.update(id, data);

      // Atualizar o contexto com a temporada atualizada
      updateSeason(id, updatedSeason);

      return updatedSeason;
    },
    [updateSeason],
  );

  if (!championshipId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">
            ID do campeonato não encontrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormScreen
      title={isEditMode ? "Editar Temporada" : "Criar Temporada"}
      description="Configure as informações da temporada e as condições de pagamento"
      formId="season-form"
      formConfig={formConfig}
      id={isEditMode ? seasonId : undefined}
      fetchData={isEditMode ? fetchData : undefined}
      createData={createData}
      updateData={updateData}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onFieldChange={handleFieldChange}
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={
        duplicatedData
          ? transformInitialData(duplicatedData)
          : {
              name: "",
              description: "",
              startDate: "",
              endDate: "",
              status: "agendado",
              registrationOpen: "true",
              preRegistrationEnabled: false,
              preRegistrationEndDate: "",
              paymentConditions: [
                {
                  type: "por_temporada",
                  value: 0,
                  description: "Pagamento por temporada",
                  enabled: true,
                  paymentMethods: [],
                  pixInstallments: 1,
                  creditCardInstallments: 1,
                },
                {
                  type: "por_etapa",
                  value: 0,
                  description: "Pagamento por etapa",
                  enabled: false,
                  paymentMethods: [],
                  pixInstallments: 1,
                  creditCardInstallments: 1,
                },
              ],
            }
      }
      successMessage={
        isEditMode
          ? "Temporada atualizada com sucesso!"
          : "Temporada criada com sucesso!"
      }
      errorMessage={
        isEditMode ? "Erro ao atualizar temporada." : "Erro ao criar temporada."
      }
    />
  );
};

export default CreateSeason;
