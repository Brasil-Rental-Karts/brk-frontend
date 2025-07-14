import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PenaltyService, PenaltyType } from '../lib/services/penalty.service';
import { SeasonService, Season } from '../lib/services/season.service';
import { CategoryService, Category } from '../lib/services/category.service';
import { StageService, Stage } from '../lib/services/stage.service';
import { SeasonRegistrationService } from '../lib/services/season-registration.service';
import { StageParticipationService } from '../lib/services/stage-participation.service';
import { FormScreen } from '@/components/ui/FormScreen';
import { FormSectionConfig } from '@/components/ui/dynamic-form';
import { Loading } from '@/components/ui/loading';
import { Card, CardContent } from 'brk-design-system';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { formatName } from '@/utils/name';
import { useChampionshipData } from '@/contexts/ChampionshipContext';

interface SeasonRegistration {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  categories: Array<{
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
  }>;
}

const PENALTY_INITIAL_VALUES = {
  userId: '',
  type: PenaltyType.TIME_PENALTY,
  reason: '',
  description: '',
  timePenaltySeconds: undefined,
  positionPenalty: undefined,
  batteryIndex: undefined,
  championshipId: '',
  seasonId: '',
  stageId: '',
  categoryId: '',
};

export const CreatePenalty = () => {
  const navigate = useNavigate();
  const { championshipId, penaltyId } = useParams<{ championshipId: string; penaltyId?: string }>();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Verificar se está em modo de edição
  const isEditMode = !!penaltyId;
  const penaltyData = location.state?.penalty;
  
  // Ler parâmetros da URL para pré-preenchimento
  const urlParams = new URLSearchParams(location.search);
  const urlSeasonId = urlParams.get('seasonId');
  const urlStageId = urlParams.get('stageId');
  const urlCategoryId = urlParams.get('categoryId');
  const urlUserId = urlParams.get('userId');
  const urlBatteryIndex = urlParams.get('batteryIndex');
  const returnTab = urlParams.get('returnTab') || 'penalties';
  const returnSeason = urlParams.get('returnSeason');
  const returnStage = urlParams.get('returnStage');
  const returnCategory = urlParams.get('returnCategory');
  const returnBattery = urlParams.get('returnBattery');

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [initialValues, setInitialValues] = useState<Record<string, any>>(PENALTY_INITIAL_VALUES);
  const [isLoading, setIsLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [pilots, setPilots] = useState<SeasonRegistration[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [categoryBatteries, setCategoryBatteries] = useState<{ value: number; description: string }[]>([]);

  // Usar o contexto de dados do campeonato
  const { getSeasons, getStages, getRegistrations } = useChampionshipData();

  // Carregar temporadas do campeonato
  useEffect(() => {
    const fetchSeasons = async () => {
      if (!championshipId) return;
      
      setIsLoading(true);
      try {
        // Usar temporadas do contexto em vez de buscar do backend
        const allSeasons = getSeasons();
        const filteredSeasons = allSeasons.filter(season => season.championshipId === championshipId);
        setSeasons(filteredSeasons);
        
        // Configurar formulário inicial
        const baseConfig: FormSectionConfig[] = [
          {
            section: "Contexto da Punição",
            detail: "Selecione a temporada, etapa, categoria e piloto onde a punição será aplicada",
            fields: [
              { 
                id: "seasonId", 
                name: "Temporada", 
                type: "select", 
                mandatory: true, 
                options: filteredSeasons.map(s => ({ value: s.id, description: s.name }))
              },
              { 
                id: "stageId", 
                name: "Etapa", 
                type: "select", 
                mandatory: true, 
                options: [],
                conditionalField: { dependsOn: 'seasonId', showWhen: (value: string) => !!value }
              },
              { 
                id: "categoryId", 
                name: "Categoria", 
                type: "select", 
                mandatory: true, 
                options: [],
                conditionalField: { dependsOn: 'stageId', showWhen: (value: string) => !!value }
              },
              { 
                id: "userId", 
                name: "Piloto", 
                type: "select", 
                mandatory: true, 
                options: [],
                conditionalField: { dependsOn: 'categoryId', showWhen: (value: string) => !!value }
              },
              { 
                id: "batteryIndex", 
                name: "Bateria", 
                type: "select", 
                mandatory: true, 
                options: [],
                conditionalField: { dependsOn: 'categoryId', showWhen: (value: string) => !!value }
              },
            ],
          },
          {
            section: "Detalhes da Punição",
            detail: "Configure o tipo e os detalhes da punição",
            fields: [
              { 
                id: "type", 
                name: "Tipo de Punição", 
                type: "select", 
                mandatory: true, 
                options: [
                  { value: PenaltyType.DISQUALIFICATION, description: 'Desqualificação' },
                  { value: PenaltyType.TIME_PENALTY, description: 'Penalidade de Tempo' },
                  { value: PenaltyType.POSITION_PENALTY, description: 'Penalidade de Posição' },
                  { value: PenaltyType.WARNING, description: 'Advertência' }
                ]
              },
                             { 
                 id: "timePenaltySeconds", 
                 name: "Tempo de penalidade (segundos)", 
                 type: "input", 
                 mandatory: false, 
                 conditionalField: { dependsOn: 'type', showWhen: (value: string) => value === PenaltyType.TIME_PENALTY }
               },
               { 
                 id: "positionPenalty", 
                 name: "Posições de penalidade", 
                 type: "input", 
                 mandatory: false, 
                 conditionalField: { dependsOn: 'type', showWhen: (value: string) => value === PenaltyType.POSITION_PENALTY }
               },

            ],
          },
          {
            section: "Motivo e Descrição",
            detail: "Informe o motivo e detalhes da punição",
            fields: [
              { 
                id: "reason", 
                name: "Motivo", 
                type: "input", 
                mandatory: true, 
                max_char: 200, 
                placeholder: "Motivo da punição"
              },
              { 
                id: "description", 
                name: "Descrição", 
                type: "textarea", 
                mandatory: false, 
                max_char: 1000, 
                placeholder: "Descrição detalhada da punição"
              },
            ],
          },
        ];

        setFormConfig(baseConfig);
        
        // Se estiver em modo de edição, carregar dados da punição
        if (isEditMode && penaltyData) {
          setInitialValues({
            ...PENALTY_INITIAL_VALUES,
            championshipId: championshipId || '',
            seasonId: penaltyData.seasonId || '',
            stageId: penaltyData.stageId || '',
            categoryId: penaltyData.categoryId || '',
            userId: penaltyData.userId || '',
            type: penaltyData.type || PenaltyType.TIME_PENALTY,
            reason: penaltyData.reason || '',
            description: penaltyData.description || '',
            timePenaltySeconds: penaltyData.timePenaltySeconds ? String(penaltyData.timePenaltySeconds) : '',
            positionPenalty: penaltyData.positionPenalty ? String(penaltyData.positionPenalty) : '',

          });
          
          // Carregar dados dependentes se disponíveis
          if (penaltyData.seasonId) {
            await loadStagesForSeason(penaltyData.seasonId);
          }
          if (penaltyData.stageId) {
            await loadCategoriesForStage(penaltyData.stageId);
          }
          if (penaltyData.categoryId && penaltyData.seasonId) {
            await loadPilotsForCategory(penaltyData.categoryId, penaltyData.seasonId, penaltyData.stageId);
          }
        } else {
          // Verificar se há parâmetros da URL para pré-preenchimento
          const hasUrlParams = urlSeasonId || urlStageId || urlCategoryId || urlUserId || urlBatteryIndex;
          
          setInitialValues({
            ...PENALTY_INITIAL_VALUES,
            championshipId: championshipId || '',
            seasonId: urlSeasonId || '',
            stageId: urlStageId || '',
            categoryId: urlCategoryId || '',
            userId: urlUserId || '',
          });
          
          // Se há parâmetros da URL, carregar dados dependentes
          if (hasUrlParams) {
            if (urlSeasonId) {
              await loadStagesForSeason(urlSeasonId);
            }
            if (urlStageId) {
              await loadCategoriesForStage(urlStageId);
            }
            if (urlCategoryId && urlSeasonId) {
              await loadPilotsForCategory(urlCategoryId, urlSeasonId, urlStageId || undefined);
              // Carregar baterias se há categoria selecionada
              await loadBatteriesForCategory(urlCategoryId);
              
              // Aguardar um pouco para garantir que as baterias foram carregadas
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
        
        // Debug: log penalty data if in edit mode
        if (isEditMode && penaltyData) {
          console.log('Penalty data:', penaltyData);
        }
      } catch (err: any) {
        console.error('Erro ao carregar temporadas:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeasons();
  }, [championshipId, isEditMode, penaltyData, urlSeasonId, urlStageId, urlCategoryId, urlUserId, urlBatteryIndex, getSeasons]);

  // Carregar etapas quando temporada for selecionada
  const loadStagesForSeason = useCallback(async (seasonId: string) => {
    if (!seasonId) {
      setStages([]);
      return;
    }
    try {
      // Usar etapas do contexto em vez de buscar do backend
      const allStages = getStages();
      const seasonStages = allStages.filter(stage => stage.seasonId === seasonId);
      setStages(seasonStages);
      
      // Atualizar opções do formulário
      setFormConfig(prevConfig => 
        prevConfig.map(section => {
          if (section.section === "Contexto da Punição") {
            return {
              ...section,
              fields: section.fields.map(field => {
                if (field.id === 'stageId') {
                  return { ...field, options: seasonStages.map(s => ({ value: s.id, description: s.name })) };
                }
                return field;
              })
            };
          }
          return section;
        })
      );
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      setStages([]);
    }
  }, [getStages]);

  // Carregar categorias quando etapa for selecionada
  const loadCategoriesForStage = useCallback(async (stageId: string) => {
    if (!stageId) {
      setCategories([]);
      return;
    }
    try {
      const categoriesRes = await CategoryService.getByStageId(stageId);
      setCategories(categoriesRes);
      
      // Atualizar opções de categoria no formulário
      setFormConfig(prevConfig => 
        prevConfig.map(section => {
          if (section.section === "Contexto da Punição") {
            return {
              ...section,
              fields: section.fields.map(field => {
                if (field.id === 'categoryId') {
                  return { ...field, options: categoriesRes.map(c => ({ value: c.id, description: c.name })) };
                }
                return field;
              })
            };
          }
          return section;
        })
      );
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);

  // Carregar baterias quando categoria for selecionada
  const loadBatteriesForCategory = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setCategoryBatteries([]);
      return;
    }
    try {
      // Buscar a categoria diretamente da API para garantir que temos os dados mais recentes
      const categoryRes = await CategoryService.getById(categoryId);
      if (categoryRes && categoryRes.batteriesConfig) {
        const batteryOptions = categoryRes.batteriesConfig.map((battery, index) => ({
          value: index,
          description: battery.name
        }));
        setCategoryBatteries(batteryOptions);
        
        // Atualizar opções de bateria no formulário
        setFormConfig(prevConfig => 
          prevConfig.map(section => {
            if (section.section === "Contexto da Punição") {
              return {
                ...section,
                fields: section.fields.map(field => {
                  if (field.id === 'batteryIndex') {
                    return { ...field, options: batteryOptions };
                  }
                  return field;
                })
              };
            }
            return section;
          })
        );
      }
    } catch (err: any) {
      console.error('Erro ao carregar baterias:', err);
    }
  }, []);

  // Carregar pilotos quando categoria for selecionada
  const loadPilotsForCategory = useCallback(async (categoryId: string, seasonId: string, stageId?: string) => {
    if (!categoryId || !seasonId) {
      setPilots([]);
      return;
    }
    try {
      // Usar inscrições do contexto em vez de buscar do backend
      const allRegistrations = getRegistrations();
      const registrationsRes = allRegistrations.filter(reg => reg.seasonId === seasonId);
      
      // Buscar participações da etapa selecionada
      let stageParticipations: any[] = [];
      try {
        let targetStageId = stageId || selectedStageId;
        
        // Se não temos stageId, buscar todas as etapas da temporada e usar a primeira como padrão
        if (!targetStageId) {
          const stagesRes = await StageService.getBySeasonId(seasonId);
          if (stagesRes.length > 0) {
            targetStageId = stagesRes[0].id;
          }
        }
        
        if (targetStageId) {
          stageParticipations = await StageParticipationService.getStageParticipations(targetStageId);
        }
      } catch (error) {
        console.error('Erro ao carregar participações da etapa:', error);
      }
      
      // Filtrar pilotos confirmados na categoria e etapa específica
      const confirmedPilots = registrationsRes.filter((reg: any) => 
        reg.categories?.some((cat: any) => cat.categoryId === categoryId) &&
        stageParticipations.some(
          (part) => part.userId === reg.userId && part.categoryId === categoryId && part.status === 'confirmed'
        )
      );
      
      setPilots(confirmedPilots);
      
      // Atualizar opções de piloto no formulário
      setFormConfig(prevConfig => 
        prevConfig.map(section => {
          if (section.section === "Contexto da Punição") {
            return {
              ...section,
              fields: section.fields.map(field => {
                if (field.id === 'userId') {
                  return { 
                    ...field, 
                    options: confirmedPilots.map(p => ({ 
                      value: p.userId, 
                      description: `${formatName(p.user.name)}` 
                    }))
                  };
                }
                return field;
              })
            };
          }
          return section;
        })
      );
    } catch (err: any) {
      console.error('Erro ao carregar pilotos:', err);
    }
  }, [selectedStageId, loadStagesForSeason, loadCategoriesForStage, loadBatteriesForCategory]);

  // Event handlers para mudanças de campo
  const onFieldChange = useCallback(async (fieldId: string, value: any, formData: any, formActions: { setValue: (name: string, value: any) => void }) => {
    if (fieldId === 'seasonId') {
      // Resetar campos dependentes
      if (formActions.setValue) {
        formActions.setValue('stageId', '');
        formActions.setValue('categoryId', '');
        formActions.setValue('userId', '');
      }
      setSelectedStageId('');
      await loadStagesForSeason(value);
    }
    
    if (fieldId === 'stageId') {
      // Resetar categoria e piloto
      if (formActions.setValue) {
        formActions.setValue('categoryId', '');
        formActions.setValue('userId', '');
      }
      setSelectedStageId(value);
      await loadCategoriesForStage(value);
      
      // Se já há uma categoria selecionada, recarregar os pilotos para a nova etapa
      if (formData.categoryId) {
        await loadPilotsForCategory(formData.categoryId, formData.seasonId, value);
      }
    }

    if (fieldId === 'categoryId') {
      // Resetar piloto e bateria
      if (formActions.setValue) {
        formActions.setValue('userId', '');
        formActions.setValue('batteryIndex', '');
      }
      await loadPilotsForCategory(value, formData.seasonId, formData.stageId);
      await loadBatteriesForCategory(value);
    }
  }, [loadStagesForSeason, loadCategoriesForStage, loadPilotsForCategory, loadBatteriesForCategory]);

  // Efeito para definir o valor da bateria quando as opções são carregadas
  useEffect(() => {
    if (categoryBatteries.length > 0 && urlBatteryIndex !== null) {
      // Atualizar os valores iniciais para incluir a bateria
      setInitialValues(prev => ({
        ...prev,
        batteryIndex: Number(urlBatteryIndex)
      }));
      
      // Também atualizar o formConfig para garantir que as opções estão disponíveis
      setFormConfig(prevConfig => 
        prevConfig.map(section => {
          if (section.section === "Contexto da Punição") {
            return {
              ...section,
              fields: section.fields.map(field => {
                if (field.id === 'batteryIndex') {
                  return { 
                    ...field, 
                    options: categoryBatteries,
                    defaultValue: Number(urlBatteryIndex)
                  };
                }
                return field;
              })
            };
          }
          return section;
        })
      );
    }
  }, [categoryBatteries, urlBatteryIndex]);

  // Transformar dados para envio
  const transformSubmitData = useCallback((data: any) => {
    // Validar campos obrigatórios
    if (!data.seasonId) {
      throw new Error('Selecione a temporada.');
    }
    if (!data.stageId) {
      throw new Error('Selecione a etapa.');
    }
    if (!data.categoryId) {
      throw new Error('Selecione a categoria.');
    }
    if (!data.userId) {
      throw new Error('Selecione o piloto.');
    }
    if (data.batteryIndex === undefined || data.batteryIndex === null || data.batteryIndex === '') {
      throw new Error('Selecione a bateria.');
    }
    if (!data.type) {
      throw new Error('Selecione o tipo de punição.');
    }
    if (!data.reason?.trim()) {
      throw new Error('Motivo é obrigatório.');
    }

    // Validações específicas por tipo
    if (data.type === PenaltyType.TIME_PENALTY && (!data.timePenaltySeconds || data.timePenaltySeconds <= 0)) {
      throw new Error('Informe o tempo de penalidade em segundos.');
    }
    if (data.type === PenaltyType.POSITION_PENALTY && (!data.positionPenalty || data.positionPenalty <= 0)) {
      throw new Error('Informe a quantidade de posições de penalidade.');
    }


    // Limpar campos vazios e converter tipos
    const cleanData = { ...data };
    
    // Converter campos numéricos
    if (cleanData.timePenaltySeconds) {
      cleanData.timePenaltySeconds = Number(cleanData.timePenaltySeconds);
    } else {
      delete cleanData.timePenaltySeconds;
    }
    
    if (cleanData.positionPenalty) {
      cleanData.positionPenalty = Number(cleanData.positionPenalty);
    } else {
      delete cleanData.positionPenalty;
    }
    

    
    if (cleanData.batteryIndex !== undefined && cleanData.batteryIndex !== null && cleanData.batteryIndex !== '') {
      cleanData.batteryIndex = Number(cleanData.batteryIndex);
    } else {
      delete cleanData.batteryIndex;
    }
    

    if (!cleanData.description) delete cleanData.description;

    // Garantir que championshipId seja incluído
    cleanData.championshipId = championshipId || '';

    // Garantir que type seja incluído se não estiver definido
    if (!cleanData.type) {
      cleanData.type = PenaltyType.TIME_PENALTY;
    }

    // Debug: log the data being sent
    console.log('Data being sent to backend:', cleanData);

    return cleanData;
  }, []);

  const onSuccess = useCallback(() => {
    let returnUrl = `/championship/${championshipId}?tab=${returnTab}`;
    
    // Se há parâmetros de retorno específicos, incluí-los na URL
    if (returnSeason && returnStage && returnCategory && returnBattery) {
      returnUrl += `&season=${returnSeason}&stage=${returnStage}&category=${returnCategory}&battery=${returnBattery}`;
    }
    
    navigate(returnUrl);
  }, [navigate, championshipId, returnTab, returnSeason, returnStage, returnCategory, returnBattery]);

  const onCancel = useCallback(() => {
    let returnUrl = `/championship/${championshipId}?tab=${returnTab}`;
    
    // Se há parâmetros de retorno específicos, incluí-los na URL
    if (returnSeason && returnStage && returnCategory && returnBattery) {
      returnUrl += `&season=${returnSeason}&stage=${returnStage}&category=${returnCategory}&battery=${returnBattery}`;
    }
    
    navigate(returnUrl);
  }, [navigate, championshipId, returnTab, returnSeason, returnStage, returnCategory, returnBattery]);

  // Função customizada para lidar com criação e edição
  const handleSubmit = useCallback(async (data: any) => {
    if (isEditMode && penaltyId) {
      return await PenaltyService.updatePenalty(penaltyId, data);
    } else {
      return await PenaltyService.createPenalty(data);
    }
  }, [isEditMode, penaltyId]);

  // Debug: log user info (apenas uma vez)
  useEffect(() => {
    console.log('=== CREATE PENALTY DEBUG ===');
    console.log('User info:', user);
    console.log('Is authenticated:', isAuthenticated);
    console.log('User role:', user?.role);
    console.log('Championship ID:', championshipId);
    console.log('Is edit mode:', isEditMode);
    console.log('URL params:', { urlSeasonId, urlStageId, urlCategoryId, urlUserId, urlBatteryIndex });
    console.log('===========================');
  }, [user, isAuthenticated, championshipId, isEditMode, urlSeasonId, urlStageId, urlCategoryId, urlUserId, urlBatteryIndex]);

  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa estar logado para acessar esta página</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário tem as permissões necessárias
  const hasPermission = user?.role === 'Administrator' || user?.role === 'Manager';
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para criar penalidades</p>
        </div>
      </div>
    );
  }

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

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Criar Punição" />
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
      title={isEditMode ? "Editar Punição" : "Criar Punição"}
      formId="penalty-form"
      formConfig={formConfig}
      createData={handleSubmit}
      onFieldChange={onFieldChange}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={initialValues}
      successMessage={isEditMode ? "Punição atualizada com sucesso!" : "Punição criada com sucesso!"}
      errorMessage={isEditMode ? "Erro ao atualizar punição." : "Erro ao criar punição."}
    />
  );
};

export default CreatePenalty; 