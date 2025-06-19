import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Skeleton } from 'brk-design-system';
import { PageHeader } from '@/components/ui/page-header';
import { SeasonRegistrationService, SeasonRegistration, RegistrationPaymentData } from '@/lib/services/season-registration.service';
import { PixPayment } from '@/components/payment/PixPayment';
import { BoletoPayment } from '@/components/payment/BoletoPayment';
import { CreditCardPayment } from '@/components/payment/CreditCardPayment';
import { formatCurrency } from '@/utils/currency';

const InstallmentList: React.FC<{ payments: RegistrationPaymentData[] }> = ({ payments }) => (
  <Card>
    <CardHeader>
      <CardTitle>Plano de Pagamento (Carnê)</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3">
        {payments.map((payment, index) => (
          <li key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-primary">{index + 1}</div>
              <div>
                <div className="font-semibold">{formatCurrency(payment.value)}</div>
                <div className="text-sm text-muted-foreground">
                  Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            <Badge variant={payment.status === 'PAID' ? 'default' : 'outline'}>
              {payment.status}
            </Badge>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export const RegistrationPayment: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();

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
      setRegistration(registrationData);

      // Tentar carregar dados de pagamento
      try {
        const paymentResponse = await SeasonRegistrationService.getPaymentData(registrationId);
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
  }, [registrationId]);

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

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const getStatusBadge = (status: string) => {
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
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-gray-600">
            Cancelado
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
    if (!payments.length || !registration) return null;

    // Encontra o primeiro pagamento pendente, ou o primeiro da lista se nenhum estiver pendente
    const paymentToRender = payments.find(p => p.status === 'PENDING' || p.status === 'AWAITING_RISK_ANALYSIS') || payments[0];

    switch (paymentToRender.billingType) {
      case 'PIX':
        return (
          <PixPayment
            paymentData={paymentToRender}
            registration={registration}
            onPaymentComplete={() => loadData(true)}
          />
        );
      case 'BOLETO':
        return (
          <BoletoPayment
            paymentData={paymentToRender}
            registration={registration}
            onPaymentComplete={() => loadData(true)}
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
          },
          {
            label: refreshing ? "Atualizando..." : "Atualizar Status",
            onClick: handleRefresh,
            disabled: refreshing,
            variant: "default"
          }
        ]}
      />
      
      <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
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
        {registration.paymentStatus === 'paid' ? (
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