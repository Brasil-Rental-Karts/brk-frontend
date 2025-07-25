import { Badge } from "brk-design-system";
import { format } from "date-fns";
import { CreditCard, QrCode } from "lucide-react";

import {
  RegistrationPaymentData,
  SeasonRegistration,
} from "@/lib/services/season-registration.service";

import { AsaasPaymentStatus, PaymentMethod } from "../../../lib/enums/payment";

interface PaymentInfoProps {
  registration: SeasonRegistration;
}

const getNextPayment = (registration: SeasonRegistration) => {
  if (!registration.payments || registration.payments.length === 0) {
    return null;
  }

  const pendingPayments = registration.payments
    .filter(
      (p: RegistrationPaymentData) => p.status === AsaasPaymentStatus.PENDING,
    )
    .sort(
      (a: RegistrationPaymentData, b: RegistrationPaymentData) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  return pendingPayments[0] || null;
};

const getStatusVariant = (status: AsaasPaymentStatus | string) => {
  switch (status) {
    case AsaasPaymentStatus.CONFIRMED:
    case AsaasPaymentStatus.RECEIVED:
    case AsaasPaymentStatus.RECEIVED_IN_CASH:
    case "EXEMPT":
    case "DIRECT_PAYMENT":
      return "success";
    case AsaasPaymentStatus.PENDING:
      return "warning";
    case AsaasPaymentStatus.OVERDUE:
    case AsaasPaymentStatus.REFUNDED:
    case AsaasPaymentStatus.REFUND_REQUESTED:
    case AsaasPaymentStatus.REFUND_IN_PROGRESS:
      return "destructive";
    case AsaasPaymentStatus.AWAITING_RISK_ANALYSIS:
      return "secondary";
    default:
      return "default";
  }
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case "cartao_credito":
      return <CreditCard className="h-3 w-3" />;
    case "pix":
      return <QrCode className="h-3 w-3" />;
    default:
      return null;
  }
};

const PaymentInfo = ({ registration }: PaymentInfoProps) => {
  // Verificar se é isento ou pagamento direto (status administrativos)
  if (registration.paymentStatus === "exempt") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Badge variant="success" className="flex items-center gap-1">
          Isento
        </Badge>
      </div>
    );
  }

  if (registration.paymentStatus === "direct_payment") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Badge variant="success" className="flex items-center gap-1">
          Pagamento Direto
        </Badge>
      </div>
    );
  }

  if (!registration.payments || registration.payments.length === 0) {
    return <Badge variant="secondary">Sem pagamento</Badge>;
  }

  const isInstallment = registration.payments.length > 1;

  if (isInstallment) {
    const totalPaid = registration.payments.filter(
      (p: RegistrationPaymentData) =>
        [
          AsaasPaymentStatus.CONFIRMED,
          AsaasPaymentStatus.RECEIVED,
          AsaasPaymentStatus.RECEIVED_IN_CASH,
          "EXEMPT",
          "DIRECT_PAYMENT",
        ].includes(p.status as AsaasPaymentStatus),
    ).length;
    const totalInstallments = registration.payments.length;

    // Verificar se há parcelas vencidas
    const overduePayments = registration.payments.filter(
      (p: RegistrationPaymentData) => p.status === AsaasPaymentStatus.OVERDUE,
    );

    // Se há parcelas vencidas, mostrar status "Vencido"
    if (overduePayments.length > 0) {
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="destructive" className="flex items-center gap-1">
            {getPaymentMethodIcon(registration.paymentMethod)}
            Vencido ({overduePayments.length} parcela
            {overduePayments.length > 1 ? "s" : ""})
          </Badge>
          <Badge variant="outline" className="text-xs">
            {totalPaid}/{totalInstallments} pagas
          </Badge>
        </div>
      );
    }

    if (totalPaid === totalInstallments) {
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="success">Parcelamento quitado</Badge>
        </div>
      );
    }

    const nextPayment = getNextPayment(registration);

    return (
      <div className="flex flex-col items-start gap-1">
        <Badge variant="outline" className="flex items-center gap-1">
          {getPaymentMethodIcon(registration.paymentMethod)}
          Parcelamento {totalPaid}/{totalInstallments} pago
        </Badge>
        {nextPayment && (
          <Badge
            variant={getStatusVariant(nextPayment.status as AsaasPaymentStatus)}
            className="text-xs"
          >
            Próximo venc: {format(new Date(nextPayment.dueDate), "dd/MM/yy")}
          </Badge>
        )}
      </div>
    );
  }

  // Single payment
  const payment = registration.payments[0];
  const variant = getStatusVariant(payment.status as AsaasPaymentStatus);

  const statusMap: Record<AsaasPaymentStatus | string, string> = {
    [AsaasPaymentStatus.PENDING]: "Pendente",
    [AsaasPaymentStatus.CONFIRMED]: `Pago (${
      payment.billingType === PaymentMethod.CREDIT_CARD
        ? "Crédito"
        : payment.billingType
    })`,
    [AsaasPaymentStatus.RECEIVED]: `Pago (${
      payment.billingType === PaymentMethod.CREDIT_CARD
        ? "Crédito"
        : payment.billingType
    })`,
    [AsaasPaymentStatus.OVERDUE]: "Vencido",
    [AsaasPaymentStatus.REFUNDED]: "Estornado",
    [AsaasPaymentStatus.RECEIVED_IN_CASH]: "Pago (Dinheiro)",
    [AsaasPaymentStatus.REFUND_REQUESTED]: "Reembolso Solicitado",
    [AsaasPaymentStatus.REFUND_IN_PROGRESS]: "Reembolso em Progresso",
    [AsaasPaymentStatus.CHARGEBACK_REQUESTED]: "Chargeback Solicitado",
    [AsaasPaymentStatus.CHARGEBACK_DISPUTE]: "Chargeback em Disputa",
    [AsaasPaymentStatus.AWAITING_CHARGEBACK_REVERSAL]:
      "Aguardando Reversão de Chargeback",
    [AsaasPaymentStatus.DUNNING_REQUESTED]: "Cobrança Solicitada",
    [AsaasPaymentStatus.DUNNING_RECEIVED]: "Cobrança Recebida",
    [AsaasPaymentStatus.AWAITING_RISK_ANALYSIS]: "Análise de Risco",
    [AsaasPaymentStatus.UNKNOWN]: "Desconhecido",
    EXEMPT: "Isento",
    DIRECT_PAYMENT: "Pagamento Direto",
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={variant} className="flex items-center gap-1">
        {getPaymentMethodIcon(registration.paymentMethod)}
        {statusMap[payment.status as AsaasPaymentStatus]}
      </Badge>
    </div>
  );
};

export default PaymentInfo;
