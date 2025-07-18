import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Checkbox } from 'brk-design-system';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DynamicForm, FormSectionConfig } from '@/components/ui/dynamic-form';
import { SeasonService, Season } from '@/lib/services/season.service';
import { CategoryService, Category } from '@/lib/services/category.service';
import { StageService, Stage } from '@/lib/services/stage.service';
import { SeasonRegistrationService, CreateRegistrationData, SeasonRegistration } from '@/lib/services/season-registration.service';
import { ChampionshipService, Championship } from '@/lib/services/championship.service';
import { CreditCardFeesService, CreditCardFeesRate } from '@/lib/services/credit-card-fees.service';
import { formatCurrency } from '@/utils/currency';
import { masks } from '@/utils/masks';
import { useFormScreen } from '@/hooks/use-form-screen';
import { useExternalNavigation } from '@/hooks/use-external-navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRegistrations } from '@/hooks/use-user-registrations';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "brk-design-system";
import { PageLoader } from '@/components/ui/loading';

interface SeasonRegistrationFormProps {
  seasonId: string;
  selectedCondition?: 'por_temporada' | 'por_etapa';
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

// Componente para exibir categoria com badges
const CategoryOptionBadge = React.forwardRef<HTMLDivElement, {
  category: Category;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  registrationCount?: number;
}>(({ category, checked, onChange, disabled, registrationCount = 0 }, ref) => {
  const availableSlots = category.maxPilots - registrationCount;
  const isFull = availableSlots <= 0;
  const isDisabled = disabled || isFull;
  
  return (
    <div 
      ref={ref}
      className={`flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 border rounded-lg transition-colors ${
        checked ? 'border-primary bg-primary/5' : 
        isFull ? 'border-red-200 bg-red-50' : 
        'border-gray-200 hover:bg-gray-50'
      }`}>
      <div className="flex items-center space-x-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          disabled={isDisabled}
          className="mt-0.5"
        />
        <span className={`font-medium text-sm ${isFull ? 'text-red-600' : ''}`}>
          {category.name}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 sm:ml-6">
        <Badge variant="default" className="text-xs">{category.ballast}kg</Badge>
        <Badge variant="default" className="text-xs">{category.minimumAge} anos</Badge>
        <Badge 
          variant={isFull ? "destructive" : availableSlots <= 2 ? "secondary" : "outline"} 
          className="text-xs"
        >
          {isFull ? 'Lotada' : `${availableSlots} vaga${availableSlots !== 1 ? 's' : ''} disponível${availableSlots !== 1 ? 'is' : ''}`}
        </Badge>
      </div>
    </div>
  );
});

CategoryOptionBadge.displayName = 'CategoryOptionBadge';

// Componente para exibir etapa com badges
const StageOptionBadge = React.forwardRef<HTMLDivElement, {
  stage: Stage;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}>(({ stage, checked, onChange, disabled }, ref) => (
  <div 
    ref={ref}
    className={`flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors ${checked ? 'border-primary' : 'border-gray-200'}`}>
    <div className="flex items-center space-x-3">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="font-medium text-sm">{stage.name}</span>
    </div>
    <div className="flex flex-wrap gap-2 sm:ml-6">
      <Badge variant="default" className="text-xs">
        {new Date(stage.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
      </Badge>
      <Badge variant="default" className="text-xs">{stage.time}</Badge>
    </div>
  </div>
));

StageOptionBadge.displayName = 'StageOptionBadge';

// Componente para seleção de categorias
const CategorySelectionComponent = React.forwardRef<HTMLDivElement, {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  categories: any[];
  categoryRegistrationCounts: Record<string, number>;
}>(({ value = [], onChange, disabled, categories, categoryRegistrationCounts }, ref) => {
  const safeValue = Array.isArray(value) ? value : [];
  return (
    <div ref={ref} className="space-y-2">
      {categories.map(category => (
        <CategoryOptionBadge
          key={category.id}
          category={category}
          checked={safeValue.includes(category.id)}
          onChange={checked => {
            const newValue = checked
              ? [...safeValue, category.id]
              : safeValue.filter((v: string) => v !== category.id);
            onChange(newValue);
          }}
          disabled={disabled}
          registrationCount={categoryRegistrationCounts[category.id] || 0}
        />
      ))}
    </div>
  );
});

CategorySelectionComponent.displayName = 'CategorySelectionComponent';

// Componente para seleção de etapas
const StageSelectionComponent = React.forwardRef<HTMLDivElement, {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  stages: any[];
}>(({ value = [], onChange, disabled, stages }, ref) => {
  const safeValue = Array.isArray(value) ? value : [];
  return (
    <div ref={ref} className="space-y-2">
      {stages.map(stage => (
        <StageOptionBadge
          key={stage.id}
          stage={stage}
          checked={safeValue.includes(stage.id)}
          onChange={checked => {
            const newValue = checked
              ? [...safeValue, stage.id]
              : safeValue.filter((v: string) => v !== stage.id);
            onChange(newValue);
          }}
          disabled={disabled}
        />
      ))}
    </div>
  );
});

StageSelectionComponent.displayName = 'StageSelectionComponent';

export const SeasonRegistrationForm: React.FC<SeasonRegistrationFormProps> = ({
  seasonId,
  selectedCondition,
  onSuccess: onSuccessProp,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Remover dependência do contexto - buscar dados diretamente do backend

  const [season, setSeason] = useState<Season | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [filteredStages, setFilteredStages] = useState<Stage[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<SeasonRegistration[]>([]);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [total, setTotal] = useState(0);
  const [totalWithFees, setTotalWithFees] = useState(0);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileTooltip, setShowMobileTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [categoryRegistrationCounts, setCategoryRegistrationCounts] = useState<Record<string, number>>({});
  const creditCardFeesService = new CreditCardFeesService();
  const [feeRates, setFeeRates] = useState<Record<number, CreditCardFeesRate>>({});
  const [loadingFees, setLoadingFees] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Função para mostrar tooltip no mobile
  const handleMobileTooltipClick = () => {
    setShowMobileTooltip(true);
    
    // Esconder após 5 segundos
    setTimeout(() => {
      setShowMobileTooltip(false);
    }, 5000);
  };

  // Determinar o tipo de inscrição baseado na condição selecionada
  const inscriptionType = selectedCondition || (season ? SeasonService.getInscriptionType(season) : 'por_temporada');
  
  // Função para filtrar etapas
  const filterStages = useCallback((allStages: Stage[], registrations: SeasonRegistration[]) => {
    const now = new Date();
    
    // Buscar inscrição do usuário na temporada atual
    const userRegistration = registrations.find(reg => reg.seasonId === season?.id);
    
    // Para temporadas por temporada, se o usuário já está inscrito, não mostrar nenhuma etapa
    if (inscriptionType === 'por_temporada' && userRegistration) {
      return [];
    }
    
    // Para temporadas por etapa, verificar quais etapas o usuário já está inscrito
    let userRegisteredStageIds: string[] = [];
    if (inscriptionType === 'por_etapa' && userRegistration && userRegistration.stages) {
      userRegisteredStageIds = userRegistration.stages.map(stage => stage.stageId);
    }
    
    // Filtrar etapas que já passaram e que o usuário já está inscrito
    const availableStages = allStages.filter(stage => {
      const stageDate = new Date(stage.date);
      const isFutureStage = stageDate > now;
      const isNotRegistered = !userRegisteredStageIds.includes(stage.id);
      
      return isFutureStage && isNotRegistered;
    });
    
    return availableStages;
  }, [season?.id, inscriptionType]);

  // Função para carregar dados
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Buscar todos os dados diretamente do backend
      const seasonData = await SeasonService.getById(seasonId);
      
      // Usar o ID real da temporada para buscar etapas e categorias
      const realSeasonId = seasonData.id;
      
      const [categoriesData, stagesData, userRegistrationsData, championshipData] = await Promise.all([
        CategoryService.getBySeasonId(realSeasonId),
        StageService.getBySeasonId(realSeasonId),
        SeasonRegistrationService.getMyRegistrations(),
        ChampionshipService.getPublicById(seasonData.championshipId)
      ]);
      
      setSeason(seasonData);
      setCategories(categoriesData);
      setStages(stagesData);
      setUserRegistrations(userRegistrationsData);
      setChampionship(championshipData);
      
      // Buscar contagens de pilotos por categoria
      const counts: Record<string, number> = {};
      await Promise.all(
        categoriesData.map(async (category: Category) => {
          try {
            const count = await SeasonRegistrationService.getCategoryRegistrationCount(category.id);
            counts[category.id] = count;
          } catch (error) {
            console.error(`Erro ao buscar contagem para categoria ${category.id}:`, error);
            counts[category.id] = 0;
          }
        })
      );
      setCategoryRegistrationCounts(counts);
      
      // Verificar se é inscrição por etapa e se há etapas
      if (seasonData.inscriptionType === 'por_etapa') {
        if (stagesData.length === 0) {
          console.warn('⚠️ [FRONTEND] Temporada é por etapa mas não há etapas cadastradas!');
        }
      }
      
    } catch (err: any) {
      console.error('❌ [FRONTEND] Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados da temporada');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar taxas configuráveis
  const fetchFeeRates = async (championshipId: string) => {
    setLoadingFees(true);
    try {
      const rates: Record<number, CreditCardFeesRate> = {};
      
      // Buscar taxas para diferentes números de parcelas (1, 2-6, 7-12, 13-21)
      const installmentsToCheck = [1, 2, 7, 13];
      
      await Promise.all(
        installmentsToCheck.map(async (installments) => {
          try {
            const rate = await creditCardFeesService.getRateForInstallments(championshipId, installments);
            rates[installments] = rate;
          } catch (error) {
            console.error(`Erro ao buscar taxa para ${installments} parcelas:`, error);
            // Usar taxa padrão como fallback
            rates[installments] = {
              percentageRate: 3.29, // Default para 3.29%
              fixedFee: 0.49,
              isDefault: true
            };
          }
        })
      );
      
      setFeeRates(rates);
    } catch (error) {
      console.error('Erro ao buscar taxas configuráveis:', error);
    } finally {
      setLoadingFees(false);
    }
  };

  // Carregar dados diretamente no useEffect
  useEffect(() => {
    fetchData();
  }, [seasonId]);

  // Buscar taxas quando o campeonato for carregado
  useEffect(() => {
    if (championship?.id) {
      fetchFeeRates(championship.id);
    }
  }, [championship?.id]);

  // Filtrar etapas quando os dados mudarem
  useEffect(() => {
    if (stages.length > 0) {
      const filtered = filterStages(stages, userRegistrations);
      setFilteredStages(filtered);
    }
  }, [stages, userRegistrations, filterStages]);

  // Calcular total com taxas quando método de pagamento ou parcelamento mudar
  useEffect(() => {
    if (selectedPaymentMethod === 'cartao_credito') {
      const totalWithConfigurableFees = calculateTotalWithConfigurableFees(total, selectedPaymentMethod, selectedInstallments);
      setTotalWithFees(totalWithConfigurableFees);
    } else {
      setTotalWithFees(total);
    }
  }, [total, selectedPaymentMethod, selectedInstallments, feeRates]);

  // Recalcular total com taxas quando necessário
  const getCurrentTotalWithFees = useCallback(() => {
    if (selectedPaymentMethod === 'cartao_credito') {
      return calculateTotalWithConfigurableFees(total, selectedPaymentMethod, selectedInstallments);
    }
    return total;
  }, [total, selectedPaymentMethod, selectedInstallments, feeRates]);

  const {
    isSaving,
    handleSubmit: useFormScreenSubmit,
    handleFormChange: useFormScreenChange,
    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
    hasUnsavedChanges,
  } = useFormScreen<any, CreateRegistrationData>({
    createData: (data) => SeasonRegistrationService.create(data),
    transformSubmitData: (data) => {
      const installmentsCount = data.installments ? parseInt(data.installments, 10) : 1;
      
      // Calcular o total com taxas no momento da submissão
      const finalTotal = getCurrentTotalWithFees();
      

      
      const transformedData = {
        userId: user?.id || '',
        seasonId: season?.id || '',
        categoryIds: data.categorias || [],
        stageIds: data.etapas || [],
        paymentMethod: data.pagamento,
        userDocument: data.cpf,
        installments: installmentsCount,
        totalAmount: finalTotal, // Enviar o total correto incluindo taxas
      };
      
      return transformedData;
    },
    onSuccess: (result) => {
      setProcessing(false);
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

  // Hook para navegação externa com verificação de alterações não salvas
  const { navigateToExternal, confirmAndNavigate } = useExternalNavigation({
    hasUnsavedChanges,
    isSaving,
    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
  });

  // Expor a função de navegação externa globalmente para os layouts
  React.useEffect(() => {
    (window as any).navigateToExternal = navigateToExternal;
    return () => {
      delete (window as any).navigateToExternal;
    };
  }, [navigateToExternal]);

  // Função para obter o número máximo de parcelas baseado no método de pagamento
  const getMaxInstallments = (paymentMethod: string) => {
    if (!season) return 1;
    
    switch (paymentMethod) {
      case 'pix':
        return SeasonService.getPixInstallmentsForCondition(season, inscriptionType);
      case 'cartao_credito':
        return SeasonService.getCreditCardInstallmentsForCondition(season, inscriptionType);
      default:
        return 1;
    }
  };

  // Função para obter taxa configurável ou padrão
  const getConfigurableRate = (installments: number) => {
    // Determinar qual taxa usar baseado no número de parcelas
    let rateKey = 1; // padrão à vista
    if (installments >= 2 && installments <= 6) {
      rateKey = 2;
    } else if (installments >= 7 && installments <= 12) {
      rateKey = 7;
    } else if (installments >= 13 && installments <= 21) {
      rateKey = 13;
    }
    const configurableRate = feeRates[rateKey];
    if (configurableRate && !configurableRate.isDefault) {
      return configurableRate;
    }
    // Se não houver taxa configurada, lançar erro
    throw new Error('Taxa de cartão de crédito não configurada para este campeonato e número de parcelas. Solicite ao administrador que configure as taxas no painel.');
  };

  // Função para calcular o valor total com taxas configuráveis
  const calculateTotalWithConfigurableFees = (baseTotal: number, paymentMethod: string, installments: number) => {
    if (paymentMethod !== 'cartao_credito') {
      return baseTotal;
    }
    try {
      const rate = getConfigurableRate(installments);
      // Calcular taxa percentual
      const percentageFee = baseTotal * (rate.percentageRate / 100);
      // Total com taxas
      return baseTotal + percentageFee + rate.fixedFee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular taxa de cartão de crédito.');
      return baseTotal;
    }
  };

  // Função para gerar opções de parcelas baseadas no método de pagamento
  const generateInstallmentOptions = (paymentMethod: string) => {
    const maxInstallments = getMaxInstallments(paymentMethod);
    if (maxInstallments < 1) {
      return [];
    }
    const options = [];
    for (let i = 1; i <= maxInstallments; i++) {
      if (paymentMethod === 'pix') {
        const installmentValue = total / i;
        options.push({
          value: i.toString(),
          description: i === 1 ? `1x de ${formatCurrency(installmentValue)} (à vista)` : `${i}x de ${formatCurrency(installmentValue)}`
        });
      } else if (paymentMethod === 'cartao_credito') {
        try {
          const totalWithFees = calculateTotalWithConfigurableFees(total, paymentMethod, i);
          const installmentValue = totalWithFees / i;
          const rate = getConfigurableRate(i);
          options.push({
            value: i.toString(),
            description: i === 1 ? 
              `1x de ${formatCurrency(installmentValue)} (à vista - taxa ${rate.percentageRate}% + R$ ${Number(rate.fixedFee || 0).toFixed(2)})` :
              `${i}x de ${formatCurrency(installmentValue)} (taxa ${rate.percentageRate}% + R$ ${Number(rate.fixedFee || 0).toFixed(2)})`
          });
        } catch (err) {
          // Não adiciona opção se não houver taxa configurada
        }
      }
    }
    return options;
  };

  useEffect(() => {
    if (!season || !categories.length) return;

    // Verificar se há métodos de pagamento válidos
    const availablePaymentMethods = SeasonService.getPaymentMethodsForCondition(season, inscriptionType);
    if (availablePaymentMethods.length === 0) {
      console.error('⚠️ [FRONTEND] Temporada sem métodos de pagamento válidos');
      setError('Esta temporada não possui métodos de pagamento configurados. Entre em contato com os organizadores.');
      return;
    }

    const paymentFields: any[] = [
      {
        id: "pagamento",
        name: "Método de Pagamento",
        type: "select",
        mandatory: true,
        options: availablePaymentMethods.map(method => ({
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
            type: "custom",
            mandatory: true,
            customComponent: (() => {
              const Component = React.forwardRef<HTMLDivElement, {
                value?: string[];
                onChange: (value: string[]) => void;
                disabled?: boolean;
              }>((props, ref) => (
                <CategorySelectionComponent
                  {...props}
                  ref={ref}
                  categories={categories}
                  categoryRegistrationCounts={categoryRegistrationCounts}
                />
              ));
              Component.displayName = 'CategorySelectionWrapper';
              return Component;
            })()
          }
        ]
      }
    ];
    
    // Adicionar seção de etapas se for inscrição por etapa
    if (inscriptionType === 'por_etapa' && filteredStages.length > 0) {
      config.push({
        section: "Seleção de Etapas",
        detail: "Escolha as etapas que deseja participar",
        fields: [
          {
            id: "etapas",
            name: "Etapas Disponíveis",
            type: "custom",
            mandatory: true,
            customComponent: (() => {
              const Component = React.forwardRef<HTMLDivElement, {
                value?: string[];
                onChange: (value: string[]) => void;
                disabled?: boolean;
              }>((props, ref) => (
                <StageSelectionComponent
                  {...props}
                  ref={ref}
                  stages={filteredStages}
                />
              ));
              Component.displayName = 'StageSelectionWrapper';
              return Component;
            })()
          }
        ]
      });
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

    setFormConfig(config);
  }, [season, categories, filteredStages, selectedPaymentMethod, total, categoryRegistrationCounts]);

  // Função para obter o valor da inscrição baseado na condição selecionada
  const getInscriptionValue = () => {
    if (!season) return 0;
    
    if (selectedCondition && season.paymentConditions) {
      const condition = season.paymentConditions.find(c => c.type === selectedCondition && c.enabled);
      return condition ? condition.value : SeasonService.getInscriptionValue(season);
    }
    return SeasonService.getInscriptionValue(season);
  };
  
  const calculateTotal = (selectedCategories: string[], selectedStages: string[]) => {
    if (!season || !selectedCategories.length) {
      setTotal(0);
      return;
    }
    
    let newTotal: number;
    
    const inscriptionValue = getInscriptionValue();
    
    if (inscriptionType === 'por_etapa' && selectedStages.length > 0) {
      // Por etapa: quantidade de categorias x quantidade de etapas x valor da inscrição
      newTotal = selectedCategories.length * selectedStages.length * inscriptionValue;
    } else {
      // Por temporada: quantidade de categorias x valor da inscrição
      newTotal = selectedCategories.length * inscriptionValue;
    }
    
    // Aplicar comissão da plataforma se ela deve ser cobrada do piloto
    if (championship && !championship.commissionAbsorbedByChampionship) {
      const platformCommission = Number(championship.platformCommissionPercentage) || 10;
      const commissionAmount = newTotal * (platformCommission / 100);
      newTotal += commissionAmount;
    }
    
    setTotal(newTotal);
  };

  const handleFormChange = (data: any) => {
    useFormScreenChange(data);
    
    // Atualizar método de pagamento selecionado
    if (data.pagamento !== selectedPaymentMethod) {
      setSelectedPaymentMethod(data.pagamento || '');
    }
    
    // Atualizar parcelamento selecionado
    if (data.installments) {
      const installmentsCount = parseInt(data.installments, 10);
      setSelectedInstallments(installmentsCount);
    }
    
    // Calcular total baseado nas categorias selecionadas
    if (data.categorias && Array.isArray(data.categorias)) {
      calculateTotal(data.categorias, data.etapas || []);
    }
  };

  // Função para lidar com o submit do formulário
  const handleFormSubmit = async (data: any) => {
    // Ativar o loading imediatamente - o DynamicForm já valida internamente
    setProcessing(true);
    try {
      await useFormScreenSubmit(data);
    } catch (error) {
      setProcessing(false);
      throw error;
    }
  };

  if (isLoading) {
    return <PageLoader message="Carregando dados da temporada..." />;
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro: {error}</p>
              <button 
                onClick={fetchData}
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
                  <strong>Valor por categoria:</strong> {formatCurrency(getInscriptionValue())}
                </div>
                <div>
                  <strong>Tipo de inscrição:</strong> {inscriptionType === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
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
  if (inscriptionType === 'por_temporada' && userRegistration) {
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
      if (inscriptionType === 'por_etapa' && filteredStages.length === 0 && stages.length > 0) {
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
                  <strong>Valor por categoria:</strong> {formatCurrency(getInscriptionValue())}
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
    <>
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
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Valor por categoria: <span className="font-medium text-gray-900">{formatCurrency(getInscriptionValue())}</span></span>
                <span className="text-gray-600">Tipo: <span className="font-medium text-gray-900">{inscriptionType === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}</span></span>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Total da Inscrição</span>
                    {selectedPaymentMethod === 'cartao_credito' && (
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Taxas da operadora incluídas</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {selectedPaymentMethod === 'cartao_credito' ? formatCurrency(totalWithFees) : formatCurrency(total)}
                    </div>
                    {championship && !championship.commissionAbsorbedByChampionship && (
                      <div className="text-xs text-gray-500">
                        Serviço da plataforma {Math.round(championship.platformCommissionPercentage || 10)}% incluído
                      </div>
                    )}
                  </div>
                </div>
                

              </div>
            
            {/* Informações sobre parcelamento e taxas */}
            {inscriptionType === 'por_temporada' && (
              <div className="mt-4 space-y-3">


                {/* Condições de Pagamento */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Condições de Pagamento:</span>
                    <div className="flex space-x-3">
                      {SeasonService.getPaymentMethodsForCondition(season, inscriptionType).includes('pix') && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">PIX até {SeasonService.getPixInstallmentsForCondition(season, inscriptionType)}x</span>
                      )}
                      {SeasonService.getPaymentMethodsForCondition(season, inscriptionType).includes('cartao_credito') && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Cartão até {SeasonService.getCreditCardInstallmentsForCondition(season, inscriptionType)}x</span>
                      )}
                    </div>
                  </div>
                </div>




              </div>
            )}
          </CardContent>
        </Card>

        {formConfig.length > 0 ? (
          <DynamicForm
            config={formConfig}
            onSubmit={handleFormSubmit}
            onChange={handleFormChange}
            onCancel={processing ? undefined : onCancel}
            submitLabel={processing ? "Finalizando..." : "Finalizar Inscrição"}
            cancelLabel="Cancelar"
            showButtons={!processing}
            initialValues={{
              categorias: [],
              pagamento: '',
              cpf: '',
              installments: '1',
            }}
          />
        ) : (
          <div className="text-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">Carregando formulário...</p>
            <p className="text-sm text-gray-500 mt-2">formConfig.length: {formConfig.length}</p>
          </div>
        )}

        {/* Dialog de confirmação de alterações não salvas */}
        <Dialog
          open={showUnsavedChangesDialog}
          onOpenChange={handleCancelUnsavedChanges}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inscrição em andamento</DialogTitle>
              <DialogDescription>
                Você tem uma inscrição em andamento. Tem certeza que deseja sair sem finalizar a inscrição?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelUnsavedChanges}>
                Continuar inscrição
              </Button>
              <Button variant="destructive" onClick={() => {
                handleConfirmUnsavedChanges();
                confirmAndNavigate();
              }}>
                Deixar inscrição para mais tarde
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Processando Inscrição</h3>
            <p className="text-gray-600 mb-4">
              Sua inscrição está sendo processada. Por favor, aguarde e não feche esta tela.
            </p>
            <div className="text-sm text-gray-500">
              Este processo pode levar alguns segundos...
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 