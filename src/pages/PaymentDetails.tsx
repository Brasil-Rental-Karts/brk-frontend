import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle, CreditCard, Smartphone, Calendar, DollarSign, FileText, Receipt, Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Button } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Skeleton } from 'brk-design-system';
import { Separator } from 'brk-design-system';
import { PageHeader } from '@/components/ui/page-header';

import { SeasonRegistrationService, SeasonRegistration, RegistrationPaymentData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { formatDateToBrazilian } from '@/utils/date';

interface PaymentDetailsData {
  registration: SeasonRegistration;
  payments: RegistrationPaymentData[];
  summary: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    totalInstallments: number;
    paidInstallments: number;
  };
}

export const PaymentDetails: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<PaymentDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentDetails = async () => {
    if (!registrationId) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar dados da inscrição
      const registration = await SeasonRegistrationService.getById(registrationId);

      // Sincronizar e buscar dados de pagamento diretamente do Asaas
      // Isso garante que todas as parcelas sejam listadas, independente do status
      console.log('=== SINCRONIZANDO PAGAMENTOS COM ASAAS ===');
      
      let payments: any[] = [];
      try {
        // Primeiro tenta sincronizar com o Asaas
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/season-registrations/${registrationId}/sync-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          payments = await response.json();
          console.log('Pagamentos sincronizados com sucesso:', payments);
        } else {
          console.warn('Erro na sincronização, usando dados locais');
          const localPayments = await SeasonRegistrationService.getPaymentData(registrationId);
          payments = localPayments || [];
        }
      } catch (syncError) {
        console.warn('Erro na sincronização, usando dados locais:', syncError);
        const localPayments = await SeasonRegistrationService.getPaymentData(registrationId);
        payments = localPayments || [];
      }

      if (!registration) {
        throw new Error('Inscrição não encontrada');
      }

      // Calcular resumo dos pagamentos com lógica melhorada
      // Status que indicam pagamento completo
      const paidStatusList = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
      
      // Status que indicam pagamento pendente
      const pendingStatusList = ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'];
      
      // Status que indicam pagamento vencido
      const overdueStatusList = ['OVERDUE'];
      
      const paidPayments = payments.filter((p: any) => paidStatusList.includes(p.status));
      const pendingPayments = payments.filter((p: any) => pendingStatusList.includes(p.status));
      const overduePayments = payments.filter((p: any) => overdueStatusList.includes(p.status));

      const paidAmount = paidPayments.reduce((sum: number, p: any) => sum + Number(p.value), 0);
      const pendingAmount = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.value), 0);
      const overdueAmount = overduePayments.reduce((sum: number, p: any) => sum + Number(p.value), 0);

      // Verificar se há parcelas com status não mapeados
      const allMappedPayments = [...paidPayments, ...pendingPayments, ...overduePayments];
      const unmappedPayments = payments.filter((p: any) => !allMappedPayments.find((mapped: any) => mapped.id === p.id));

      // Debug log apenas se houver discrepâncias ou parcelas não mapeadas
      if (unmappedPayments.length > 0 || Math.abs((paidAmount + pendingAmount + overdueAmount) - registration.amount) > 0.01) {
        console.log(`[PAYMENT DETAILS] ⚠️ Atenção - Inscrição ${registrationId}:`, {
          totalPayments: payments.length,
          unmappedCount: unmappedPayments.length,
          paidAmount: paidAmount,
          pendingAmount: pendingAmount,
          overdueAmount: overdueAmount,
          totalCalculated: paidAmount + pendingAmount + overdueAmount,
          registrationTotal: registration.amount,
          unmappedPayments: unmappedPayments.map((p: any) => ({ id: p.id, status: p.status, value: p.value }))
        });
      }

      const summary = {
        totalAmount: Number(registration.amount),
        paidAmount,
        pendingAmount,
        overdueAmount,
        totalInstallments: payments.length || 1,
        paidInstallments: paidPayments.length
      };



      setData({
        registration,
        payments: payments || [],
        summary
      });

    } catch (err: any) {
      console.error('Erro ao carregar detalhes do pagamento:', err);
      setError(err.message || 'Erro ao carregar detalhes do pagamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentDetails();
  }, [registrationId]);

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
            <XCircle className="w-3 h-3 mr-1" />
            Vencido
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getPaymentMethodIcon = (billingType: string) => {
    switch (billingType) {
      case 'PIX':
        return <Smartphone className="w-4 h-4" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (billingType: string) => {
    switch (billingType) {
      case 'PIX':
        return 'PIX';
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'BOLETO':
        return 'Boleto';
      default:
        return billingType;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMakePayment = () => {
    // Encontrar a próxima parcela a ser paga (mesma lógica do RegistrationPayment)
    const overduePayments = payments.filter((p: any) => p.status === 'OVERDUE');
    const pendingPayments = payments.filter((p: any) => 
      p.status === 'PENDING' || 
      p.status === 'AWAITING_PAYMENT' || 
      p.status === 'AWAITING_RISK_ANALYSIS'
    );
    
    // Função para ordenar por número da parcela ou data de vencimento
    const sortPayments = (paymentsToSort: any[]) => {
      return paymentsToSort.sort((a, b) => {
        if (a.installmentNumber && b.installmentNumber) {
          return a.installmentNumber - b.installmentNumber;
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    };

    let nextPayment = null;
    if (overduePayments.length > 0) {
      nextPayment = sortPayments(overduePayments)[0];
    } else if (pendingPayments.length > 0) {
      nextPayment = sortPayments(pendingPayments)[0];
    }

    // Log para debug
    if (nextPayment) {
      console.log('🎯 Redirecionando para pagamento da parcela:', {
        id: nextPayment.id,
        installmentNumber: nextPayment.installmentNumber,
        value: nextPayment.value,
        dueDate: nextPayment.dueDate,
        status: nextPayment.status,
        billingType: nextPayment.billingType
      });
    }

    navigate(`/registration/${registrationId}/payment`);
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
        
        <div className="w-full max-w-6xl mx-auto px-6 py-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
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
        
        <div className="w-full max-w-6xl mx-auto px-6 py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">Dados do pagamento não encontrados</p>
        </div>
      </div>
    );
  }

  const { registration, payments, summary } = data;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Detalhes do Pagamento"
        subtitle={`${registration.season?.championship?.name} - ${registration.season?.name}`}
        actions={[
          {
            label: "Voltar",
            onClick: handleBack,
            variant: "outline"
          },
          ...(summary.pendingAmount > 0 || summary.overdueAmount > 0 
            ? [{
                label: "Pagar",
                onClick: handleMakePayment,
                variant: "default" as const
              }]
            : []
          )
        ]}
      />
      
      <div className="w-full max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Informação sobre sincronização automática */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta página sincroniza automaticamente com o Asaas para mostrar todas as parcelas atualizadas, 
            independente do status no sistema local.
          </AlertDescription>
        </Alert>

        {/* Cards de Resumo */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-bold">{formatCurrency(summary.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(summary.paidAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pendente</p>
                  <p className="text-lg font-bold text-yellow-600">{formatCurrency(summary.pendingAmount)}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const pendingCount = payments.filter((p: any) => 
                        ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(p.status)
                      ).length;
                      
                      if (pendingCount > 0) {
                        return `${pendingCount} parcela${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}`;
                      }
                      return 'Nenhuma parcela pendente';
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Vencido</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(summary.overdueAmount)}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const overdueCount = payments.filter((p: any) => p.status === 'OVERDUE').length;
                      
                      if (overdueCount > 0) {
                        return `${overdueCount} parcela${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}`;
                      }
                      return 'Nenhuma parcela vencida';
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Informações da Inscrição */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resumo da Inscrição */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resumo da Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Piloto</p>
                  <p className="font-medium">{registration.user?.name}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Campeonato</p>
                  <p className="font-medium">{registration.season?.championship?.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Temporada</p>
                  <p className="font-medium">{registration.season?.name}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Categorias</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {registration.categories && registration.categories.length > 0 ? (
                      registration.categories.map((regCategory) => (
                        <Badge key={regCategory.id} variant="outline" className="text-xs">
                          {regCategory.category.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhuma categoria</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Data da Inscrição</p>
                  <p className="font-medium">{formatDateToBrazilian(registration.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPaymentMethodIcon(registration.paymentMethod)}
                    <span className="font-medium">{getPaymentMethodLabel(registration.paymentMethod)}</span>
                  </div>
                </div>

                {registration.paymentDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                    <p className="font-medium">{formatDateToBrazilian(registration.paymentDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progresso de Parcelas */}
            {summary.totalInstallments > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Progresso de Parcelas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-3xl font-bold">
                      {summary.paidInstallments}/{summary.totalInstallments}
                    </div>
                    <p className="text-muted-foreground">parcelas pagas</p>
                    
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(summary.paidInstallments / summary.totalInstallments) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Direita - Histórico de Pagamentos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments
                      .sort((a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1))
                      .map((payment, index) => {
                        const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH';
                        const isPending = payment.status === 'PENDING' || payment.status === 'AWAITING_PAYMENT' || payment.status === 'AWAITING_RISK_ANALYSIS';
                        const isOverdue = payment.status === 'OVERDUE';
                        
                        return (
                          <div
                            key={payment.id}
                            className={`
                              flex items-center justify-between p-4 border rounded-lg transition-colors
                              ${isPaid ? 'bg-green-50 border-green-200 hover:bg-green-100' : 
                                isPending ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' : 
                                isOverdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : 
                                'bg-gray-50 border-gray-200 hover:bg-muted/50'}
                            `}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`
                                flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                                ${isPaid ? 'bg-green-100 text-green-700' : 
                                  isPending ? 'bg-yellow-100 text-yellow-700' : 
                                  isOverdue ? 'bg-red-100 text-red-700' : 
                                  'bg-gray-100 text-gray-700'}
                              `}>
                                {payment.installmentNumber || (index + 1)}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {isPaid && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {isPending && <Clock className="w-4 h-4 text-yellow-600" />}
                                  {isOverdue && <XCircle className="w-4 h-4 text-red-600" />}
                                  <span className={`font-medium ${
                                    isPaid ? 'text-green-700' : 
                                    isPending ? 'text-yellow-700' : 
                                    isOverdue ? 'text-red-700' : 
                                    'text-gray-700'
                                  }`}>
                                    {formatCurrency(payment.value)}
                                  </span>
                                  {payment.installmentNumber && (
                                    <Badge variant="outline" className="text-xs">
                                      {payment.installmentNumber}ª Parcela
                                    </Badge>
                                  )}
                                  {isPaid && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                      PAGO
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {getPaymentMethodIcon(payment.billingType)}
                                  <span>{getPaymentMethodLabel(payment.billingType)}</span>
                                  <span>•</span>
                                  <span>Vencimento: {formatDateToBrazilian(payment.dueDate)}</span>
                                </div>
                                
                                {/* Informações adicionais para pagamentos pagos */}
                                {isPaid && (
                                  <div className="text-xs text-green-600 font-medium">
                                    ✓ Pagamento confirmado
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Verificação de discrepância */}
                      {(() => {
                        const calculatedTotal = summary.paidAmount + summary.pendingAmount + summary.overdueAmount;
                        const difference = Math.abs(calculatedTotal - summary.totalAmount);
                        
                        if (difference > 0.01) { // Diferença maior que 1 centavo
                          return (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <div className="text-sm">
                                  <div className="font-medium text-orange-800">Discrepância detectada</div>
                                  <div className="text-orange-600">
                                    Total calculado: {formatCurrency(calculatedTotal)} | 
                                    Total da inscrição: {formatCurrency(summary.totalAmount)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instruções */}
        {(summary.pendingAmount > 0 || summary.overdueAmount > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  • Para efetuar o pagamento das parcelas pendentes, clique no botão "Pagar"
                </p>
                <p className="text-sm">
                  • Após o pagamento, aguarde alguns minutos para a confirmação automática
                </p>
                <p className="text-sm">
                  • Em caso de dúvidas, entre em contato com a organização do campeonato
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails; 