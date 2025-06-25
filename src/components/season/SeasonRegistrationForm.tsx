import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, Button } from 'brk-design-system';
import { DynamicForm, FormSectionConfig } from '@/components/ui/dynamic-form';
import { SeasonService, Season } from '@/lib/services/season.service';
import { CategoryService, Category } from '@/lib/services/category.service';
import { StageService, Stage } from '@/lib/services/stage.service';
import { SeasonRegistrationService, CreateRegistrationData, SeasonRegistration } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { masks } from '@/utils/masks';
import { useFormScreen } from '@/hooks/use-form-screen';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRegistrations } from '@/hooks/use-user-registrations';

interface SeasonRegistrationFormProps {
  seasonId: string;
  onSuccess?: (registrationId: string) => void;
  onCancel?: () => void;
}

// Função para traduzir status de inscrição
const translateRegistrationStatus = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'payment_pending':
      return 'Pagamento Pendente';
    case 'confirmed':
      return 'Confirmado';
    case 'cancelled':
      return 'Cancelado';
    case 'expired':
      return 'Expirado';
    default:
      return status;
  }
};

// Função para traduzir status de pagamento
const translatePaymentStatus = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'paid':
      return 'Pago';
    case 'processing':
      return 'Processando';
    case 'failed':
      return 'Falhou';
    case 'cancelled':
      return 'Cancelado';
    case 'overdue':
      return 'Vencido';
    default:
      return status;
  }
};

