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
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye
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
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({
    registrations: [],
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0
  });

  const loadFinancialData = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user?.id]);

  const getPaymentStatusBadge = (registration: RegistrationWithPayments) => {
    if (!registration.paymentDetails) {
      // Fallback para status simples
      switch (registration.paymentStatus) {
        case 'paid':
          return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
        case 'pending':
        case 'processing':
          return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
        case 'failed':
        case 'overdue':
          return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>;
        default:
          return <Badge variant="outline">Desconhecido</Badge>;
      }
    }

    const { paidInstallments, totalInstallments, pendingAmount, overdueAmount } = registration.paymentDetails;

    // Se há parcelas vencidas
    if (overdueAmount > 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>;
    }

    // Se há parcelas pendentes
    if (pendingAmount > 0) {
      if (paidInstallments > 0) {
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Parcial ({paidInstallments}/{totalInstallments})
        </Badge>;
      }
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    }

    // Tudo pago
    return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'pix':
        return <Smartphone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'pix':
        return 'PIX';
      default:
        return method;
    }
  };

  const handleViewPaymentDetails = (registrationId: string) => {
    navigate(`/payment-details/${registrationId}`);
  };

  const renderMobileCards = () => (
    <div className="space-y-4">
      {financialData.registrations.map((registration) => (
        <Card key={registration.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {registration.season.championship?.name || 'Campeonato'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {registration.season.name}
                  </p>
                </div>
                {getPaymentStatusBadge(registration)}
              </div>

              {/* Payment Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {getPaymentMethodIcon(registration.paymentMethod)}
                <span>{getPaymentMethodLabel(registration.paymentMethod)}</span>
                {registration.paymentDetails && registration.paymentDetails.totalInstallments > 1 && (
                  <span>• {registration.paymentDetails.totalInstallments}x</span>
                )}
              </div>

              {/* Values */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-medium">{formatCurrency(registration.amount)}</span>
                </div>
                
                {registration.paymentDetails && (
                  <>
                    {registration.paymentDetails.paidAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Pago:</span>
                        <span className="font-medium">{formatCurrency(registration.paymentDetails.paidAmount)}</span>
                      </div>
                    )}
                    {registration.paymentDetails.pendingAmount > 0 && (
                      <div className="flex justify-between text-sm text-yellow-600">
                        <span>Pendente:</span>
                        <span className="font-medium">{formatCurrency(registration.paymentDetails.pendingAmount)}</span>
                      </div>
                    )}
                    {registration.paymentDetails.overdueAmount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Vencido:</span>
                        <span className="font-medium">{formatCurrency(registration.paymentDetails.overdueAmount)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Categories */}
              {registration.categories && registration.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {registration.categories.map((regCategory) => (
                    <Badge key={regCategory.id} variant="outline" className="text-xs">
                      {regCategory.category.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Date */}
              <div className="text-xs text-muted-foreground">
                Inscrição: {formatDateToBrazilian(registration.createdAt)}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewPaymentDetails(registration.id)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDesktopTable = () => (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-3 p-4 bg-muted/50 border-b font-medium text-sm">
        <div className="col-span-3">Campeonato / Temporada</div>
        <div className="col-span-2">Categorias</div>
        <div className="col-span-2">Pagamento</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Total</div>
        <div className="col-span-1">Pago</div>
        <div className="col-span-1">Pendente</div>
        <div className="col-span-1">Ações</div>
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {financialData.registrations.map((registration) => (
          <div key={registration.id} className="grid grid-cols-12 gap-3 p-4 hover:bg-muted/25 transition-colors items-center">
            <div className="col-span-3">
              <div className="font-medium text-sm">{registration.season.championship?.name || 'Campeonato'}</div>
              <div className="text-xs text-muted-foreground">{registration.season.name}</div>
            </div>
            <div className="col-span-2">
              {registration.categories && registration.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {registration.categories.map((regCategory) => (
                    <Badge key={regCategory.id} variant="outline" className="text-xs">
                      {regCategory.category.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(registration.paymentMethod)}
                <div className="flex flex-col">
                  <span className="text-sm">{getPaymentMethodLabel(registration.paymentMethod)}</span>
                  {registration.paymentDetails && registration.paymentDetails.totalInstallments > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {registration.paymentDetails.totalInstallments} parcelas
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-1">
              {getPaymentStatusBadge(registration)}
            </div>
            <div className="col-span-1 font-medium text-sm">
              {formatCurrency(registration.amount)}
            </div>
            <div className="col-span-1">
              {registration.paymentDetails && registration.paymentDetails.paidAmount > 0 ? (
                <span className="text-green-600 font-medium text-sm">
                  {formatCurrency(registration.paymentDetails.paidAmount)}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            <div className="col-span-1">
              {registration.paymentDetails && registration.paymentDetails.pendingAmount > 0 ? (
                <span className="text-yellow-600 font-medium text-sm">
                  {formatCurrency(registration.paymentDetails.pendingAmount)}
                </span>
              ) : registration.paymentDetails && registration.paymentDetails.overdueAmount > 0 ? (
                <span className="text-red-600 font-medium text-sm">
                  {formatCurrency(registration.paymentDetails.overdueAmount)}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            <div className="col-span-1 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewPaymentDetails(registration.id)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
              <>
                {isMobile ? renderMobileCards() : renderDesktopTable()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 