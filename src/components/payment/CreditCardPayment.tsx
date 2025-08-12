import { Button, Card, CardContent, CardHeader, CardTitle } from "brk-design-system";
import { AlertCircle, ExternalLink, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CreditCardFeesRate,
  CreditCardFeesService,
} from "@/lib/services/credit-card-fees.service";
import {
  RegistrationPaymentData,
  SeasonRegistration,
} from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";

interface CreditCardPaymentProps {
  paymentData: RegistrationPaymentData;
  registration: SeasonRegistration;
  onPaymentComplete: () => void;
}

export const CreditCardPayment: React.FC<CreditCardPaymentProps> = ({
  paymentData,
  registration,
  onPaymentComplete,
}) => {
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [feeRate, setFeeRate] = useState<CreditCardFeesRate | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const creditCardFeesService = new CreditCardFeesService();

  // Buscar taxas configuráveis para o campeonato
  useEffect(() => {
    const fetchFees = async () => {
      if (!registration.season?.championshipId) return;

      setLoadingFees(true);
      try {
        const installments = paymentData.installmentCount || 1;
        const rate = await creditCardFeesService.getRateForInstallments(
          registration.season.championshipId,
          installments,
        );
        setFeeRate(rate);
      } catch (error) {
        console.error("Erro ao buscar taxas configuráveis:", error);
        // Usar taxas padrão se não conseguir buscar
        setFeeRate({
          percentageRate: 3.29, // Taxa padrão para 13 a 21 parcelas
          fixedFee: 0.49,
          isDefault: true,
        });
      } finally {
        setLoadingFees(false);
      }
    };

    fetchFees();
  }, [registration.season?.championshipId, paymentData.installmentCount]);

  const handlePaymentRedirect = async () => {
    if (!paymentData.paymentLink) {
      toast.error("Link de pagamento não disponível");
      return;
    }

    // Verificar se o valor precisa ser atualizado
    const currentTotal = getTotalAmountWithFees();
    const originalTotal = registration.amount;

    // Se o valor original é menor que o valor com taxas, significa que as taxas não foram aplicadas
    // Mas como estamos no CreditCardPayment, sempre vamos mostrar o valor com taxas
    const needsUpdate = false; // Não precisamos atualizar, apenas mostrar o valor correto

    if (needsUpdate) {
      setIsUpdatingPayment(true);
      try {
        // Notificar que está atualizando o valor
        toast.info("Atualizando valor do pagamento com as taxas do cartão...");

        // Aqui você pode implementar uma chamada para atualizar o valor no backend
        // Por enquanto, vamos apenas mostrar o aviso e continuar
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular atualização

        toast.success("Valor atualizado! Redirecionando para pagamento...");
      } catch (error) {
        toast.error("Erro ao atualizar valor do pagamento");
        setIsUpdatingPayment(false);
        return;
      }
      setIsUpdatingPayment(false);
    }

    // Redirecionar para o pagamento
    window.open(paymentData.paymentLink, "_blank");

    // Opcional: chamar callback se fornecido
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  const getCardType = () => {
    return "Cartão de Crédito";
  };

  // Função para calcular o valor total com taxas configuráveis
  const calculateTotalWithConfigurableFees = (
    baseTotal: number,
    installments: number,
  ) => {
    if (!feeRate) {
      // Se não houver taxa configurada, retornar o valor base
      return baseTotal;
    }
    // Usar taxas configuráveis
    const percentageFee = baseTotal * (feeRate.percentageRate / 100);
    return baseTotal + percentageFee + feeRate.fixedFee;
  };

  // Função para calcular o valor base a partir do total com taxas
  const calculateBaseFromTotal = (
    totalWithFees: number,
    installments: number,
  ) => {
    if (!feeRate) {
      // Se não houver taxa configurada, retornar o valor total
      return totalWithFees;
    }
    const percentageRateDecimal = feeRate.percentageRate / 100;
    // Fórmula: total = base + (base * taxa%) + taxa_fixa
    // total = base * (1 + taxa%) + taxa_fixa
    // base = (total - taxa_fixa) / (1 + taxa%)
    const baseAmount =
      (totalWithFees - feeRate.fixedFee) / (1 + percentageRateDecimal);
    return baseAmount;
  };

  // Função para obter o valor base da inscrição
  const getBaseAmount = () => {
    try {
      const installments = paymentData.installmentCount || 1;
      return calculateBaseFromTotal(registration.amount, installments);
    } catch (err) {
      // Se não houver taxa configurada, retornar o valor original
      return registration.amount;
    }
  };

  // Obter o valor total correto (já inclui as taxas do Asaas)
  const getTotalAmountWithFees = () => {
    try {
      return registration.amount;
    } catch (err) {
      return 0;
    }
  };

  const getInstallmentText = () => {
    try {
      const totalWithFees = getTotalAmountWithFees();
      if (!feeRate) throw new Error();
      if (paymentData.installmentCount && paymentData.installmentCount > 1) {
        const installmentValue = totalWithFees / paymentData.installmentCount;
        return `${paymentData.installmentCount}x de ${formatCurrency(installmentValue)} (taxa ${feeRate.percentageRate}% + R$ ${Number(feeRate.fixedFee || 0).toFixed(2)})`;
      }
      return `Pagamento à vista (taxa ${feeRate.percentageRate}% + R$ ${Number(feeRate.fixedFee || 0).toFixed(2)})`;
    } catch (err) {
      return "Taxa de cartão de crédito não configurada. Solicite ao administrador.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Detalhes do Pagamento */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-lg">Detalhes do Pagamento</CardTitle>
          <Button
            onClick={handlePaymentRedirect}
            disabled={!paymentData.paymentLink || isUpdatingPayment}
            className="w-full md:w-auto"
            size="lg"
          >
            {isUpdatingPayment ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Atualizando...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Pagar com Cartão de Crédito
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Valor e Parcelamento */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(getTotalAmountWithFees())}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {loadingFees
                  ? "Carregando taxas..."
                  : feeRate
                    ? `Inclui taxa de ${feeRate.percentageRate}% + R$ ${Number(feeRate.fixedFee || 0).toFixed(2)}${feeRate.isDefault ? " (padrão)" : ""}`
                    : `Inclui taxa de 3.29% + R$ 0,49`}
              </p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Parcelamento</p>
              <p className="text-lg font-semibold">{getInstallmentText()}</p>
            </div>
          </div>

          {/* Detalhamento das Taxas */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-900 mb-1">
                  Taxas do Gateway de Pagamento
                </p>
                <div className="text-orange-800 space-y-1">
                  <p>• Valor da inscrição: {formatCurrency(getBaseAmount())}</p>
                  {feeRate ? (
                    <>
                      <p>
                        • Taxa configurada: {feeRate.percentageRate}% + R${" "}
                        {Number(feeRate.fixedFee || 0).toFixed(2)}
                      </p>
                      <p>
                        •{" "}
                        <strong>
                          Total a pagar:{" "}
                          {formatCurrency(getTotalAmountWithFees())}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        •{" "}
                        <strong>
                          Taxa não configurada para este campeonato
                        </strong>
                      </p>
                      <p>
                        •{" "}
                        <strong>
                          Total a pagar:{" "}
                          {formatCurrency(getTotalAmountWithFees())}
                        </strong>
                      </p>
                      <p className="text-xs text-orange-700 mt-2">
                        ⚠️ Solicite ao administrador que configure as taxas no
                        painel
                      </p>
                    </>
                  )}
                  <p className="text-xs text-orange-700 mt-2">
                    Taxas promocionais válidas até 16/09/2025
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    ✓ Usando valor já calculado pelo sistema
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações de Segurança */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 mb-1">
                  Pagamento 100% seguro
                </p>
                <p className="text-green-800">
                  Seus dados são protegidos com criptografia SSL de 256 bits. O
                  pagamento é processado pelo Asaas, certificado PCI DSS.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      

      

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como pagar com cartão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">
                Clique em "Pagar com {getCardType()}"
              </p>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para o ambiente seguro do Asaas
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Preencha os dados do cartão</p>
              <p className="text-sm text-muted-foreground">
                Informe o número, validade, CVV e dados do portador
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
                Escolha o parcelamento e confirme a compra
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              4
            </div>
            <div>
              <p className="font-medium">Receba a confirmação</p>
              <p className="text-sm text-muted-foreground">
                A aprovação é imediata e você receberá um e-mail de confirmação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
};
