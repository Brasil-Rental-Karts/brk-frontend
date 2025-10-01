import {
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "brk-design-system";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { CreditCardPayment } from "@/components/payment/CreditCardPayment";
import { PixPayment } from "@/components/payment/PixPayment";
import { PageLoader } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { useUser } from "@/contexts/UserContext";
import {
  RegistrationPaymentData,
  SeasonRegistration,
  SeasonRegistrationService,
} from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";
import { compareDates, formatDateToBrazilian } from "@/utils/date";

const InstallmentList: React.FC<{ payments: RegistrationPaymentData[] }> = ({
  payments,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
      case "CONFIRMED":
      case "RECEIVED_IN_CASH":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case "PENDING":
      case "AWAITING_PAYMENT":
      case "AWAITING_RISK_ANALYSIS":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencido
          </Badge>
        );
      case "EXEMPT":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Isento
          </Badge>
        );
      case "DIRECT_PAYMENT":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pagamento Direto
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            .sort(
              (a, b) => (a.installmentNumber || 1) - (b.installmentNumber || 1),
            )
            .map((payment, index) => {
              const installmentNumber = payment.installmentNumber || index + 1;
              return (
                <li
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-primary">
                      {installmentNumber}ª
                    </div>
                    <div>
                      <div className="font-semibold">
                        {formatCurrency(payment.value)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Vencimento:{" "}
                        {formatDateToBrazilian(payment.dueDate)}
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
  const { refreshFinancial } = useUser();

  const [registration, setRegistration] = useState<SeasonRegistration | null>(
    null,
  );
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
      const registrationData =
        await SeasonRegistrationService.getById(registrationId);
      setRegistration(registrationData);

      // Tentar carregar dados de pagamento
      try {
        const paymentResponse =
          await SeasonRegistrationService.getPaymentData(registrationId);
        setPayments(paymentResponse || []);
      } catch (paymentError: unknown) {
        // Se não há dados de pagamento, criar um objeto padrão
        if (
          paymentError instanceof Error &&
          paymentError.message?.includes("não encontrados")
        ) {
          setPayments([]);
        } else {
          throw paymentError;
        }
      }

      // Se o pagamento foi confirmado, atualizar dados financeiros
      if (
        registrationData &&
        (registrationData.paymentStatus === "paid" ||
          registrationData.paymentStatus === "exempt" ||
          registrationData.paymentStatus === "direct_payment")
      ) {
        refreshFinancial();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro ao carregar dados do pagamento";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Verificar se há parâmetro success=true na URL
    const successParam = searchParams.get("success");
    if (successParam === "true") {
      // Mostrar toast de sucesso e limpar o parâmetro da URL
      setTimeout(() => {
        // Remove o parâmetro success da URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 100);
    }
  }, [registrationId, searchParams]);

  // Auto-refresh para pagamentos PIX (verifica status a cada 30 segundos)
  useEffect(() => {
    if (!registration || !payments.length) return;

    const pendingPixPayment = payments.find(
      (p) => p.billingType === "PIX" && p.status === "PENDING",
    );

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

  const renderPaymentMethod = () => {
    if (!payments.length || !registration) {
      return null;
    }

    // Lógica melhorada para encontrar a próxima parcela a ser paga
    // 1. Primeiro, procura por parcelas vencidas (OVERDUE) - prioridade máxima
    // 2. Depois, procura por parcelas pendentes (PENDING, AWAITING_PAYMENT, AWAITING_RISK_ANALYSIS)
    // 3. Ordena por número da parcela (installmentNumber) ou data de vencimento

    const overduePayments = payments.filter((p) => p.status === "OVERDUE");
    const pendingPayments = payments.filter(
      (p) =>
        p.status === "PENDING" ||
        p.status === "AWAITING_PAYMENT" ||
        p.status === "AWAITING_RISK_ANALYSIS",
    );

    if (overduePayments.length > 0) {
    }

    if (pendingPayments.length > 0) {
    }

    // Função para ordenar por número da parcela ou data de vencimento
    const sortPayments = (paymentsToSort: RegistrationPaymentData[]) => {
      return paymentsToSort.sort((a, b) => {
        // Primeiro tenta ordenar por installmentNumber
        if (a.installmentNumber && b.installmentNumber) {
          return a.installmentNumber - b.installmentNumber;
        }
        // Se não tem installmentNumber, ordena por data de vencimento
        return compareDates(a.dueDate || "9999-12-31", b.dueDate || "9999-12-31");
      });
    };

    let paymentToRender: RegistrationPaymentData | null = null;
    // Se vier paymentId via query param, tentar selecionar essa parcela
    const qpPaymentId = searchParams.get("paymentId");
    if (qpPaymentId) {
      paymentToRender = payments.find((p) => p.id === qpPaymentId) || null;
    }
    let selectionReason = "";

    // Prioridade 1: Parcelas vencidas (ordenadas por número/data)
    if (!paymentToRender && overduePayments.length > 0) {
      const sortedOverdue = sortPayments(overduePayments);
      paymentToRender = sortedOverdue[0];
      selectionReason = "OVERDUE_PRIORITY";
    }
    // Prioridade 2: Parcelas pendentes (ordenadas por número/data)
    else if (!paymentToRender && pendingPayments.length > 0) {
      const sortedPending = sortPayments(pendingPayments);
      paymentToRender = sortedPending[0];
      selectionReason = "PENDING_PRIORITY";
    }
    // Fallback: Primeira parcela da lista
    else if (!paymentToRender) {
      paymentToRender = payments[0];
      selectionReason = "FALLBACK_FIRST";
    }

    if (!paymentToRender) return null;

    switch (paymentToRender.billingType) {
      case "PIX":
        return (
          <PixPayment
            paymentData={paymentToRender}
            registration={registration}
            onPaymentComplete={() => loadData(true)}
            onPaymentUpdate={(updatedPayment) => {
              // Atualizar o estado local dos pagamentos
              setPayments((prevPayments) =>
                prevPayments.map((p) =>
                  p.id === updatedPayment.id ? updatedPayment : p,
                ),
              );
            }}
          />
        );

      case "CREDIT_CARD":
        return (
          <CreditCardPayment
            paymentData={paymentToRender}
            registration={registration}
            onPaymentComplete={() => loadData(true)}
          />
        );

      case "ADMIN_EXEMPT":
      case "ADMIN_DIRECT":
        return (
          <PixPayment
            paymentData={paymentToRender}
            registration={registration}
            onPaymentComplete={() => loadData(true)}
            onPaymentUpdate={(updatedPayment) => {
              // Atualizar o estado local dos pagamentos
              setPayments((prevPayments) =>
                prevPayments.map((p) =>
                  p.id === updatedPayment.id ? updatedPayment : p,
                ),
              );
            }}
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
          <p className="text-muted-foreground">
            ID da inscrição não encontrado
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageLoader message="Carregando pagamento da inscrição..." />;
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
              variant: "outline",
            },
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
          <p className="text-muted-foreground">
            Dados da inscrição não encontrados
          </p>
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
            variant: "outline",
          },
        ]}
      />

      <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Mensagem de Sucesso do Callback */}
        {searchParams.get("success") === "true" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Pagamento processado com sucesso! Aguarde a confirmação
              automática.
            </AlertDescription>
          </Alert>
        )}

        

        {/* Informações de Pagamento */}
        {(() => {
          // Para pagamentos parcelados, verificar se há parcelas pendentes
          if (payments.length > 1) {
            const pendingPayments = payments.filter(
              (p) =>
                p.status === "PENDING" ||
                p.status === "AWAITING_PAYMENT" ||
                p.status === "AWAITING_RISK_ANALYSIS" ||
                p.status === "OVERDUE",
            );

            // Se há parcelas pendentes, mostrar interface de pagamento
            if (pendingPayments.length > 0) {
              return false; // Não está totalmente pago
            }
          }

          // Para pagamento único ou todas as parcelas pagas
          const isPaid =
            registration.paymentStatus === "paid" ||
            registration.paymentStatus === "exempt" ||
            registration.paymentStatus === "direct_payment";
          return isPaid;
        })() ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 mb-2">
                  {registration.paymentStatus === "exempt"
                    ? "Inscrição Isenta!"
                    : registration.paymentStatus === "direct_payment"
                      ? "Pagamento Direto Confirmado!"
                      : "Pagamento Confirmado!"}
                </h3>
                <p className="text-muted-foreground">
                  {registration.paymentStatus === "exempt"
                    ? "Sua inscrição foi marcada como isenta pelo administrador."
                    : registration.paymentStatus === "direct_payment"
                      ? "Sua inscrição foi confirmada para pagamento direto."
                      : "Sua inscrição foi confirmada com sucesso."}
                </p>
                {registration.paymentDate && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Pago em:{" "}
                    {new Date(registration.paymentDate).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
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
              • Após o pagamento, aguarde alguns minutos para a confirmação
              automática
            </p>
            <p className="text-sm text-muted-foreground">
              • Em caso de dúvidas, entre em contato com a organização do
              campeonato
            </p>
            <p className="text-sm text-muted-foreground">
              • Mantenha o comprovante de pagamento até a confirmação da
              inscrição
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPayment;
