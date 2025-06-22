import {
  RegistrationPaymentData,
  SeasonRegistration,
} from '@/lib/services/season-registration.service';
import { Badge } from 'brk-design-system';
import { AsaasPaymentStatus, PaymentMethod } from '../../../lib/enums/payment';
import { format } from 'date-fns';

interface PaymentInfoProps {
  registration: SeasonRegistration;
}

const getNextPayment = (registration: SeasonRegistration) => {
  if (!registration.payments || registration.payments.length === 0) {
    return null;
  }

  const pendingPayments = registration.payments
    .filter((p: RegistrationPaymentData) => p.status === AsaasPaymentStatus.PENDING)
    .sort(
      (a: RegistrationPaymentData, b: RegistrationPaymentData) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  return pendingPayments[0] || null;
};

const getStatusVariant = (status: AsaasPaymentStatus) => {
  switch (status) {
    case AsaasPaymentStatus.CONFIRMED:
    case AsaasPaymentStatus.RECEIVED:
      return 'success';
    case AsaasPaymentStatus.PENDING:
      return 'warning';
    case AsaasPaymentStatus.OVERDUE:
    case AsaasPaymentStatus.REFUNDED:
      return 'destructive';
    default:
      return 'default';
  }
};

const PaymentInfo = ({ registration }: PaymentInfoProps) => {
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
        ].includes(p.status as AsaasPaymentStatus),
    ).length;
    const totalInstallments = registration.payments.length;

    if (totalPaid === totalInstallments) {
      return <Badge variant="success">Carnê quitado</Badge>;
    }

    const nextPayment = getNextPayment(registration);

    return (
      <div className="flex flex-col items-start">
        <Badge variant="outline" className="mb-1">
          Carnê {totalPaid}/{totalInstallments} pago
        </Badge>
        {nextPayment && (
          <Badge variant={getStatusVariant(nextPayment.status as AsaasPaymentStatus)}>
            Próximo venc: {format(new Date(nextPayment.dueDate), 'dd/MM/yy')}
          </Badge>
        )}
      </div>
    );
  }

  // Single payment
  const payment = registration.payments[0];
  const variant = getStatusVariant(payment.status as AsaasPaymentStatus);

  const statusMap: Record<AsaasPaymentStatus, string> = {
    [AsaasPaymentStatus.PENDING]: 'Pendente',
    [AsaasPaymentStatus.CONFIRMED]: `Pago (${
      payment.billingType === PaymentMethod.CREDIT_CARD
        ? 'Crédito'
        : payment.billingType
    })`,
    [AsaasPaymentStatus.RECEIVED]: `Pago (${
      payment.billingType === PaymentMethod.CREDIT_CARD
        ? 'Crédito'
        : payment.billingType
    })`,
    [AsaasPaymentStatus.OVERDUE]: 'Vencido',
    [AsaasPaymentStatus.REFUNDED]: 'Devolvido',
    [AsaasPaymentStatus.RECEIVED_IN_CASH]: 'Pago (Dinheiro)',
    [AsaasPaymentStatus.REFUND_REQUESTED]: 'Reembolso Solicitado',
    [AsaasPaymentStatus.REFUND_IN_PROGRESS]: 'Reembolso em Progresso',
    [AsaasPaymentStatus.CHARGEBACK_REQUESTED]: 'Chargeback Solicitado',
    [AsaasPaymentStatus.CHARGEBACK_DISPUTE]: 'Chargeback em Disputa',
    [AsaasPaymentStatus.AWAITING_CHARGEBACK_REVERSAL]:
      'Aguardando Reversão de Chargeback',
    [AsaasPaymentStatus.DUNNING_REQUESTED]: 'Cobrança Solicitada',
    [AsaasPaymentStatus.DUNNING_RECEIVED]: 'Cobrança Recebida',
    [AsaasPaymentStatus.AWAITING_RISK_ANALYSIS]: 'Análise de Risco',
    [AsaasPaymentStatus.UNKNOWN]: 'Desconhecido',
  };

  return <Badge variant={variant}>{statusMap[payment.status as AsaasPaymentStatus]}</Badge>;
};

export default PaymentInfo; 