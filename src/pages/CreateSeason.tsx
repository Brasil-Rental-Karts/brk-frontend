import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SeasonService, SeasonData, PaymentCondition } from '../lib/services/season.service';
import { ChampionshipService } from '../lib/services/championship.service';
import { formatDateForDisplay, formatDateToISO } from '../utils/date';
import { PaymentConditions } from '../components/ui/payment-conditions';
import { FormScreen } from '@/components/ui/FormScreen';
import { FormSectionConfig } from '@/components/ui/dynamic-form';
import { useChampionshipData } from '@/contexts/ChampionshipContext';

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
  paymentConditions: FormPaymentCondition[];
};

export const CreateSeason = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { championshipId, seasonId } = useParams<{ championshipId: string; seasonId?: string }>();
  const { addSeason, updateSeason, getSeasons, getChampionshipInfo } = useChampionshipData();
  const isEditMode = seasonId !== 'new' && seasonId !== undefined;
  
  // Obter dados duplicados do location.state
  const duplicatedData = location.state?.initialData;
  
  // Obter dados do campeonato do contexto
  const championship = getChampionshipInfo();
  
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);

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
            placeholder: "Descrição detalhada da temporada, regulamento, categorias, etc.",
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
        section: "Condições de Pagamento",
        detail: "Configure as condições de pagamento disponíveis. Cada condição pode ter métodos de pagamento específicos.",
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
  }, []);

  const transformInitialData = useCallback((data: any) => {
    console.log('🔍 CreateSeason: transformInitialData - data.startDate:', data.startDate, typeof data.startDate);
    console.log('🔍 CreateSeason: transformInitialData - data.endDate:', data.endDate, typeof data.endDate);
    
    // Verificar se as datas são válidas antes de formatar
    const formatDateSafely = (dateValue: any): string => {
      if (!dateValue) return "";
      
      // Se já é uma string no formato DD/MM/YYYY, retornar como está
      if (typeof dateValue === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        return dateValue;
      }
      
      // Se é uma string ISO (YYYY-MM-DD), formatar
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        return formatDateForDisplay(dateValue);
      }
      
      // Se é um objeto Date, formatar
      if (dateValue instanceof Date) {
        return formatDateForDisplay(dateValue);
      }
      
      console.warn('🔍 CreateSeason: Data inválida:', dateValue);
      return "";
    };
    
    return {
      ...data,
      startDate: formatDateSafely(data.startDate),
      endDate: formatDateSafely(data.endDate),
      registrationOpen: data.registrationOpen.toString(),
      paymentConditions: data.paymentConditions || [
        {
          type: "por_temporada",
          value: 0,
          description: "Pagamento por temporada",
          enabled: true,
          paymentMethods: [],
          pixInstallments: 1,
          creditCardInstallments: 1
        },
        {
          type: "por_etapa",
          value: 0,
          description: "Pagamento por etapa",
          enabled: false,
          paymentMethods: [],
          pixInstallments: 1,
          creditCardInstallments: 1
        }
      ]
    };
  }, []);

  const transformSubmitData = useCallback((data: any): SeasonData => {
    return {
      name: data.name,
      description: data.description,
      startDate: formatDateToISO(data.startDate) || '',
      endDate: formatDateToISO(data.endDate) || '',
      status: data.status,
      registrationOpen: data.registrationOpen === 'true',
      paymentConditions: data.paymentConditions.filter((condition: FormPaymentCondition) => condition.enabled),
      paymentMethods: [], // Campo legado - será removido
      championshipId: championshipId!,
      pixInstallments: 1, // Campo legado - será removido
      creditCardInstallments: 1 // Campo legado - será removido
    };
  }, [championshipId]);

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
      const seasonFromContext = seasons.find(s => s.id === seasonId);
      
      if (seasonFromContext) {
        console.log('✅ CreateSeason: Temporada encontrada no contexto:', seasonFromContext.name);
        return seasonFromContext;
      } else {
        console.log('⚠️ CreateSeason: Temporada não encontrada no contexto, buscando no backend...');
        // Fallback para backend se não encontrar no contexto
        const season = await SeasonService.getById(seasonId);
        console.log('✅ CreateSeason: Temporada carregada do backend:', season.name);
        return season;
      }
    } catch (err: any) {
      console.error('❌ CreateSeason: Erro ao carregar temporada:', err);
      throw new Error('Erro ao carregar temporada: ' + err.message);
    }
  }, [isEditMode, seasonId, getSeasons]);
  
  const createData = useCallback(async (data: SeasonData) => {
    console.log('🔍 CreateSeason: Criando nova temporada...');
    const createdSeason = await SeasonService.create(data);
    console.log('✅ CreateSeason: Temporada criada com sucesso:', createdSeason.name);
    
    // Atualizar o contexto com a nova temporada
    addSeason(createdSeason);
    console.log('✅ CreateSeason: Contexto atualizado com nova temporada');
    
    return createdSeason;
  }, [addSeason]);
  
  const updateData = useCallback(async (id: string, data: SeasonData) => {
    console.log('🔍 CreateSeason: Atualizando temporada existente...');
    const updatedSeason = await SeasonService.update(id, data);
    console.log('✅ CreateSeason: Temporada atualizada com sucesso:', updatedSeason.name);
    
    // Atualizar o contexto com a temporada atualizada
    updateSeason(id, updatedSeason);
    console.log('✅ CreateSeason: Contexto atualizado com temporada modificada');
    
    return updatedSeason;
  }, [updateSeason]);

  if (!championshipId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">ID do campeonato não encontrado</p>
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
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={duplicatedData ? transformInitialData(duplicatedData) : {
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "agendado",
        registrationOpen: "true",
        paymentConditions: [
          {
            type: "por_temporada",
            value: 0,
            description: "Pagamento por temporada",
            enabled: true,
            paymentMethods: [],
            pixInstallments: 1,
            creditCardInstallments: 1
          },
          {
            type: "por_etapa",
            value: 0,
            description: "Pagamento por etapa",
            enabled: false,
            paymentMethods: [],
            pixInstallments: 1,
            creditCardInstallments: 1
          }
        ]
      }}
      successMessage={isEditMode ? "Temporada atualizada com sucesso!" : "Temporada criada com sucesso!"}
      errorMessage={isEditMode ? "Erro ao atualizar temporada." : "Erro ao criar temporada."}
    />
  );
};

export default CreateSeason; 