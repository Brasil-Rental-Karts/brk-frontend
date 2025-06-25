import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Skeleton } from 'brk-design-system';
import { PageHeader } from '@/components/ui/page-header';
import { SeasonRegistrationService, SeasonRegistration, RegistrationPaymentData } from '@/lib/services/season-registration.service';
import { PixPayment } from '@/components/payment/PixPayment';

import { CreditCardPayment } from '@/components/payment/CreditCardPayment';
import { formatCurrency } from '@/utils/currency';

const InstallmentList: React.FC<{ payments: RegistrationPaymentData[] }> = ({ payments }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RECEIVED_IN_CASH':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case 'PENDING':
      case 'AWAITING_PAYMENT':
      case 'AWAITING_RISK_ANALYSIS':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencido
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano de Pagamento (Parcelamento)</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {payments
            .sort((a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1))
            .map((payment, index) => {
              const installmentNumber = payment.installmentNumber || index + 1;
              return (
                <li key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-primary">{installmentNumber}ª</div>
                    <div>
                      <div className="font-semibold">{formatCurrency(payment.value)}</div>
                      <div className="text-sm text-muted-foreground">
                        Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(payment.status)}
                </li>
              );
            })}
        </ul>
      </CardContent>
    </Card>
  );
};

export const RegistrationPayment: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [registration, setRegistration] = useState<SeasonRegistration | null>(null);
  const [payments, setPayments] = useState<RegistrationPaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da inscrição e pagamento
  const loadData = async (showRefreshing = false) => {
    if (!registrationId) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Carregar dados da inscrição
      const registrationData = await SeasonRegistrationService.getById(registrationId);
      console.log('📊 [FRONTEND] Dados da inscrição recebidos:', {
        id: registrationData.id,
        seasonInscriptionType: registrationData.season.inscriptionType,
        categoriesCount: registrationData.categories?.length || 0,
        stagesCount: registrationData.stages?.length || 0,
        stages: registrationData.stages?.map(s => ({ id: s.id, stageName: s.stage?.name, stageDate: s.stage?.date })),
        amount: registrationData.amount
      });
      setRegistration(registrationData);

      // Tentar carregar dados de pagamento
      try {
        const paymentResponse = await SeasonRegistrationService.getPaymentData(registrationId);
        console.log('📊 [FRONTEND] Dados de pagamento recebidos do backend:', paymentResponse);
        setPayments(paymentResponse || []);
      } catch (paymentError: any) {
        // Se não há dados de pagamento, criar um objeto padrão
        if (paymentError.message?.includes('não encontrados')) {
          setPayments([]);
        } else {
          throw paymentError;
        }
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do pagamento');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Verificar se há parâmetro success=true na URL
    const successParam = searchParams.get('success');
    if (successParam === 'true') {
      // Mostrar toast de sucesso e limpar o parâmetro da URL
      setTimeout(() => {
        // Remove o parâmetro success da URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 100);
    }
  }, [registrationId, searchParams]);

  // Auto-refresh para pagamentos PIX (verifica status a cada 30 segundos)
  useEffect(() => {
    if (!registration || !payments.length) return;
    
    const pendingPixPayment = payments.find(p => p.billingType === 'PIX' && p.status === 'PENDING');

    if (pendingPixPayment) {
      const interval = setInterval(() => {
        loadData(true);
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [registration, payments]);

  // Debug log para etapas
  useEffect(() => {
    if (registration && registration.season.inscriptionType === 'por_etapa') {
      console.log('🔍 [FRONTEND] Renderizando etapas:', {
        inscriptionType: registration.season.inscriptionType,
        hasStages: !!registration.stages,
        stagesCount: registration.stages?.length || 0,
        stages: registration.stages?.map(s => ({ id: s.id, name: s.stage?.name, date: s.stage?.date }))
      });
    }
  }, [registration]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const getStatusBadge = (status: string) => {
    // Para pagamentos parcelados, calcular status real baseado nas parcelas
    if (payments.length > 1) {
      const paidPayments = payments.filter(p => 
        p.status === 'RECEIVED' || 
        p.status === 'CONFIRMED' || 
        p.status === 'RECEIVED_IN_CASH'
      );
      
      const pendingPayments = payments.filter(p => 
        p.status === 'PENDING' || 
        p.status === 'AWAITING_PAYMENT' || 
        p.status === 'AWAITING_RISK_ANALYSIS'
      );
      
      const overduePayments = payments.filter(p => p.status === 'OVERDUE');
      
      console.log('🏷️ [STATUS BADGE] Calculando status real:', {
        totalPayments: payments.length,
        paidCount: paidPayments.length,
        pendingCount: pendingPayments.length,
        overdueCount: overduePayments.length
      });
      
      // Todas as parcelas pagas
      if (paidPayments.length === payments.length) {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Totalmente Pago ({paidPayments.length}/{payments.length})
          </Badge>
        );
      }
      
      // Há parcelas vencidas
      if (overduePayments.length > 0) {
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {overduePayments.length} Vencida{overduePayments.length > 1 ? 's' : ''} • {paidPayments.length}/{payments.length} Pagas
          </Badge>
        );
      }
      
      // Parcialmente pago
      if (paidPayments.length > 0) {
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Parcialmente Pago ({paidPayments.length}/{payments.length})
          </Badge>
        );
      }
      
      // Nenhuma parcela paga ainda
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pendente ({payments.length} parcelas)
        </Badge>
      );
    }
    
    // Para pagamento único, usar status original
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case 'pending':
      case 'processing':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'failed':
      case 'overdue':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-gray-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Estornado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const renderPaymentMethod = () => {
    console.log('🚀 [RENDER PAYMENT METHOD] FUNÇÃO CHAMADA!', { paymentsLength: payments.length, hasRegistration: !!registration });
    
    if (!payments.length || !registration) {
      console.log('❌ [RENDER PAYMENT METHOD] Saindo - sem dados:', { paymentsLength: payments.length, hasRegistration: !!registration });
      return null;
    }

    console.log('🔍 [RENDER PAYMENT METHOD] Iniciando seleção de pagamento...');
    console.log('📊 Todos os pagamentos recebidos:', payments.map(p => ({
      id: p.id,
      installmentNumber: p.installmentNumber,
      status: p.status,
      value: p.value,
      dueDate: p.dueDate
    })));

    // Lógica melhorada para encontrar a próxima parcela a ser paga
    // 1. Primeiro, procura por parcelas vencidas (OVERDUE) - prioridade máxima
    // 2. Depois, procura por parcelas pendentes (PENDING, AWAITING_PAYMENT, AWAITING_RISK_ANALYSIS)
    // 3. Ordena por número da parcela (installmentNumber) ou data de vencimento
    
    const overduePayments = payments.filter(p => p.status === 'OVERDUE');
    const pendingPayments = payments.filter(p => 
      p.status === 'PENDING' || 
      p.status === 'AWAITING_PAYMENT' || 
      p.status === 'AWAITING_RISK_ANALYSIS'
    );
    
    console.log('🚨 Pagamentos vencidos encontrados:', overduePayments.length);
    console.log('⏳ Pagamentos pendentes encontrados:', pendingPayments.length);
    
    if (overduePayments.length > 0) {
      console.log('📋 Lista de pagamentos vencidos:', overduePayments.map(p => ({
        id: p.id,
        installmentNumber: p.installmentNumber,
        status: p.status,
        value: p.value,
        dueDate: p.dueDate
      })));
    }
    
    if (pendingPayments.length > 0) {
      console.log('📋 Lista de pagamentos pendentes:', pendingPayments.map(p => ({
        id: p.id,
        installmentNumber: p.installmentNumber,
        status: p.status,
        value: p.value,
        dueDate: p.dueDate
      })));
    }
    
    // Função para ordenar por número da parcela ou data de vencimento
    const sortPayments = (paymentsToSort: RegistrationPaymentData[]) => {
      return paymentsToSort.sort((a, b) => {
        // Primeiro tenta ordenar por installmentNumber
        if (a.installmentNumber && b.installmentNumber) {
          return a.installmentNumber - b.installmentNumber;
        }
        // Se não tem installmentNumber, ordena por data de vencimento
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    };

    let paymentToRender: RegistrationPaymentData | null = null;
    let selectionReason = '';

    // Prioridade 1: Parcelas vencidas (ordenadas por número/data)
    if (overduePayments.length > 0) {
      const sortedOverdue = sortPayments(overduePayments);
      paymentToRender = sortedOverdue[0];
      selectionReason = 'OVERDUE_PRIORITY';
      console.log('🚨 Pagamento vencido selecionado (PRIORIDADE 1):', {
        id: paymentToRender.id,
        installmentNumber: paymentToRender.installmentNumber,
        value: paymentToRender.value,
        dueDate: paymentToRender.dueDate,
        status: paymentToRender.status,
        reason: selectionReason
      });
    }
    // Prioridade 2: Parcelas pendentes (ordenadas por número/data)
    else if (pendingPayments.length > 0) {
      const sortedPending = sortPayments(pendingPayments);
      paymentToRender = sortedPending[0];
      selectionReason = 'PENDING_PRIORITY';
      console.log('⏳ Próxima parcela pendente selecionada (PRIORIDADE 2):', {
        id: paymentToRender.id,
        installmentNumber: paymentToRender.installmentNumber,
        value: paymentToRender.value,
        dueDate: paymentToRender.dueDate,
        status: paymentToRender.status,
        reason: selectionReason
      });
    }
    // Fallback: Primeira parcela da lista
    else {
      paymentToRender = payments[0];
      selectionReason = 'FALLBACK_FIRST';
      console.log('📋 Usando primeira parcela como fallback (PRIORIDADE 3):', {
        id: paymentToRender.id,
        installmentNumber: paymentToRender.installmentNumber,
        value: paymentToRender.value,
        dueDate: paymentToRender.dueDate,
        status: paymentToRender.status,
        reason: selectionReason
      });
    }

    console.log('✅ [RENDER PAYMENT METHOD] Pagamento final selecionado:', {
      id: paymentToRender?.id,
      installmentNumber: paymentToRender?.installmentNumber,
      status: paymentToRender?.status,
      value: paymentToRender?.value,
      billingType: paymentToRender?.billingType,
      selectionReason
    });

    if (!paymentToRender) return null;

    switch (paymentToRender.billingType) {
      case 'PIX':
        return (
          <PixPayment
            paymentData={paymentToRender}
            registration={registration}
            onPaymentComplete={() => loadData(true)}
            onPaymentUpdate={(updatedPayment) => {
              // Atualizar o estado local dos pagamentos
              setPayments(prevPayments => 
                prevPayments.map(p => 
                  p.id === updatedPayment.id ? updatedPayment : p
                )
              );
            }}
          />
        );

      case 'CREDIT_CARD':
        return (
          <CreditCardPayment
            paymentData={paymentToRender}
            registration={registration}
            onPaymentComplete={() => loadData(true)}
          />
        );
      default:
        return (
          <Alert>
            <AlertDescription>
              Método de pagamento não suportado: {paymentToRender.billingType}
            </AlertDescription>
          </Alert>
        );
    }
  };

  if (!registrationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">ID da inscrição não encontrado</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Carregando..."
          actions={[
            {
              label: "Voltar",
              onClick: handleBack,
              variant: "outline"
            }
          ]}
        />
        
        <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Erro"
          actions={[
            {
              label: "Voltar",
              onClick: handleBack,
              variant: "outline"
            }
          ]}
        />
        
        <div className="w-full max-w-4xl mx-auto px-6 py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!registration || !payments.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">Dados da inscrição não encontrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Pagamento da Inscrição"
        actions={[
          {
            label: "Voltar",
            onClick: handleBack,
            variant: "outline"
          }
        ]}
      />
      
      <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Mensagem de Sucesso do Callback */}
        {searchParams.get('success') === 'true' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Pagamento processado com sucesso! Aguarde a confirmação automática.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Resumo da Inscrição */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resumo da Inscrição</CardTitle>
              {getStatusBadge(registration.paymentStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Temporada</h4>
                <p className="font-medium">{registration.season.name}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Piloto</h4>
                <p className="font-medium">{registration.user.name}</p>
              </div>
            </div>

            {/* Categorias Selecionadas */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Categorias</h4>
              <div className="flex flex-wrap gap-2">
                {registration.categories && registration.categories.length > 0 ? (
                  registration.categories.map((regCategory) => (
                    <Badge key={regCategory.id} variant="outline">
                      {regCategory.category.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma categoria</span>
                )}
              </div>
            </div>

            {/* Etapas Selecionadas (se for inscrição por etapa) */}
            {registration.season.inscriptionType === 'por_etapa' && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Etapas</h4>
                {registration.stages && registration.stages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {registration.stages.map((regStage) => (
                      <Badge key={regStage.id} variant="outline">
                        {regStage.stage.name} - {new Date(regStage.stage.date).toLocaleDateString('pt-BR')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma etapa selecionada</span>
                )}
              </div>
            )}
            
            {/* Valor Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Valor Total:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(registration.amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Pagamento */}
        {(() => {
          // Para pagamentos parcelados, verificar se há parcelas pendentes
          if (payments.length > 1) {
            const pendingPayments = payments.filter(p => 
              p.status === 'PENDING' || 
              p.status === 'AWAITING_PAYMENT' || 
              p.status === 'AWAITING_RISK_ANALYSIS' ||
              p.status === 'OVERDUE'
            );
            
            console.log('🔍 [PAYMENT STATUS CHECK] Parcelas pendentes/vencidas:', pendingPayments.length);
            
            // Se há parcelas pendentes, mostrar interface de pagamento
            if (pendingPayments.length > 0) {
              console.log('✅ [PAYMENT STATUS CHECK] Decisão: MOSTRAR INTERFACE DE PAGAMENTO (há parcelas pendentes)');
              return false; // Não está totalmente pago
            }
            
            console.log('✅ [PAYMENT STATUS CHECK] Decisão: TODAS PARCELAS PAGAS');
          }
          
          // Para pagamento único ou todas as parcelas pagas
          const isPaid = registration.paymentStatus === 'paid';
          console.log('✅ [PAYMENT STATUS CHECK] Decisão: PAGAMENTO ÚNICO -', isPaid ? 'PAGO' : 'PENDENTE');
          return isPaid;
        })() ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-muted-foreground">
                  Sua inscrição foi confirmada com sucesso.
                </p>
                {registration.paymentDate && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Pago em: {new Date(registration.paymentDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>


            {payments.length > 1 && <InstallmentList payments={payments} />}
            {renderPaymentMethod()}
          </>
        )}

        {/* Instruções gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Após o pagamento, aguarde alguns minutos para a confirmação automática
            </p>
            <p className="text-sm text-muted-foreground">
              • Em caso de dúvidas, entre em contato com a organização do campeonato
            </p>
            <p className="text-sm text-muted-foreground">
              • Mantenha o comprovante de pagamento até a confirmação da inscrição
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPayment; 