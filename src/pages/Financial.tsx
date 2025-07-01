import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Button } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { InlineLoader } from '@/components/ui/loading';
import { Pagination } from 'brk-design-system';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'brk-design-system';

import { SeasonRegistrationService, SeasonRegistration } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { formatDateToBrazilian } from '@/utils/date';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePagination } from '@/hooks/usePagination';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye,
  Loader2
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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({
    registrations: [],
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0
  });

  // --- Estados para paginação desktop ---
  const pagination = usePagination(financialData.registrations.length, 5, 1);
  const paginatedDesktopRegistrations = useMemo(() => {
    if (isMobile) return [];
    return financialData.registrations.slice(pagination.info.startIndex, pagination.info.endIndex);
  }, [isMobile, financialData.registrations, pagination.info.startIndex, pagination.info.endIndex]);

  // --- Estados para scroll infinito mobile ---
  const [visibleMobileRegistrations, setVisibleMobileRegistrations] = useState<RegistrationWithPayments[]>([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const itemsPerPage = 5;

  // Resetar scroll infinito quando os dados mudam
  useEffect(() => {
    if (isMobile) {
      setVisibleMobileRegistrations(financialData.registrations.slice(0, itemsPerPage));
      setMobilePage(2);
      setHasMore(financialData.registrations.length > itemsPerPage);
    }
  }, [isMobile, financialData.registrations]);

  // Intersection Observer para carregar mais no mobile
  const lastRegistrationElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoadingMore(true);
        setTimeout(() => {
          const newRegistrations = financialData.registrations.slice(0, mobilePage * itemsPerPage);
          setVisibleMobileRegistrations(newRegistrations);
          setHasMore(newRegistrations.length < financialData.registrations.length);
          setMobilePage(prev => prev + 1);
          setLoadingMore(false);
        }, 300);
      }
    });

    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, mobilePage, financialData.registrations]);

  // Define os dados a serem processados com base no dispositivo
  const processedRegistrations = isMobile ? visibleMobileRegistrations : paginatedDesktopRegistrations;

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar todas as inscrições do usuário
      const registrations = await SeasonRegistrationService.getMyRegistrations();
      
      // Verificar se há inscrições com pagamentos pendentes
      const registrationsWithPendingPayments = [];
      for (const reg of registrations) {
        try {
          const payments = await SeasonRegistrationService.getPaymentData(reg.id);
          if (payments && payments.some(p => ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(p.status))) {
            registrationsWithPendingPayments.push(reg.id);
          }
        } catch (error) {
          console.warn(`Erro ao verificar pagamentos pendentes da inscrição ${reg.id}:`, error);
        }
      }
      
      // Se há pagamentos pendentes, mostrar indicador de sincronização
      if (registrationsWithPendingPayments.length > 0) {
        setSyncing(true);
      }
      
      // Buscar detalhes de pagamento para cada inscrição
      const registrationsWithPayments: RegistrationWithPayments[] = await Promise.all(
        registrations.map(async (reg) => {
          try {
            const payments = await SeasonRegistrationService.getPaymentData(reg.id);
            
            if (payments && payments.length > 0) {
              // Verificar se há pagamentos pendentes que precisam ser sincronizados
              const pendingPaymentsToSync = payments.filter(p => 
                ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(p.status)
              );
              
              // Sincronizar pagamentos pendentes com o Asaas
              if (pendingPaymentsToSync.length > 0) {
                try {
                  await SeasonRegistrationService.syncPaymentStatus(reg.id);
                  
                  // Buscar dados atualizados após a sincronização
                  const updatedPayments = await SeasonRegistrationService.getPaymentData(reg.id);
                  if (updatedPayments) {
                    // Usar os dados atualizados
                    payments.splice(0, payments.length, ...updatedPayments);
                  }
                } catch (syncError) {
                  console.warn(`⚠️ Erro ao sincronizar pagamentos da inscrição ${reg.id}:`, syncError);
                  // Continuar com os dados originais em caso de erro
                }
              }
              
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
                paidInstallments: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? 1 : 0,
                paidAmount: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? Number(reg.amount) : 0,
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
                paidInstallments: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? 1 : 0,
                paidAmount: ['paid', 'exempt', 'direct_payment'].includes(reg.paymentStatus) ? reg.amount : 0,
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
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user?.id]);

  const getPaymentStatusBadge = (registration: RegistrationWithPayments) => {
    // Verificar se é inscrição administrativa
    if (registration.paymentStatus === 'exempt') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Isento</Badge>;
    }
    
    if (registration.paymentStatus === 'direct_payment') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pagamento Direto</Badge>;
    }

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

  const getPaymentMethodLabel = (method: string, paymentStatus?: string) => {
    // Para inscrições administrativas, mostrar texto amigável
    if (paymentStatus === 'exempt') {
      return 'Isento';
    }
    
    if (paymentStatus === 'direct_payment') {
      return 'Pagamento Direto';
    }

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
      {processedRegistrations.map((registration, index) => (
        <div key={registration.id} ref={processedRegistrations.length === index + 1 ? lastRegistrationElementRef : null}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {registration.season.championship?.name || 'Campeonato'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {registration.season.name}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getPaymentStatusBadge(registration)}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getPaymentMethodIcon(registration.paymentMethod)}
                  <span className="truncate">{getPaymentMethodLabel(registration.paymentMethod, registration.paymentStatus)}</span>
                  {registration.paymentDetails && registration.paymentDetails.totalInstallments > 1 && (
                    <span className="flex-shrink-0">• {registration.paymentDetails.totalInstallments}x</span>
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
                    {registration.categories.slice(0, 3).map((regCategory) => (
                      <Badge key={regCategory.id} variant="outline" className="text-xs truncate">
                        {regCategory.category.name}
                      </Badge>
                    ))}
                    {registration.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{registration.categories.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stages (se for inscrição por etapa) */}
                {registration.season.inscriptionType === 'por_etapa' && registration.stages && registration.stages.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Etapas Inscritas:</div>
                    <div className="flex flex-wrap gap-1">
                      {registration.stages.slice(0, 3).map((regStage) => (
                        <Badge key={regStage.id} variant="secondary" className="text-xs truncate">
                          {regStage.stage.name}
                        </Badge>
                      ))}
                      {registration.stages.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{registration.stages.length - 3}
                        </Badge>
                      )}
                    </div>
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
        </div>
      ))}
      
      {/* Loading indicator */}
      {loadingMore && (
        <div className="flex justify-center items-center py-4">
          <InlineLoader size="sm" />
        </div>
      )}
      
      {/* End of results indicator */}
      {!loadingMore && !hasMore && processedRegistrations.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Fim dos resultados.
        </div>
      )}
    </div>
  );

  const renderDesktopTable = () => (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 border-b font-medium text-sm">
        <div className="col-span-2">Campeonato / Temporada</div>
        <div className="col-span-1">Categorias</div>
        <div className="col-span-1">Pagamento</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Ações</div>
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {processedRegistrations.map((registration) => (
          <div key={registration.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-muted/25 transition-colors items-center">
            <div className="col-span-2">
              <div className="font-medium text-sm truncate">{registration.season.championship?.name || 'Campeonato'}</div>
              <div className="text-xs text-muted-foreground truncate">{registration.season.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(registration.amount)}
                {registration.paymentDetails && (
                  <>
                    {registration.paymentDetails.paidAmount > 0 && (
                      <span className="text-green-600 ml-2">• Pago: {formatCurrency(registration.paymentDetails.paidAmount)}</span>
                    )}
                    {registration.paymentDetails.pendingAmount > 0 && (
                      <span className="text-yellow-600 ml-2">• Pendente: {formatCurrency(registration.paymentDetails.pendingAmount)}</span>
                    )}
                    {registration.paymentDetails.overdueAmount > 0 && (
                      <span className="text-red-600 ml-2">• Vencido: {formatCurrency(registration.paymentDetails.overdueAmount)}</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="col-span-1">
              {registration.categories && registration.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1 max-w-full">
                  {registration.categories.slice(0, 2).map((regCategory) => (
                    <Badge key={regCategory.id} variant="outline" className="text-xs truncate">
                      {regCategory.category.name}
                    </Badge>
                  ))}
                  {registration.categories.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{registration.categories.length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
              
              {/* Stages (se for inscrição por etapa) */}
              {registration.season.inscriptionType === 'por_etapa' && registration.stages && registration.stages.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Etapas:</div>
                  <div className="flex flex-wrap gap-1">
                    {registration.stages.slice(0, 2).map((regStage) => (
                      <Badge key={regStage.id} variant="secondary" className="text-xs truncate">
                        {regStage.stage.name}
                      </Badge>
                    ))}
                    {registration.stages.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{registration.stages.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-1">
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(registration.paymentMethod)}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm truncate">{getPaymentMethodLabel(registration.paymentMethod, registration.paymentStatus)}</span>
                  {registration.paymentDetails && registration.paymentDetails.totalInstallments > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {registration.paymentDetails.totalInstallments}x
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-1">
              {getPaymentStatusBadge(registration)}
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
          <InlineLoader size="lg" />
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
        subtitle={syncing ? "Sincronizando status dos pagamentos..." : "Acompanhe seus pagamentos e inscrições"}
        actions={[
          {
            label: syncing ? "Sincronizando..." : "Atualizar",
            onClick: () => loadFinancialData(),
            disabled: syncing,
            variant: "default"
          }
        ]}
      />
      
      {/* Indicador de Sincronização */}
      {syncing && (
        <div className="w-full max-w-6xl mx-auto px-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Sincronizando pagamentos...</strong> Verificando status atualizado com o sistema de pagamentos.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
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
                  return '';
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
        {isMobile ? (
          renderMobileCards()
        ) : (
          <Card className="w-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">Campeonato / Temporada</TableHead>
                    <TableHead className="min-w-[120px]">Categorias</TableHead>
                    <TableHead className="min-w-[120px]">Pagamento</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma inscrição encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div className="font-medium text-sm truncate">{registration.season.championship?.name || 'Campeonato'}</div>
                          <div className="text-xs text-muted-foreground truncate">{registration.season.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Total: {formatCurrency(registration.amount)}
                            {registration.paymentDetails && (
                              <>
                                {registration.paymentDetails.paidAmount > 0 && (
                                  <span className="text-green-600 ml-2">• Pago: {formatCurrency(registration.paymentDetails.paidAmount)}</span>
                                )}
                                {registration.paymentDetails.pendingAmount > 0 && (
                                  <span className="text-yellow-600 ml-2">• Pendente: {formatCurrency(registration.paymentDetails.pendingAmount)}</span>
                                )}
                                {registration.paymentDetails.overdueAmount > 0 && (
                                  <span className="text-red-600 ml-2">• Vencido: {formatCurrency(registration.paymentDetails.overdueAmount)}</span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {registration.categories && registration.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-full">
                              {registration.categories.slice(0, 2).map((regCategory) => (
                                <Badge key={regCategory.id} variant="outline" className="text-xs truncate">
                                  {regCategory.category.name}
                                </Badge>
                              ))}
                              {registration.categories.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{registration.categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(registration.paymentMethod)}
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm truncate">{getPaymentMethodLabel(registration.paymentMethod, registration.paymentStatus)}</span>
                              {registration.paymentDetails && registration.paymentDetails.totalInstallments > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  {registration.paymentDetails.totalInstallments}x
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(registration)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPaymentDetails(registration.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Paginação sempre fixada na parte inferior */}
            <div className="flex-shrink-0">
              <Pagination
                currentPage={pagination.state.currentPage}
                totalPages={pagination.info.totalPages}
                itemsPerPage={pagination.state.itemsPerPage}
                totalItems={pagination.state.totalItems}
                startIndex={pagination.info.startIndex}
                endIndex={pagination.info.endIndex}
                hasNextPage={pagination.info.hasNextPage}
                hasPreviousPage={pagination.info.hasPreviousPage}
                onPageChange={pagination.actions.setCurrentPage}
                onItemsPerPageChange={pagination.actions.setItemsPerPage}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}; 