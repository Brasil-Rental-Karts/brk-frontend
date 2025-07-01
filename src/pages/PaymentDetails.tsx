import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle, CreditCard, Smartphone, Calendar, DollarSign, FileText, Receipt, Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Button } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';

import { Separator } from 'brk-design-system';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/loading';

import { SeasonRegistrationService, SeasonRegistration, RegistrationPaymentData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { formatDateToBrazilian } from '@/utils/date';
import { Loading } from '@/components/ui/loading';

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

      if (!registration) {
        throw new Error('Inscrição não encontrada');
      }

      // Buscar dados de pagamento do nosso banco de dados
      const payments = await SeasonRegistrationService.getPaymentData(registrationId);

      // Verificar se há dados de pagamento
      if (!payments || payments.length === 0) {
        console.warn('Nenhum dado de pagamento encontrado para a inscrição:', registrationId);
        
        // Criar dados de fallback baseados na inscrição
        const fallbackSummary = {
          totalAmount: Number(registration.amount),
          paidAmount: ['paid', 'exempt', 'direct_payment'].includes(registration.paymentStatus) ? Number(registration.amount) : 0,
          pendingAmount: registration.paymentStatus === 'pending' ? Number(registration.amount) : 0,
          overdueAmount: registration.paymentStatus === 'overdue' ? Number(registration.amount) : 0,
          totalInstallments: 1,
          paidInstallments: ['paid', 'exempt', 'direct_payment'].includes(registration.paymentStatus) ? 1 : 0
        };

        setData({
          registration,
          payments: [],
          summary: fallbackSummary
        });
        return;
      }

      // Calcular resumo dos pagamentos com lógica melhorada
      // Status que indicam pagamento completo
      const paidStatusList = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'EXEMPT', 'DIRECT_PAYMENT'];
      
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
        console.warn(`[PAYMENT DETAILS] ⚠️ Atenção - Inscrição ${registrationId}:`, {
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
      case 'EXEMPT':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Isento
          </Badge>
        );
      case 'DIRECT_PAYMENT':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pagamento Direto
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
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
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
      case 'ADMIN_EXEMPT':
      case 'ADMIN_DIRECT':
        return <Receipt className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (billingType: string, paymentStatus?: string) => {
    // Para inscrições administrativas, mostrar texto amigável baseado no status
    if (paymentStatus === 'exempt') {
      return 'Isento';
    }
    
    if (paymentStatus === 'direct_payment') {
      return 'Pagamento Direto';
    }

    switch (billingType) {
      case 'PIX':
        return 'PIX';
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'BOLETO':
        return 'Boleto';
      case 'ADMIN_EXEMPT':
        return 'Isento';
      case 'ADMIN_DIRECT':
        return 'Pagamento Direto';
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
    return <PageLoader message="Carregando detalhes do pagamento..." />;
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

      <div className="w-full max-w-4xl mx-auto px-2 md:px-6 py-4 md:py-8 space-y-6">
        {/* Cards de Resumo - responsivo: grid no desktop, empilhado no mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs md:text-sm text-muted-foreground">Valor Total</p><p className="text-base md:text-lg font-bold">{formatCurrency(summary.totalAmount)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-xs md:text-sm text-muted-foreground">Valor Pago</p><p className="text-base md:text-lg font-bold text-green-600">{formatCurrency(summary.paidAmount)}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div><div><p className="text-xs md:text-sm text-muted-foreground">Valor Pendente</p><p className="text-base md:text-lg font-bold text-yellow-600">{formatCurrency(summary.pendingAmount)}</p><div className="text-xs text-muted-foreground mt-1">{(() => {const pendingCount = payments.filter((p: any) => ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(p.status)).length;return pendingCount > 0 ? `${pendingCount} parcela${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}` : 'Nenhuma parcela pendente';})()}</div></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-red-100 rounded-lg"><XCircle className="w-5 h-5 text-red-600" /></div><div><p className="text-xs md:text-sm text-muted-foreground">Valor Vencido</p><p className="text-base md:text-lg font-bold text-red-600">{formatCurrency(summary.overdueAmount)}</p><div className="text-xs text-muted-foreground mt-1">{(() => {const overdueCount = payments.filter((p: any) => p.status === 'OVERDUE').length;return overdueCount > 0 ? `${overdueCount} parcela${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}` : 'Nenhuma parcela vencida';})()}</div></div></CardContent></Card>
        </div>

        {/* Resumo da Inscrição + Progresso de Parcelas */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Resumo da Inscrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div><p className="text-xs md:text-sm text-muted-foreground">Piloto</p><p className="font-medium text-sm md:text-base">{registration.user?.name}</p></div>
                <div><p className="text-xs md:text-sm text-muted-foreground">Campeonato</p><p className="font-medium text-sm md:text-base">{registration.season?.championship?.name}</p></div>
                <div><p className="text-xs md:text-sm text-muted-foreground">Temporada</p><p className="font-medium text-sm md:text-base">{registration.season?.name}</p></div>
                <div><p className="text-xs md:text-sm text-muted-foreground">Categorias</p><div className="flex flex-wrap gap-1 mt-1">{registration.categories && registration.categories.length > 0 ? (registration.categories.map((regCategory) => (<Badge key={regCategory.id} variant="outline" className="text-xs">{regCategory.category.name}</Badge>))) : (<span className="text-xs text-muted-foreground">Nenhuma categoria</span>)}</div></div>
                {registration.season?.inscriptionType === 'por_etapa' && registration.stages && registration.stages.length > 0 && (<div><p className="text-xs md:text-sm text-muted-foreground mt-2">Etapas Pagas</p><div className="flex flex-wrap gap-1 mt-1">{registration.stages.map((regStage) => (<Badge key={regStage.id} variant="secondary" className="text-xs">{regStage.stage?.name || regStage.stageName}</Badge>))}</div></div>)}
                <div><p className="text-xs md:text-sm text-muted-foreground">Data da Inscrição</p><p className="font-medium text-sm md:text-base">{formatDateToBrazilian(registration.createdAt)}</p></div>
                <div><p className="text-xs md:text-sm text-muted-foreground">Método de Pagamento</p><div className="flex items-center gap-2 mt-1">{getPaymentMethodIcon(registration.paymentMethod)}<span className="font-medium text-sm md:text-base">{getPaymentMethodLabel(registration.paymentMethod, registration.paymentStatus)}</span></div></div>
                {registration.paymentDate && (<div><p className="text-xs md:text-sm text-muted-foreground">Data do Pagamento</p><p className="font-medium text-sm md:text-base">{formatDateToBrazilian(registration.paymentDate)}</p></div>)}
              </CardContent>
            </Card>
            {summary.totalInstallments > 1 && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Progresso de Parcelas</CardTitle></CardHeader><CardContent><div className="text-center space-y-2 md:space-y-4"><div className="text-2xl md:text-3xl font-bold">{summary.paidInstallments}/{summary.totalInstallments}</div><p className="text-xs md:text-sm text-muted-foreground">parcelas pagas</p><div className="w-full bg-muted rounded-full h-2 md:h-3"><div className="bg-primary h-2 md:h-3 rounded-full transition-all duration-300" style={{ width: `${(summary.paidInstallments / summary.totalInstallments) * 100}%` }} /></div></div></CardContent></Card>)}
          </div>

          {/* Histórico de Pagamentos */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" />Histórico de Pagamentos</CardTitle></CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8"><p className="text-muted-foreground">Nenhum pagamento encontrado</p></div>
                ) : (
                  <div className="space-y-4">
                    {payments.sort((a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1)).map((payment, index) => {
                      const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH' || payment.status === 'EXEMPT' || payment.status === 'DIRECT_PAYMENT';
                      const isPending = payment.status === 'PENDING' || payment.status === 'AWAITING_PAYMENT' || payment.status === 'AWAITING_RISK_ANALYSIS';
                      const isOverdue = payment.status === 'OVERDUE';
                      return (
                        <div key={payment.id} className={`p-4 border rounded-lg transition-colors ${isPaid ? 'bg-green-50 border-green-200 hover:bg-green-100' : isPending ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' : isOverdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-gray-50 border-gray-200 hover:bg-muted/50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${isPaid ? 'bg-green-100 text-green-700' : isPending ? 'bg-yellow-100 text-yellow-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{payment.installmentNumber || (index + 1)}</div>
                              <div className="flex items-center gap-2">
                                {isPaid && <CheckCircle className="w-4 h-4 text-green-600" />}
                                {isPending && <Clock className="w-4 h-4 text-yellow-600" />}
                                {isOverdue && <XCircle className="w-4 h-4 text-red-600" />}
                                <span className="font-bold text-sm md:text-base">{formatCurrency(payment.value)}</span>
                              </div>
                            </div>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">{getPaymentMethodIcon(payment.billingType)}<span>{getPaymentMethodLabel(payment.billingType, payment.status)}</span></div>
                            <span>•</span>
                            <span>Vencimento: {formatDateToBrazilian(payment.dueDate)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails; 