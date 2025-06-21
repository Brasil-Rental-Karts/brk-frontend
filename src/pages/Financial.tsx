import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Button } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Skeleton } from 'brk-design-system';
import { SeasonRegistrationService, SeasonRegistration } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { formatDateToBrazilian } from '@/utils/date';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegistrationWithPayments extends SeasonRegistration {
  paymentDetails?: {
    totalInstallments: number;
    paidInstallments: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    payments: any[];
  };
}

interface FinancialData {
  registrations: RegistrationWithPayments[];
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

export const Financial: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({
    registrations: [],
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0
  });

  const loadFinancialData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!user?.id) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar todas as inscrições do usuário
      const registrations = await SeasonRegistrationService.getMyRegistrations();
      
      // Buscar detalhes de pagamento para cada inscrição
      const registrationsWithPayments: RegistrationWithPayments[] = await Promise.all(
        registrations.map(async (reg) => {
          try {
            const payments = await SeasonRegistrationService.getPaymentData(reg.id);
            
            if (payments && payments.length > 0) {
              // Status que indicam pagamento completo
              const paidStatusList = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
              
              // Status que indicam pagamento pendente
              const pendingStatusList = ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'];
              
              // Status que indicam pagamento vencido
              const overdueStatusList = ['OVERDUE'];
              
              const paidPayments = payments.filter(p => paidStatusList.includes(p.status));
              const pendingPayments = payments.filter(p => pendingStatusList.includes(p.status));
              const overduePayments = payments.filter(p => overdueStatusList.includes(p.status));
              
              const paidAmount = paidPayments.reduce((sum, p) => sum + Number(p.value), 0);
              const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.value), 0);
              const overdueAmount = overduePayments.reduce((sum, p) => sum + Number(p.value), 0);
              
              // Verificar se há parcelas com status não mapeados
              const allMappedPayments = [...paidPayments, ...pendingPayments, ...overduePayments];
              const unmappedPayments = payments.filter(p => !allMappedPayments.find(mapped => mapped.id === p.id));
              
              // Debug log detalhado
              console.log(`[DEBUG] Inscrição ${reg.id} (${reg.season?.name}):`, {
                totalPayments: payments.length,
                paidCount: paidPayments.length,
                pendingCount: pendingPayments.length,
                overdueCount: overduePayments.length,
                unmappedCount: unmappedPayments.length,
                paidAmount: paidAmount,
                pendingAmount: pendingAmount,
                overdueAmount: overdueAmount,
                totalCalculated: paidAmount + pendingAmount + overdueAmount,
                registrationTotal: reg.amount,
                unmappedPayments: unmappedPayments.map(p => ({ id: p.id, status: p.status, value: p.value })),
                allPaymentsByStatus: {
                  paid: paidPayments.map(p => ({ id: p.id, status: p.status, value: p.value })),
                  pending: pendingPayments.map(p => ({ id: p.id, status: p.status, value: p.value })),
                  overdue: overduePayments.map(p => ({ id: p.id, status: p.status, value: p.value }))
                }
              });
              
              return {
                ...reg,
                paymentDetails: {
                  totalInstallments: payments.length,
                  paidInstallments: paidPayments.length,
                  paidAmount,
                  pendingAmount,
                  overdueAmount,
                  payments
                }
              };
            }
            
            // Fallback em caso de erro
            return {
              ...reg,
              paymentDetails: {
                totalInstallments: 1,
                paidInstallments: reg.paymentStatus === 'paid' ? 1 : 0,
                paidAmount: reg.paymentStatus === 'paid' ? Number(reg.amount) : 0,
                pendingAmount: reg.paymentStatus === 'pending' || reg.paymentStatus === 'processing' ? Number(reg.amount) : 0,
                overdueAmount: reg.paymentStatus === 'failed' || reg.paymentStatus === 'overdue' ? Number(reg.amount) : 0,
                payments: []
              }
            };
          } catch (error) {
            console.warn(`Erro ao buscar pagamentos da inscrição ${reg.id}:`, error);
            // Fallback em caso de erro
            return {
              ...reg,
              paymentDetails: {
                totalInstallments: 1,
                paidInstallments: reg.paymentStatus === 'paid' ? 1 : 0,
                paidAmount: reg.paymentStatus === 'paid' ? reg.amount : 0,
                pendingAmount: reg.paymentStatus === 'pending' ? reg.amount : 0,
                overdueAmount: reg.paymentStatus === 'overdue' ? reg.amount : 0,
                payments: []
              }
            };
          }
        })
      );
      
      // Calcular totais baseado nos detalhes de pagamento
      let totalPaid = 0;
      let totalPending = 0;
      let totalOverdue = 0;

      registrationsWithPayments.forEach((reg) => {
        if (reg.paymentDetails) {
          totalPaid += reg.paymentDetails.paidAmount;
          totalPending += reg.paymentDetails.pendingAmount;
          totalOverdue += reg.paymentDetails.overdueAmount;
        }
      });

      // Debug log dos totais finais
      console.log('[DEBUG] Totais Calculados:', {
        totalPaid: totalPaid,
        totalPending: totalPending,
        totalOverdue: totalOverdue,
        totalRegistrations: registrationsWithPayments.length
      });

      setFinancialData({
        registrations: registrationsWithPayments,
        totalPaid,
        totalPending,
        totalOverdue
      });

    } catch (err: any) {
      console.error('Erro ao carregar dados financeiros:', err);
      setError(err.message || 'Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user?.id]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'overdue':
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix':
        return <Smartphone className="w-4 h-4" />;
      case 'cartao_credito':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'cartao_credito':
        return 'Cartão de Crédito';
      default:
        return method;
    }
  };

  const handleViewPayment = (registrationId: string) => {
    navigate(`/registration/${registrationId}/payment`);
  };

  const handleViewPaymentDetails = (registrationId: string) => {
    navigate(`/payment-details/${registrationId}`);
  };

  const handleRefresh = () => {
    loadFinancialData(true);
  };

  const handleSyncPayment = async (registrationId: string) => {
    try {
      setRefreshing(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/season-registrations/${registrationId}/sync-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar pagamento');
      }

      // Recarregar dados após sincronização
      await loadFinancialData(false);
      
      // Mostrar notificação de sucesso
      console.log('✅ Pagamento sincronizado com sucesso para inscrição:', registrationId);
      
    } catch (error) {
      console.error('Erro ao sincronizar pagamento:', error);
      // Mostrar notificação de erro (pode adicionar toast aqui)
    } finally {
      setRefreshing(false);
    }
  };

  const getInstallmentProgress = (registration: RegistrationWithPayments) => {
    if (!registration.paymentDetails) return null;
    
    const { totalInstallments, paidInstallments } = registration.paymentDetails;
    
    if (totalInstallments <= 1) return null;
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {paidInstallments}/{totalInstallments} parcelas
        </Badge>
        <div className="flex-1 bg-muted rounded-full h-2 max-w-20">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(paidInstallments / totalInstallments) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  const getPaymentStatusInfo = (registration: RegistrationWithPayments) => {
    if (!registration.paymentDetails) {
      return {
        status: registration.paymentStatus,
        description: registration.paymentStatus === 'paid' ? 'Pago' : 
                    registration.paymentStatus === 'pending' ? 'Pendente' : 'Vencido'
      };
    }

    const { paidInstallments, totalInstallments, paidAmount, pendingAmount, overdueAmount } = registration.paymentDetails;
    
    if (paidInstallments === totalInstallments) {
      return {
        status: 'paid',
        description: 'Totalmente Pago'
      };
    } else if (paidInstallments > 0) {
      return {
        status: 'partial',
        description: `Parcialmente Pago (${paidInstallments}/${totalInstallments})`
      };
    } else if (overdueAmount > 0) {
      return {
        status: 'overdue',
        description: 'Vencido'
      };
    } else {
      return {
        status: 'pending',
        description: 'Pendente'
      };
    }
  };

  const getPaymentStatusBadgeNew = (registration: RegistrationWithPayments) => {
    const statusInfo = getPaymentStatusInfo(registration);
    
    // Se for parcelado, incluir informação de parcelas no texto do badge
    let badgeText = statusInfo.description;
    if (registration.paymentDetails && registration.paymentDetails.totalInstallments > 1) {
      const { paidInstallments, totalInstallments } = registration.paymentDetails;
      badgeText = `${paidInstallments}/${totalInstallments} Parcelas`;
    }
    
    switch (statusInfo.status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {badgeText}
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            {badgeText}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {badgeText}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {badgeText}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {badgeText}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Financeiro"
          subtitle="Carregando dados financeiros..."
        />
        <div className="w-full max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Resumo Skeleton */}
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Lista Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
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
          title="Financeiro"
          actions={[
            {
              label: "Tentar Novamente",
              onClick: () => loadFinancialData(),
              variant: "default"
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

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Financeiro"
        subtitle="Acompanhe seus pagamentos e inscrições"
        actions={[
          {
            label: refreshing ? "Atualizando..." : "Atualizar",
            onClick: handleRefresh,
            disabled: refreshing,
            variant: "outline"
          }
        ]}
      />
      
      <div className="w-full max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Resumo Financeiro */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pago
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialData.totalPaid)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(() => {
                  const totalPaidInstallments = financialData.registrations.reduce((sum, reg) => 
                    sum + (reg.paymentDetails?.paidInstallments || 0), 0
                  );
                  return totalPaidInstallments > 0 ? `${totalPaidInstallments} parcelas pagas` : '';
                })()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendente
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(financialData.totalPending)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(() => {
                  const totalPendingInstallments = financialData.registrations.reduce((sum, reg) => {
                    if (!reg.paymentDetails) return sum;
                    // Contar apenas parcelas realmente pendentes (não pagas)
                    const pendingCount = reg.paymentDetails.payments?.filter(p => 
                      ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(p.status)
                    ).length || 0;
                    return sum + pendingCount;
                  }, 0);
                  
                  if (totalPendingInstallments > 0) {
                    return `${totalPendingInstallments} parcela${totalPendingInstallments > 1 ? 's' : ''} pendente${totalPendingInstallments > 1 ? 's' : ''}`;
                  }
                  return 'Nenhuma parcela pendente';
                })()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vencido
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(financialData.totalOverdue)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(() => {
                  const totalOverdueInstallments = financialData.registrations.reduce((sum, reg) => {
                    if (!reg.paymentDetails) return sum;
                    const overdueCount = reg.paymentDetails.payments?.filter(p => p.status === 'OVERDUE').length || 0;
                    return sum + overdueCount;
                  }, 0);
                  
                  if (totalOverdueInstallments > 0) {
                    return `${totalOverdueInstallments} parcela${totalOverdueInstallments > 1 ? 's' : ''} vencida${totalOverdueInstallments > 1 ? 's' : ''}`;
                  }
                  return 'Nenhuma parcela vencida';
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Inscrições */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Inscrições</CardTitle>
          </CardHeader>
          <CardContent>
            {financialData.registrations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma inscrição encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {financialData.registrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <h3 className="font-semibold">{registration.season.championship?.name || 'Campeonato'}</h3>
                          <p className="text-sm text-muted-foreground">{registration.season.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadgeNew(registration)}
                        </div>
                      </div>
                      
                      {/* Progresso das parcelas */}
                      {getInstallmentProgress(registration) && (
                        <div className="flex items-center gap-2">
                          {getInstallmentProgress(registration)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <div className="flex items-center gap-1">
                           {getPaymentMethodIcon(registration.paymentMethod)}
                           <span>{getPaymentMethodLabel(registration.paymentMethod)}</span>
                         </div>
                         
                         {/* Valores detalhados para parcelado */}
                         {registration.paymentDetails && registration.paymentDetails.totalInstallments > 1 ? (
                           <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-4">
                               <div className="flex items-center gap-2">
                                 <CheckCircle className="w-4 h-4 text-green-600" />
                                 <span className="text-sm">
                                   <span className="font-medium text-green-600">{registration.paymentDetails.paidInstallments}</span> pagas
                                 </span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Clock className="w-4 h-4 text-yellow-600" />
                                 <span className="text-sm">
                                   <span className="font-medium text-yellow-600">{registration.paymentDetails.totalInstallments - registration.paymentDetails.paidInstallments}</span> pendentes
                                 </span>
                               </div>
                               <div className="text-sm text-muted-foreground">
                                 de <span className="font-medium">{registration.paymentDetails.totalInstallments}</span> parcelas
                               </div>
                             </div>
                             {/* Lista detalhada das parcelas */}
                             {registration.paymentDetails.payments && registration.paymentDetails.payments.length > 0 && (
                               <div className="mt-2 space-y-2">
                                 <div className="text-xs font-medium text-muted-foreground">Parcelas:</div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                   {registration.paymentDetails.payments
                                     .sort((a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1))
                                     .map((payment, index) => {
                                       const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'RECEIVED_IN_CASH';
                                       const isPending = payment.status === 'PENDING' || payment.status === 'AWAITING_PAYMENT' || payment.status === 'AWAITING_RISK_ANALYSIS';
                                       const isOverdue = payment.status === 'OVERDUE';
                                       
                                       return (
                                         <div key={payment.id} className={`
                                           flex items-center justify-between p-2 rounded border text-xs
                                           ${isPaid ? 'bg-green-50 border-green-200' : 
                                             isPending ? 'bg-yellow-50 border-yellow-200' : 
                                             isOverdue ? 'bg-red-50 border-red-200' : 
                                             'bg-gray-50 border-gray-200'}
                                         `}>
                                           <div className="flex items-center gap-2">
                                             {isPaid && <CheckCircle className="w-3 h-3 text-green-600" />}
                                             {isPending && <Clock className="w-3 h-3 text-yellow-600" />}
                                             {isOverdue && <XCircle className="w-3 h-3 text-red-600" />}
                                             <span className={`font-medium ${
                                               isPaid ? 'text-green-700' : 
                                               isPending ? 'text-yellow-700' : 
                                               isOverdue ? 'text-red-700' : 
                                               'text-gray-700'
                                             }`}>
                                               {payment.installmentNumber ? `${payment.installmentNumber}ª` : `${index + 1}ª`}
                                             </span>
                                           </div>
                                           <div className="flex flex-col items-end">
                                             <span className={`font-medium ${
                                               isPaid ? 'text-green-700' : 
                                               isPending ? 'text-yellow-700' : 
                                               isOverdue ? 'text-red-700' : 
                                               'text-gray-700'
                                             }`}>
                                               {formatCurrency(payment.value)}
                                             </span>
                                             {payment.dueDate && (
                                               <span className="text-xs text-muted-foreground">
                                                 {formatDateToBrazilian(payment.dueDate)}
                                               </span>
                                             )}
                                           </div>
                                         </div>
                                       );
                                     })}
                                 </div>
                               </div>
                             )}

                             <div className="flex items-center gap-4 flex-wrap">
                               <div className="flex items-center gap-4">
                                 {registration.paymentDetails.paidAmount > 0 && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-sm font-medium text-green-600">
                                       Pago: {formatCurrency(registration.paymentDetails.paidAmount)}
                                     </span>
                                   </div>
                                 )}
                                 {registration.paymentDetails.pendingAmount > 0 && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-sm font-medium text-yellow-600">
                                       Pendente: {formatCurrency(registration.paymentDetails.pendingAmount)}
                                     </span>
                                   </div>
                                 )}
                                 {registration.paymentDetails.overdueAmount > 0 && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-sm font-medium text-red-600">
                                       Vencido: {formatCurrency(registration.paymentDetails.overdueAmount)}
                                     </span>
                                   </div>
                                 )}
                               </div>
                               <div className="text-sm text-muted-foreground">
                                 Total da Inscrição: <span className="font-medium">{formatCurrency(registration.amount)}</span>
                               </div>
                               {/* Mostrar diferença se houver discrepância */}
                               {(() => {
                                 const calculatedTotal = registration.paymentDetails.paidAmount + 
                                                       registration.paymentDetails.pendingAmount + 
                                                       registration.paymentDetails.overdueAmount;
                                 const difference = Math.abs(calculatedTotal - registration.amount);
                                 
                                 if (difference > 0.01) { // Diferença maior que 1 centavo
                                   return (
                                     <div className="text-xs text-orange-600 font-medium">
                                       ⚠️ Diferença detectada: Total calculado {formatCurrency(calculatedTotal)} vs Inscrição {formatCurrency(registration.amount)}
                                     </div>
                                   );
                                 }
                                 return null;
                               })()}
                             </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-4">
                             <div>
                               Valor: <span className="font-medium">{formatCurrency(registration.amount)}</span>
                             </div>
                             {registration.paymentDetails && registration.paymentDetails.paidAmount > 0 && (
                               <div>
                                 Pago: <span className="font-medium text-green-600">{formatCurrency(registration.paymentDetails.paidAmount)}</span>
                               </div>
                             )}
                             {registration.paymentDetails && registration.paymentDetails.pendingAmount > 0 && (
                               <div>
                                 Pendente: <span className="font-medium text-yellow-600">{formatCurrency(registration.paymentDetails.pendingAmount)}</span>
                               </div>
                             )}
                           </div>
                         )}
                         
                         <div>
                            Inscrição: {formatDateToBrazilian(registration.createdAt)}
                         </div>
                         
                         {registration.paymentDate && (
                           <div>
                              Pago em: {formatDateToBrazilian(registration.paymentDate)}
                           </div>
                         )}
                       </div>

                      {/* Categorias */}
                      {registration.categories && registration.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {registration.categories.map((regCategory) => (
                            <Badge key={regCategory.id} variant="outline" className="text-xs">
                              {regCategory.category.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPaymentDetails(registration.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncPayment(registration.id)}
                        disabled={refreshing}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                      
                      {/* Botão de pagamento apenas se houver valores pendentes */}
                      {(registration.paymentDetails && 
                        (registration.paymentDetails.pendingAmount > 0 || registration.paymentDetails.overdueAmount > 0)
                      ) && (
                        <Button
                          size="sm"
                          onClick={() => handleViewPayment(registration.id)}
                        >
                          Pagar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 