export const SeasonRegistrationForm: React.FC<SeasonRegistrationFormProps> = ({
  seasonId,
  onSuccess: onSuccessProp,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [filteredStages, setFilteredStages] = useState<Stage[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<SeasonRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para filtrar etapas
  const filterStages = useCallback((allStages: Stage[], registrations: SeasonRegistration[]) => {
    const now = new Date();
    
    // Buscar inscrição do usuário na temporada atual
    const userRegistration = registrations.find(reg => reg.seasonId === season?.id);
    
    // Para temporadas por temporada, se o usuário já está inscrito, não mostrar nenhuma etapa
    if (season?.inscriptionType === 'por_temporada' && userRegistration) {
      console.log('🚫 [FRONTEND] Usuário já inscrito na temporada (por temporada), não mostrando etapas');
      return [];
    }
    
    // Para temporadas por etapa, verificar quais etapas o usuário já está inscrito
    let userRegisteredStageIds: string[] = [];
    if (season?.inscriptionType === 'por_etapa' && userRegistration && userRegistration.stages) {
      userRegisteredStageIds = userRegistration.stages.map(stage => stage.stageId);
      console.log('🔍 [FRONTEND] Usuário inscrito nas etapas:', userRegisteredStageIds);
    }
    
    // Filtrar etapas que já passaram e que o usuário já está inscrito
    const availableStages = allStages.filter(stage => {
      const stageDate = new Date(stage.date);
      const isFutureStage = stageDate > now;
      const isNotRegistered = !userRegisteredStageIds.includes(stage.id);
      
      if (!isFutureStage) {
        console.log(`🚫 [FRONTEND] Etapa "${stage.name}" já passou (${stage.date})`);
      }
      
      if (!isNotRegistered) {
        console.log(`🚫 [FRONTEND] Usuário já inscrito na etapa "${stage.name}"`);
      }
      
      return isFutureStage && isNotRegistered;
    });
    
    console.log(`✅ [FRONTEND] Etapas disponíveis após filtragem: ${availableStages.length}/${allStages.length}`);
    console.log(`📊 [FRONTEND] Resumo: ${allStages.length} total, ${userRegisteredStageIds.length} já inscrito, ${availableStages.length} disponível`);
    
    return availableStages;
  }, [season?.id, season?.inscriptionType]);

  // Carregar dados diretamente no useEffect
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('🔄 [FRONTEND] Iniciando carregamento de dados para temporada:', seasonId);
        
        // Primeiro, carregar a temporada para obter o ID real
        const seasonData = await SeasonService.getById(seasonId);
        console.log('✅ [FRONTEND] Temporada carregada:', {
          id: seasonData.id,
          name: seasonData.name,
          inscriptionType: seasonData.inscriptionType,
          registrationOpen: seasonData.registrationOpen
        });
        
        // Carregar dados em paralelo
        const [categoriesData, stagesData, userRegistrationsData] = await Promise.all([
          CategoryService.getBySeasonId(seasonData.id),
          StageService.getBySeasonId(seasonData.id),
          SeasonRegistrationService.getMyRegistrations()
        ]);
        
        console.log('✅ [FRONTEND] Dados carregados com sucesso:', {
          season: {
            id: seasonData.id,
            name: seasonData.name,
            inscriptionType: seasonData.inscriptionType,
            registrationOpen: seasonData.registrationOpen
          },
          categories: categoriesData.map(c => ({ id: c.id, name: c.name })),
          stages: stagesData.map(s => ({ id: s.id, name: s.name, date: s.date })),
          userRegistrations: userRegistrationsData.length
        });
        
        setSeason(seasonData);
        setCategories(categoriesData);
        setStages(stagesData);
        setUserRegistrations(userRegistrationsData);
        
        // Verificar se é inscrição por etapa e se há etapas
        if (seasonData.inscriptionType === 'por_etapa') {
          console.log('📋 [FRONTEND] Temporada é por etapa, etapas encontradas:', stagesData.length);
          if (stagesData.length === 0) {
            console.warn('⚠️ [FRONTEND] Temporada é por etapa mas não há etapas cadastradas!');
          }
        } else {
          console.log('📋 [FRONTEND] Temporada é por temporada');
        }
        
      } catch (err: any) {
        console.error('❌ [FRONTEND] Erro ao carregar dados:', err);
        setError(err.message || 'Erro ao carregar dados da temporada');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

  // Filtrar etapas quando os dados mudarem
  useEffect(() => {
    if (stages.length > 0) {
      const filtered = filterStages(stages, userRegistrations);
      setFilteredStages(filtered);
    }
  }, [stages, userRegistrations, filterStages]);

  const {
    isSaving,
    handleSubmit: useFormScreenSubmit,
    handleFormChange: useFormScreenChange,
  } = useFormScreen<any, CreateRegistrationData>({
    createData: (data) => SeasonRegistrationService.create(data),
    transformSubmitData: (data) => {
      console.log('🔄 [FRONTEND] transformSubmitData - Dados do formulário:', {
        categorias: data.categorias,
        etapas: data.etapas,
        pagamento: data.pagamento,
        cpf: data.cpf,
        installments: data.installments
      });
      
      const transformedData = {
        userId: user?.id || '',
        seasonId: season?.id || '',
        categoryIds: data.categorias || [],
        stageIds: data.etapas || [],
        paymentMethod: data.pagamento,
        userDocument: data.cpf,
        installments: data.installments ? parseInt(data.installments, 10) : 1,
      };
      
      console.log('📤 [FRONTEND] transformSubmitData - Dados transformados:', {
        userId: transformedData.userId,
        seasonId: transformedData.seasonId,
        categoryIds: transformedData.categoryIds,
        stageIds: transformedData.stageIds,
        paymentMethod: transformedData.paymentMethod,
        userDocument: transformedData.userDocument,
        installments: transformedData.installments
      });
      
      return transformedData;
    },
    onSuccess: (result) => {
      toast.success('Inscrição realizada com sucesso!');
      if (onSuccessProp) {
        onSuccessProp(result.registration.id);
      } else {
        navigate(`/registration/${result.registration.id}/payment`);
      }
    },
    onCancel: () => {
      if(onCancel) onCancel();
    },
    errorMessage: 'Erro ao realizar inscrição'
  });

  // Função para obter o número máximo de parcelas baseado no método de pagamento
  const getMaxInstallments = (paymentMethod: string) => {
    if (!season) return 1;
    
    switch (paymentMethod) {
      case 'pix':
        return season.pixInstallments || 1;
      case 'cartao_credito':
        return season.creditCardInstallments || 1;
      default:
        return 1;
    }
  };

  // Função para gerar opções de parcelas baseadas no método de pagamento
  const generateInstallmentOptions = (paymentMethod: string) => {
    const maxInstallments = getMaxInstallments(paymentMethod);
    
    if (maxInstallments < 1) {
      return [];
    }

    // Sempre incluir a opção 1x (à vista)
    const options = [
      {
        value: "1",
        description: `1x de ${formatCurrency(total)} (à vista)`
      }
    ];

    // Adicionar opções de 2x até o máximo permitido
    if (maxInstallments > 1) {
      for (let i = 2; i <= maxInstallments; i++) {
        const installmentValue = total / i;
        
        if (paymentMethod === 'pix') {
                        // Para PIX, explicar que é parcelamento (PIX parcelado)
          options.push({
            value: i.toString(),
            description: `${i}x de ${formatCurrency(installmentValue)}`
          });
        } else {
          options.push({
            value: i.toString(),
            description: `${i}x de ${formatCurrency(installmentValue)}`
          });
        }
      }
    }

    return options;
  };

  useEffect(() => {
    if (!season || !categories.length) return;

    console.log('🔧 [FRONTEND] Configurando formulário:', {
      seasonInscriptionType: season.inscriptionType,
      categoriesCount: categories.length,
      stagesCount: filteredStages.length,
      stages: filteredStages.map(s => ({ id: s.id, name: s.name }))
    });

    const paymentFields: any[] = [
      {
        id: "pagamento",
        name: "Método de Pagamento",
        type: "select",
        mandatory: true,
        options: season.paymentMethods.map(method => ({
          value: method,
          description: method === 'pix' ? 'PIX - Aprovação Instantânea' : 'Cartão de Crédito'
        }))
      }
    ];

    // Adicionar campo de parcelas se houver método de pagamento selecionado
    if (selectedPaymentMethod && total > 0) {
      const installmentOptions = generateInstallmentOptions(selectedPaymentMethod);
      
      if (installmentOptions.length > 0) {
        paymentFields.push({
          id: "installments",
          name: "Número de Parcelas",
          type: "select",
          mandatory: true,
          placeholder: "Selecione o número de parcelas",
          options: installmentOptions,
        });
      }
    }

    const config: FormSectionConfig[] = [
      {
        section: "Seleção de Categorias",
        detail: "Escolha as categorias que deseja participar",
        fields: [
          {
            id: "categorias",
            name: "Categorias Disponíveis",
            type: "checkbox-group",
            mandatory: true,
            options: categories.map(category => ({
              value: category.id,
              description: `${category.name} - ${formatCurrency(Number(season.inscriptionValue))} | Lastro: ${category.ballast}kg | Max. Pilotos: ${category.maxPilots} | Idade mín.: ${category.minimumAge} anos`
            }))
          }
        ]
      }
    ];

    // Adicionar seção de etapas se for inscrição por etapa
    if (season.inscriptionType === 'por_etapa' && filteredStages.length > 0) {
      console.log('✅ [FRONTEND] Adicionando seção de etapas ao formulário');
      config.push({
        section: "Seleção de Etapas",
        detail: "Escolha as etapas que deseja participar",
        fields: [
          {
            id: "etapas",
            name: "Etapas Disponíveis",
            type: "checkbox-group",
            mandatory: true,
            options: filteredStages.map(stage => ({
              value: stage.id,
              description: `${stage.name} - ${new Date(stage.date).toLocaleDateString('pt-BR')} às ${stage.time} | ${stage.kartodrome}`
            }))
          }
        ]
      });
    } else if (season.inscriptionType === 'por_etapa' && filteredStages.length === 0) {
      console.warn('⚠️ [FRONTEND] Temporada é por etapa mas não há etapas disponíveis para inscrição');
    } else {
      console.log('📋 [FRONTEND] Temporada não é por etapa, não adicionando seção de etapas');
    }

    config.push(
      {
        section: "Forma de Pagamento",
        detail: "Selecione como deseja pagar",
        fields: paymentFields,
      },
      {
        section: "Informações Pessoais",
        detail: "Dados obrigatórios para a inscrição",
        fields: [
          {
            id: "cpf",
            name: "CPF",
            type: "inputMask",
            mandatory: true,
            mask: "cpf",
            placeholder: "000.000.000-00"
          }
        ]
      }
    );

    console.log('📝 [FRONTEND] Configuração final do formulário:', {
      sectionsCount: config.length,
      sections: config.map(s => ({ section: s.section, fieldsCount: s.fields.length }))
    });

    setFormConfig(config);
  }, [season, categories, filteredStages, selectedPaymentMethod, total]);

  const calculateTotal = (selectedCategories: string[], selectedStages: string[]) => {
    if (!season || !selectedCategories.length) {
      setTotal(0);
      return;
    }
    
    let newTotal: number;
    if (season.inscriptionType === 'por_etapa' && selectedStages.length > 0) {
      // Por etapa: quantidade de categorias x quantidade de etapas x valor da inscrição
      newTotal = selectedCategories.length * selectedStages.length * Number(season.inscriptionValue);
    } else {
      // Por temporada: quantidade de categorias x valor da inscrição
      newTotal = selectedCategories.length * Number(season.inscriptionValue);
    }
    
    setTotal(newTotal);
  };

  const handleFormChange = (data: any) => {
    useFormScreenChange(data);
    
    // Atualizar método de pagamento selecionado
    if (data.pagamento !== selectedPaymentMethod) {
      setSelectedPaymentMethod(data.pagamento || '');
    }
    
    // Calcular total baseado nas categorias selecionadas
    if (data.categorias && Array.isArray(data.categorias)) {
      calculateTotal(data.categorias, data.etapas || []);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando dados da temporada...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro: {error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-blue-600 hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Temporada não encontrada</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se as inscrições estão abertas
  if (!season.registrationOpen) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{season.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-800 font-medium">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Inscrições Fechadas
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">As inscrições para esta temporada não estão abertas</h3>
              <p className="text-muted-foreground mb-4">
                Entre em contato com os organizadores para mais informações sobre quando as inscrições serão abertas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left bg-gray-50 p-4 rounded-lg">
                <div>
                  <strong>Valor por categoria:</strong> {formatCurrency(Number(season.inscriptionValue))}
                </div>
                <div>
                  <strong>Tipo de inscrição:</strong> {season.inscriptionType === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
                </div>
                <div>
                  <strong>Início:</strong> {new Date(season.startDate).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <strong>Fim:</strong> {new Date(season.endDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  className="mt-4"
                >
                  Voltar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se o usuário já está inscrito na temporada (apenas para temporadas por temporada)
  const userRegistration = userRegistrations.find(reg => reg.seasonId === season.id);
  if (season.inscriptionType === 'por_temporada' && userRegistration) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{season.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 font-medium">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Já Inscrito
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Você já está inscrito nesta temporada</h3>
              <p className="text-muted-foreground mb-4">
                Sua inscrição foi realizada com sucesso e está sendo processada.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left bg-gray-50 p-4 rounded-lg">
                <div>
                  <strong>Status da inscrição:</strong> <span className="capitalize">{translateRegistrationStatus(userRegistration.status)}</span>
                </div>
                <div>
                  <strong>Status do pagamento:</strong> <span className="capitalize">{translatePaymentStatus(userRegistration.paymentStatus)}</span>
                </div>
                <div>
                  <strong>Valor pago:</strong> {formatCurrency(userRegistration.amount)}
                </div>
                <div>
                  <strong>Data da inscrição:</strong> {new Date(userRegistration.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  className="mt-4"
                >
                  Voltar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se é inscrição por etapa mas não há etapas disponíveis
  if (season.inscriptionType === 'por_etapa' && filteredStages.length === 0 && stages.length > 0) {
    // Determinar o motivo específico
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Verificar se há etapas futuras
    const futureStages = stages.filter(stage => {
      const stageDate = new Date(stage.date);
      stageDate.setHours(0, 0, 0, 0);
      return stageDate > today;
    });
    
    // Verificar se o usuário está inscrito na temporada
    const userRegistration = userRegistrations.find(reg => reg.seasonId === season.id);
    
    let reason = '';
    let title = '';
    let description = '';
    let badgeText = '';
    let badgeColor = '';
    let badgeIcon = '';
    
    if (futureStages.length === 0) {
      // Todas as etapas já passaram
      reason = 'temporada_encerrada';
      title = 'Temporada Encerrada';
      description = 'Todas as etapas desta temporada já foram realizadas.';
      badgeText = 'Temporada Encerrada';
      badgeColor = 'bg-red-100 text-red-800';
      badgeIcon = 'M6 18L18 6M6 6l12 12';
    } else if (userRegistration) {
      // Usuário está inscrito em todas as etapas disponíveis
      reason = 'ja_inscrito_todas_etapas';
      title = 'Você já está inscrito em todas as etapas disponíveis';
      description = 'Você já se inscreveu em todas as etapas futuras desta temporada.';
      badgeText = 'Já Inscrito';
      badgeColor = 'bg-green-100 text-green-800';
      badgeIcon = 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z';
    } else {
      // Outro motivo (não deveria acontecer, mas por segurança)
      reason = 'outro';
      title = 'Não há etapas disponíveis para inscrição';
      description = 'Não foi possível determinar o motivo específico.';
      badgeText = 'Etapas Indisponíveis';
      badgeColor = 'bg-orange-100 text-orange-800';
      badgeIcon = 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z';
    }
    
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{season.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${badgeColor} font-medium`}>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d={badgeIcon} clipRule="evenodd" />
                  </svg>
                  {badgeText}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground mb-4">
                {description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left bg-gray-50 p-4 rounded-lg">
                <div>
                  <strong>Total de etapas:</strong> {stages.length}
                </div>
                <div>
                  <strong>Etapas futuras:</strong> {futureStages.length}
                </div>
                <div>
                  <strong>Etapas passadas:</strong> {stages.length - futureStages.length}
                </div>
                <div>
                  <strong>Valor por categoria:</strong> {formatCurrency(Number(season.inscriptionValue))}
                </div>
                {userRegistration && (
                  <>
                    <div>
                      <strong>Status da inscrição:</strong> <span className="capitalize">{translateRegistrationStatus(userRegistration.status)}</span>
                    </div>
                    <div>
                      <strong>Status do pagamento:</strong> <span className="capitalize">{translatePaymentStatus(userRegistration.paymentStatus)}</span>
                    </div>
                  </>
                )}
              </div>
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  className="mt-4"
                >
                  Voltar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>{season.name}</span>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Inscrições Abertas
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Valor por categoria:</strong> {formatCurrency(Number(season.inscriptionValue))}
            </div>
            <div>
              <strong>Tipo:</strong> {season.inscriptionType === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
            </div>
            <div>
              <strong>Total calculado:</strong> <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Informações sobre parcelamento */}
          {season.inscriptionType === 'por_temporada' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Condições de Pagamento:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                {season.paymentMethods.includes('pix') && (
                  <div>
                    <strong>PIX:</strong> até {season.pixInstallments || 1}x
                  </div>
                )}
                {season.paymentMethods.includes('cartao_credito') && (
                  <div>
                    <strong>Cartão:</strong> até {season.creditCardInstallments || 1}x
                  </div>
                )}
              </div>
              
              {/* Explicação sobre PIX parcelado */}
              {selectedPaymentMethod === 'pix' && (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                  <div className="text-xs text-yellow-800">
                    <strong>PIX Parcelado:</strong> A 1ª parcela será via PIX (pagamento imediato). 
                    As demais parcelas serão PIX enviados automaticamente por email nas datas de vencimento.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DynamicForm
        config={formConfig}
        onSubmit={useFormScreenSubmit}
        onChange={handleFormChange}
        onCancel={onCancel}
        submitLabel={isSaving ? "Finalizando..." : "Finalizar Inscrição"}
        cancelLabel="Cancelar"
        showButtons={true}
        initialValues={{
          categorias: [],
          pagamento: '',
          cpf: '',
          installments: '1',
        }}
      />
    </div>
  );
}; 