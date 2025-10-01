import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "brk-design-system";
import { AlertCircle, Check, CheckCircle, Copy } from "lucide-react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import React, { useState } from "react";

import { useUser } from "@/contexts/UserContext";
import {
  RegistrationPaymentData,
  SeasonRegistration,
} from "@/lib/services/season-registration.service";
import { SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";

interface PixPaymentProps {
  paymentData: RegistrationPaymentData;
  registration: SeasonRegistration;
  onPaymentComplete: () => void;
  onPaymentUpdate?: (updatedPayment: RegistrationPaymentData) => void;
}

export const PixPayment: React.FC<PixPaymentProps> = ({
  paymentData,
  registration,
  onPaymentComplete,
  onPaymentUpdate,
}) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const { refreshFinancial } = useUser();

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  // Trata datas no formato YYYY-MM-DD como fim do dia local (23:59:59.999)
  const parseAsLocalEndOfDay = (dateInput: string | Date): Date => {
    if (!dateInput) return new Date(8640000000000000); // max date
    if (dateInput instanceof Date) return dateInput;
    const ymd = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      const [, y, m, d] = ymd;
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 23, 59, 59, 999);
    }
    return new Date(dateInput);
  };

  const formatExpirationTime = (expirationDate: string) => {
    const expiration = parseAsLocalEndOfDay(expirationDate);
    const now = new Date();
    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Expirado";
    }

    // Calcular diferenças em diferentes unidades
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    // Mostrar em meses se for mais de 30 dias
    if (diffMonths > 0) {
      const remainingDays = diffDays % 30;
      if (remainingDays > 0) {
        return `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"} e ${remainingDays} ${remainingDays === 1 ? "dia" : "dias"}`;
      }
      return `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
    }

    // Mostrar em semanas se for mais de 7 dias
    if (diffWeeks > 0) {
      const remainingDays = diffDays % 7;
      if (remainingDays > 0) {
        return `${diffWeeks} ${diffWeeks === 1 ? "semana" : "semanas"} e ${remainingDays} ${remainingDays === 1 ? "dia" : "dias"}`;
      }
      return `${diffWeeks} ${diffWeeks === 1 ? "semana" : "semanas"}`;
    }

    // Mostrar em dias se for mais de 24 horas
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      if (remainingHours > 0) {
        return `${diffDays} ${diffDays === 1 ? "dia" : "dias"} e ${remainingHours}h`;
      }
      return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
    }

    // Mostrar em horas e minutos se for menos de 24 horas
    if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `${diffHours}h ${remainingMinutes}m`;
      }
      return `${diffHours}h`;
    }

    // Mostrar apenas minutos se for menos de 1 hora
    return `${diffMinutes}m`;
  };

  const isPaymentConfirmed = () => {
    return (
      paymentData.status === "CONFIRMED" ||
      paymentData.status === "RECEIVED" ||
      paymentData.status === "EXEMPT" ||
      paymentData.status === "DIRECT_PAYMENT"
    );
  };

  const isExpired = () => {
    if (!paymentData.expirationDate && !paymentData.dueDate) return false;
    const dateToCheck = paymentData.expirationDate || paymentData.dueDate;
    return parseAsLocalEndOfDay(dateToCheck) <= new Date();
  };

  const getExpirationText = () => {
    if (paymentData.expirationDate) {
      return formatExpirationTime(paymentData.expirationDate);
    }
    if (paymentData.dueDate) {
      return formatExpirationTime(paymentData.dueDate);
    }
    return "24h";
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmado";
      case "RECEIVED":
        return "Recebido";
      case "EXEMPT":
        return "Isento";
      case "DIRECT_PAYMENT":
        return "Pagamento Direto";
      case "PENDING":
        return "Pendente";
      case "AWAITING_PAYMENT":
        return "Aguardando Pagamento";
      case "AWAITING_RISK_ANALYSIS":
        return "Aguardando Análise";
      case "OVERDUE":
        return "Vencido";
      case "CANCELLED":
        return "Cancelado";
      case "REFUNDED":
        return "Reembolsado";
      default:
        return status;
    }
  };

  const handleCheckPayment = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      // Sincronizar com o Asaas
      await SeasonRegistrationService.syncPaymentStatus(
        paymentData.registrationId,
      );

      // Buscar dados atualizados após a sincronização
      const updatedPayments = await SeasonRegistrationService.getPaymentData(
        paymentData.registrationId,
      );
      const updatedPayment = updatedPayments?.find(
        (p) => p.id === paymentData.id,
      );

      if (!updatedPayment) {
        setCheckResult("Pagamento não encontrado após sincronização.");
      } else if (
        updatedPayment.status === "CONFIRMED" ||
        updatedPayment.status === "RECEIVED"
      ) {
        setCheckResult("✅ Pagamento confirmado com sucesso!");
        // Atualizar o estado local do pagamento
        if (onPaymentUpdate) {
          onPaymentUpdate(updatedPayment);
        }
        // Atualizar dados financeiros do dashboard
        refreshFinancial();
      } else if (updatedPayment.status === "PENDING") {
        setCheckResult(
          "⏳ Pagamento ainda não foi identificado. Aguarde alguns minutos e tente novamente.",
        );
      } else if (updatedPayment.status === "DIRECT_PAYMENT") {
        setCheckResult("✅ Pagamento direto confirmado pelo administrador!");
        if (onPaymentUpdate) {
          onPaymentUpdate(updatedPayment);
        }
        refreshFinancial();
      } else if (updatedPayment.status === "EXEMPT") {
        setCheckResult("✅ Inscrição isenta confirmada pelo administrador!");
        if (onPaymentUpdate) {
          onPaymentUpdate(updatedPayment);
        }
        refreshFinancial();
      } else {
        setCheckResult(
          `Status atual: ${getStatusDisplayText(updatedPayment.status)}`,
        );
      }
    } catch (error: any) {
      console.error("Erro ao verificar pagamento:", error);
      setCheckResult(
        "❌ Erro ao consultar o status do pagamento. Tente novamente.",
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      

      {/* QR Code e Código PIX Copia e Cola */}
      {!isExpired() &&
        !isPaymentConfirmed() &&
        paymentData.pixCopyPaste &&
        paymentData.billingType !== "ADMIN_EXEMPT" &&
        paymentData.billingType !== "ADMIN_DIRECT" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Código PIX Copia e Cola */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Código PIX Copia e Cola
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Copie e cole no seu app de pagamento
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Valor */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {paymentData.installmentCount &&
                    paymentData.installmentCount > 1
                      ? `Valor da ${paymentData.installmentNumber || 1}ª parcela`
                      : "Valor"}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(paymentData.value)}
                  </p>
                  {paymentData.installmentCount &&
                    paymentData.installmentCount > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {paymentData.installmentCount}x de{" "}
                        {formatCurrency(paymentData.value)}
                        (Total: {formatCurrency(registration.amount)})
                      </p>
                    )}
                </div>

                {/* Código PIX Copia e Cola */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Código PIX Copia e Cola:
                  </label>

                  {/* Botão de Copiar - Full Width */}
                  <Button
                    onClick={() =>
                      handleCopy(paymentData.pixCopyPaste || "", "pixCode")
                    }
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {copySuccess === "pixCode" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Código PIX Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código PIX</span>
                      </>
                    )}
                  </Button>

                  {/* Área do Código PIX */}
                  <div className="w-full p-3 bg-muted rounded-lg font-mono text-xs break-all max-h-20 overflow-y-auto overflow-x-hidden">
                    {paymentData.pixCopyPaste}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code PIX</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Escaneie o código com seu banco ou carteira digital
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-2 md:p-4 rounded-lg inline-block shadow-sm border">
                  <QRCode
                    value={paymentData.pixCopyPaste}
                    size={150}
                    level="M"
                    className="w-32 h-32 md:w-48 md:h-48"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use a câmera do seu celular ou app do banco
                </p>
                {/* Botão Já Paguei! */}
                <div className="mt-4">
                  <Button
                    onClick={handleCheckPayment}
                    disabled={checking}
                    variant="outline"
                  >
                    {checking ? "Verificando..." : "Já Paguei!"}
                  </Button>
                  {checkResult && (
                    <div className="mt-2 text-sm text-center text-black">
                      {checkResult}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Status do Pagamento */}
      {!isPaymentConfirmed() && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    paymentData.status === "DIRECT_PAYMENT"
                      ? "bg-purple-500"
                      : paymentData.status === "EXEMPT"
                        ? "bg-blue-500"
                        : "bg-[#00D4AA]"
                  }`}
                >
                  <span className="text-white font-bold text-sm">
                    {paymentData.status === "DIRECT_PAYMENT"
                      ? "ADM"
                      : paymentData.status === "EXEMPT"
                        ? "IS"
                        : "Pix"}
                  </span>
                </div>
                <div>
                  <div>
                    {paymentData.status === "DIRECT_PAYMENT"
                      ? "Pagamento Direto"
                      : paymentData.status === "EXEMPT"
                        ? "Inscrição Isenta"
                        : "Pagamento via PIX"}
                  </div>
                  {paymentData.installmentCount &&
                    paymentData.installmentCount > 1 && (
                      <div className="text-sm font-normal text-muted-foreground">
                        Parcelado em {paymentData.installmentCount}x
                      </div>
                    )}
                </div>
              </CardTitle>

              {(paymentData.expirationDate || paymentData.dueDate) &&
                !isPaymentConfirmed() && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Expira em:</p>
                    <p
                      className={`text-sm font-medium ${isExpired() ? "text-destructive" : "text-orange-600"}`}
                    >
                      {getExpirationText()}
                    </p>
                  </div>
                )}
            </div>
          </CardHeader>
          <CardContent>
            {isExpired() ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este código PIX expirou. Gere uma nova cobrança para
                  continuar.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert
                className={`${
                  paymentData.status === "DIRECT_PAYMENT"
                    ? "border-purple-200 bg-purple-50"
                    : paymentData.status === "EXEMPT"
                      ? "border-blue-200 bg-blue-50"
                      : "border-[#00D4AA] bg-[#00D4AA]/5"
                }`}
              >
                <AlertDescription
                  className={`${
                    paymentData.status === "DIRECT_PAYMENT"
                      ? "text-purple-800"
                      : paymentData.status === "EXEMPT"
                        ? "text-blue-800"
                        : "text-[#00D4AA]"
                  }`}
                >
                  <strong>
                    {paymentData.status === "DIRECT_PAYMENT"
                      ? "Inscrição confirmada para pagamento direto"
                      : paymentData.status === "EXEMPT"
                        ? "Inscrição isenta de pagamento"
                        : paymentData.installmentCount &&
                            paymentData.installmentCount > 1
                          ? `Aguardando pagamento da ${paymentData.installmentNumber || 1}ª parcela via PIX`
                          : "Aguardando pagamento via PIX"}
                  </strong>
                  <br />
                  {paymentData.status === "DIRECT_PAYMENT" ? (
                    "O administrador irá processar o pagamento diretamente. Entre em contato para mais informações."
                  ) : paymentData.status === "EXEMPT" ? (
                    "Sua inscrição foi aprovada sem necessidade de pagamento."
                  ) : (
                    <>
                      {paymentData.installmentCount &&
                        paymentData.installmentCount > 1 && (
                          <>
                            As próximas parcelas serão enviadas por email nas
                            datas de vencimento.
                            <br />
                          </>
                        )}
                      Após o pagamento, a confirmação será automática em alguns
                      minutos.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem para pagamentos administrativos */}
      {!isExpired() &&
        !isPaymentConfirmed() &&
        (paymentData.billingType === "ADMIN_EXEMPT" ||
          paymentData.billingType === "ADMIN_DIRECT") && (
          <Card>
            <CardContent className="pt-6">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Inscrição Administrativa</strong>
                  <br />
                  {paymentData.billingType === "ADMIN_EXEMPT"
                    ? "Esta inscrição foi marcada como isenta de pagamento pelo administrador."
                    : "Esta inscrição foi marcada para pagamento direto pelo administrador."}
                  <br />
                  Entre em contato com a organização para mais informações.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

      {/* Mensagem de erro se não há payload PIX */}
      {!isExpired() &&
        !isPaymentConfirmed() &&
        !paymentData.pixCopyPaste &&
        paymentData.billingType !== "ADMIN_EXEMPT" &&
        paymentData.billingType !== "ADMIN_DIRECT" && (
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro: Código PIX não disponível. Entre em contato com o
                  suporte.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

      {/* Mensagem de Sucesso quando Pago */}
      {isPaymentConfirmed() && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  {paymentData.status === "DIRECT_PAYMENT"
                    ? "Pagamento Direto Confirmado!"
                    : paymentData.status === "EXEMPT"
                      ? "Inscrição Isenta Confirmada!"
                      : "Pagamento Confirmado com Sucesso!"}
                </h3>
                <p className="text-green-700">
                  {paymentData.status === "DIRECT_PAYMENT"
                    ? "Sua inscrição foi confirmada para pagamento direto pelo administrador."
                    : paymentData.status === "EXEMPT"
                      ? "Sua inscrição foi marcada como isenta de pagamento pelo administrador."
                      : "Seu pagamento foi processado e confirmado pelo sistema de pagamentos."}
                </p>
                {paymentData.installmentCount &&
                  paymentData.installmentCount > 1 && (
                    <p className="text-sm text-green-600 mt-2">
                      Parcela {paymentData.installmentNumber || 1} de{" "}
                      {paymentData.installmentCount} paga.
                    </p>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!isPaymentConfirmed() && (
        <Card>
          <CardHeader>
            <CardTitle>Como pagar com PIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Escaneie o QR Code</p>
                <p className="text-sm text-muted-foreground">
                  Use a câmera do seu celular ou abra o app do seu banco
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Ou copie a chave PIX</p>
                <p className="text-sm text-muted-foreground">
                  Cole no seu app de pagamento e confirme o valor
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Confirme o pagamento</p>
                <p className="text-sm text-muted-foreground">
                  A confirmação será automática em alguns minutos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      
    </div>
  );
};
