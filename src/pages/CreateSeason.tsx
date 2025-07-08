import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SeasonService, SeasonData, PaymentCondition } from '../lib/services/season.service';
import { ChampionshipService } from '../lib/services/championship.service';
import { formatDateForDisplay, formatDateToISO, formatCurrency } from '../utils/date';
import { useChampionship } from '../hooks/use-championship';
import { PaymentConditions } from '../components/ui/payment-conditions';
import { Button } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';

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
  const { championshipId, seasonId } = useParams<{ championshipId: string; seasonId?: string }>();
  const { championship } = useChampionship(championshipId!);
  const isEditMode = seasonId !== 'new' && seasonId !== undefined;
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "agendado",
    registrationOpen: true,
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados da temporada se estiver editando
  useEffect(() => {
    if (isEditMode && seasonId) {
      setIsLoading(true);
      SeasonService.getById(seasonId)
        .then((season) => {
          // Converter paymentConditions para formato do formulário
          let paymentConditionsData: FormPaymentCondition[] = [];
          if (season.paymentConditions && season.paymentConditions.length > 0) {
            paymentConditionsData = season.paymentConditions.map(condition => ({
              type: condition.type,
              value: condition.value,
              description: condition.description || '',
              enabled: condition.enabled,
              paymentMethods: condition.paymentMethods || [],
              pixInstallments: condition.pixInstallments || 1,
              creditCardInstallments: condition.creditCardInstallments || 1
            }));
          } else {
            // Usar campos legados para compatibilidade
            if (season.inscriptionType && season.inscriptionValue) {
              paymentConditionsData = [{
                type: season.inscriptionType,
                value: parseFloat(season.inscriptionValue?.toString() || '0'),
                description: season.inscriptionType === 'por_temporada' ? 'Pagamento por temporada' : 'Pagamento por etapa',
                enabled: true,
                paymentMethods: season.paymentMethods || [],
                pixInstallments: season.pixInstallments || 1,
                creditCardInstallments: season.creditCardInstallments || 1
              }];
            }
          }

          setFormData({
            name: season.name,
            description: season.description,
            startDate: formatDateForDisplay(season.startDate),
            endDate: formatDateForDisplay(season.endDate),
            status: season.status,
            registrationOpen: season.registrationOpen !== undefined ? season.registrationOpen : true,
            paymentConditions: paymentConditionsData
          });
        })
        .catch((err) => {
          setError('Erro ao carregar temporada: ' + err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isEditMode, seasonId]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentConditionsChange = (conditions: PaymentCondition[]) => {
    const formConditions: FormPaymentCondition[] = conditions.map(condition => ({
      type: condition.type,
      value: condition.value,
      description: condition.description || '',
      enabled: condition.enabled,
      paymentMethods: condition.paymentMethods || [],
      pixInstallments: condition.pixInstallments || 1,
      creditCardInstallments: condition.creditCardInstallments || 1
    }));
    
    setFormData(prev => ({
      ...prev,
      paymentConditions: formConditions
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome da temporada é obrigatório');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Descrição da temporada é obrigatória');
      return false;
    }
    if (!formData.startDate) {
      setError('Data de início é obrigatória');
      return false;
    }
    if (!formData.endDate) {
      setError('Data de fim é obrigatória');
      return false;
    }
    if (formData.paymentConditions.filter(c => c.enabled).length === 0) {
      setError('Pelo menos uma condição de pagamento deve estar ativa');
      return false;
    }
    
    // Validar se cada condição ativa tem pelo menos um método de pagamento
    const activeConditions = formData.paymentConditions.filter(c => c.enabled);
    for (const condition of activeConditions) {
      if (condition.paymentMethods.length === 0) {
        setError(`A condição "${condition.type === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}" deve ter pelo menos um método de pagamento`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      const submitData: SeasonData = {
        name: formData.name,
        description: formData.description,
        startDate: formatDateToISO(formData.startDate) || '',
        endDate: formatDateToISO(formData.endDate) || '',
        status: formData.status,
        registrationOpen: formData.registrationOpen,
        paymentConditions: formData.paymentConditions.filter(condition => condition.enabled),
        paymentMethods: [], // Campo legado - será removido
        championshipId: championshipId!,
        pixInstallments: 1, // Campo legado - será removido
        creditCardInstallments: 1 // Campo legado - será removido
      };

      if (isEditMode && seasonId) {
        await SeasonService.update(seasonId, submitData);
      } else {
        await SeasonService.create(submitData);
      }

      navigate(`/championship/${championshipId}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar temporada');
    } finally {
      setIsSaving(false);
    }
  };

  const onCancel = useCallback(() => {
    navigate(`/championship/${championshipId}`);
  }, [navigate, championshipId]);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando temporada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{isEditMode ? "Editar Temporada" : "Criar Temporada"}</h1>
          <p className="text-muted-foreground mt-2">
            Configure as informações da temporada e as condições de pagamento
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {/* Seção de Dados Gerais */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Dados Gerais</h2>
            <p className="text-sm text-muted-foreground mb-4">Informações básicas da temporada</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome da temporada *</label>
                <input
                  type="text"
                  maxLength={75}
                  placeholder="Ex: Temporada 2024/1"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status *</label>
                <select 
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as FormData['status'])}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data de início *</label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data de fim *</label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Inscrições abertas *</label>
                <select 
                  value={formData.registrationOpen.toString()}
                  onChange={(e) => handleInputChange('registrationOpen', e.target.value === 'true')}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Descrição da temporada *</label>
              <textarea
                maxLength={1000}
                placeholder="Descrição detalhada da temporada, regulamento, categorias, etc."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          {/* Seção de Condições de Pagamento */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Condições de Pagamento</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configure as condições de pagamento disponíveis. Cada condição pode ter métodos de pagamento específicos.
            </p>
            
            <PaymentConditions
              value={formData.paymentConditions}
              onChange={handlePaymentConditionsChange}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? "Salvando..." : "Criando..."}
                </>
              ) : (
                isEditMode ? "Salvar Alterações" : "Criar Temporada"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSeason; 