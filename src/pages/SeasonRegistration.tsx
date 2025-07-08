import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeasonRegistrationForm } from '@/components/season/SeasonRegistrationForm';
import { SeasonService, Season, PaymentCondition } from '@/lib/services/season.service';
import { SeasonRegistrationService, SeasonRegistration as UserRegistration } from '@/lib/services/season-registration.service';
import { Card, CardContent, CardHeader, CardTitle, Button } from 'brk-design-system';
import { formatCurrency } from '@/utils/currency';
import { PageLoader } from '@/components/ui/loading';
import { useAuth } from '@/contexts/AuthContext';

export const SeasonRegistration: React.FC = () => {
  const { seasonId, seasonSlug, conditionType } = useParams<{ 
    seasonId?: string; 
    seasonSlug?: string; 
    conditionType?: 'por_temporada' | 'por_etapa';
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [season, setSeason] = useState<Season | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<'por_temporada' | 'por_etapa' | null>(null);

  // Determina o identificador da temporada
  const seasonIdentifier = seasonSlug || seasonId;

  useEffect(() => {
    const fetchData = async () => {
      if (!seasonIdentifier) return;

      try {
        setLoading(true);
        setError(null);
        
        // Buscar temporada e inscrições do usuário em paralelo
        const [seasonData, userRegistrationsData] = await Promise.all([
          SeasonService.getById(seasonIdentifier),
          user ? SeasonRegistrationService.getMyRegistrations() : Promise.resolve([])
        ]);
        
        setSeason(seasonData);
        setUserRegistrations(userRegistrationsData);

        // Verificar se o usuário já tem inscrição nesta temporada
        const existingRegistration = userRegistrationsData.find(reg => reg.seasonId === seasonData.id);
        
        // Obter condições de pagamento ativas
        const activeConditions = seasonData.paymentConditions?.filter(c => c.enabled) || [];
        
        if (existingRegistration) {
          // Se o usuário já está inscrito, determinar o tipo baseado na inscrição existente
          const hasStages = existingRegistration.stages && existingRegistration.stages.length > 0;
          const registrationType = hasStages ? 'por_etapa' : 'por_temporada';
          
          // Filtrar apenas condições compatíveis com o tipo de inscrição existente
          const compatibleConditions = activeConditions.filter(c => c.type === registrationType);
          
          if (compatibleConditions.length > 0) {
            setSelectedCondition(registrationType);
          }
        } else {
          // Se não está inscrito, usar lógica normal
          if (activeConditions.length === 1) {
            setSelectedCondition(activeConditions[0].type);
          } else if (conditionType && activeConditions.some(c => c.type === conditionType)) {
            setSelectedCondition(conditionType);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados da temporada');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonIdentifier, user]);

  if (!seasonIdentifier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">
            {seasonSlug 
              ? 'Slug da temporada não fornecido na URL. Use: /registration/{seasonSlug}'
              : 'ID da temporada não fornecido'
            }
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageLoader message="Carregando dados da temporada..." />;
  }

  if (error || !season) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">
            {error || 'Temporada não encontrada'}
          </p>
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="mt-4"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Verificar se o usuário já tem inscrição nesta temporada
  const existingRegistration = userRegistrations.find(reg => reg.seasonId === season.id);
  
  // Obter condições de pagamento ativas
  let activeConditions = season.paymentConditions?.filter(c => c.enabled) || [];
  
  // Se o usuário já está inscrito, filtrar apenas condições compatíveis
  if (existingRegistration) {
    const hasStages = existingRegistration.stages && existingRegistration.stages.length > 0;
    const registrationType = hasStages ? 'por_etapa' : 'por_temporada';
    
    // Filtrar apenas condições compatíveis com o tipo de inscrição existente
    activeConditions = activeConditions.filter(c => c.type === registrationType);
    
    // Se não há condições compatíveis, mostrar mensagem específica
    if (activeConditions.length === 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Inscrição Incompatível</h1>
            <p className="text-muted-foreground">
              Você já está inscrito nesta temporada com o tipo "{registrationType === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}", 
              mas não há condições de pagamento ativas para este tipo.
            </p>
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="mt-4"
            >
              Voltar
            </Button>
          </div>
        </div>
      );
    }
  }

  // Se não há condições ativas, mostrar erro
  if (activeConditions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Inscrições Indisponíveis</h1>
          <p className="text-muted-foreground">
            Esta temporada não possui condições de pagamento configuradas.
          </p>
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="mt-4"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Se há apenas uma condição ou se uma condição específica foi selecionada, ir direto para o formulário
  if (activeConditions.length === 1 || selectedCondition) {
    return (
      <div className="min-h-screen bg-background">
        <SeasonRegistrationForm
          seasonId={seasonIdentifier}
          selectedCondition={selectedCondition || activeConditions[0].type}
          onCancel={() => navigate(-1)}
        />
      </div>
    );
  }

  // Se há múltiplas condições, mostrar seleção
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{season.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {existingRegistration && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Você já está inscrito nesta temporada
                  </h3>
                  <p className="text-blue-700">
                    Como você já está inscrito com o tipo "{existingRegistration.stages && existingRegistration.stages.length > 0 ? 'Por Etapa' : 'Por Temporada'}", 
                    apenas opções compatíveis estão disponíveis.
                  </p>
                </div>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-2">
                {existingRegistration ? 'Adicionar mais inscrições' : 'Escolha o tipo de inscrição'}
              </h2>
              <p className="text-muted-foreground">
                {existingRegistration 
                  ? 'Selecione as opções adicionais que deseja adicionar à sua inscrição'
                  : 'Selecione como você deseja se inscrever nesta temporada'
                }
              </p>
            </div>

            <div className={`grid gap-6 ${activeConditions.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
              {activeConditions.map((condition) => (
                <div
                  key={condition.type}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCondition === condition.type
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCondition(condition.type)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">
                      {condition.type === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
                    </h3>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedCondition === condition.type
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {selectedCondition === condition.type && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valor:</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(condition.value)}
                      </span>
                    </div>

                    {condition.description && (
                      <div className="text-sm text-gray-600">
                        {condition.description}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Métodos de pagamento:</div>
                      <div className="flex flex-wrap gap-2">
                        {condition.paymentMethods.map((method) => (
                          <span
                            key={method}
                            className={`text-xs px-2 py-1 rounded ${
                              method === 'pix'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                            {method === 'pix' && condition.pixInstallments && condition.pixInstallments > 1 && (
                              <span> até {condition.pixInstallments}x</span>
                            )}
                            {method === 'cartao_credito' && condition.creditCardInstallments && condition.creditCardInstallments > 1 && (
                              <span> até {condition.creditCardInstallments}x</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {condition.type === 'por_etapa' && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        <strong>Por Etapa:</strong> Você escolherá quais etapas participar e pagará apenas pelas etapas selecionadas.
                      </div>
                    )}

                    {condition.type === 'por_temporada' && (
                      <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                        <strong>Por Temporada:</strong> Você se inscreve na temporada completa e pode participar de todas as etapas.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedCondition) {
                    // Navegar para o formulário com a condição selecionada
                    navigate(`/registration/${seasonIdentifier}/${selectedCondition}`);
                  }
                }}
                disabled={!selectedCondition}
              >
                {existingRegistration ? 'Adicionar Inscrição' : 'Continuar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 