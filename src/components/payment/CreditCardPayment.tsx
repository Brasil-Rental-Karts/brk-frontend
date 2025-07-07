import React, { useState } from 'react';
import { CreditCard, ExternalLink, AlertCircle, Shield } from 'lucide-react';
import { Button } from 'brk-design-system';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { SeasonRegistration, RegistrationPaymentData, SeasonRegistrationService } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

interface CreditCardPaymentProps {
  paymentData: RegistrationPaymentData;
  registration: SeasonRegistration;
  onPaymentComplete: () => void;
}

export const CreditCardPayment: React.FC<CreditCardPaymentProps> = ({
  paymentData,
  registration,
  onPaymentComplete
}) => {
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const handlePaymentRedirect = async () => {
    if (!paymentData.paymentLink) {
      toast.error('Link de pagamento não disponível');
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
        toast.info('Atualizando valor do pagamento com as taxas do cartão...');
        
        // Aqui você pode implementar uma chamada para atualizar o valor no backend
        // Por enquanto, vamos apenas mostrar o aviso e continuar
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular atualização
        
        toast.success('Valor atualizado! Redirecionando para pagamento...');
      } catch (error) {
        toast.error('Erro ao atualizar valor do pagamento');
        setIsUpdatingPayment(false);
        return;
      }
      setIsUpdatingPayment(false);
    }

    // Redirecionar para o pagamento
    window.open(paymentData.paymentLink, '_blank');
    
    // Opcional: chamar callback se fornecido
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  const getCardIcon = () => {
    return (
      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
        <CreditCard className="w-4 h-4 text-white" />
      </div>
    );
  };

  const getCardType = () => {
    return 'Cartão de Crédito';
  };

  // Função para obter a taxa do Asaas para cartão de crédito
  const getAsaasCreditCardRate = (installments: number) => {
    const promotionalRates: Record<number, number> = {
      1: 1.99, // À vista
      2: 2.49, 3: 2.49, 4: 2.49, 5: 2.49, 6: 2.49, // 2 a 6 parcelas
      7: 2.99, 8: 2.99, 9: 2.99, 10: 2.99, 11: 2.99, 12: 2.99, // 7 a 12 parcelas
      13: 3.29, 14: 3.29, 15: 3.29, 16: 3.29, 17: 3.29, 18: 3.29, 19: 3.29, 20: 3.29, 21: 3.29 // 13 a 21 parcelas
    };
    return promotionalRates[installments] || 3.29;
  };

  // Função para calcular o valor total com taxas do Asaas
  const calculateTotalWithAsaasFees = (baseTotal: number, paymentMethod: string, installments: number) => {
    if (paymentMethod !== 'cartao_credito') {
      return baseTotal;
    }

    // Taxa fixa por transação
    const fixedFee = 0.49;
    
    // Taxa percentual baseada no número de parcelas
    const percentageRate = getAsaasCreditCardRate(installments);
    
    // Calcular taxa percentual
    const percentageFee = baseTotal * (percentageRate / 100);
    
    // Total com taxas
    return baseTotal + percentageFee + fixedFee;
  };

  // Função para calcular o valor base a partir do total com taxas
  const calculateBaseFromTotal = (totalWithFees: number, installments: number) => {
    const fixedFee = 0.49;
    const percentageRate = getAsaasCreditCardRate(installments);
    const percentageRateDecimal = percentageRate / 100;
    
    // Fórmula: total = base + (base * taxa%) + taxa_fixa
    // total = base * (1 + taxa%) + taxa_fixa
    // base = (total - taxa_fixa) / (1 + taxa%)
    const baseAmount = (totalWithFees - fixedFee) / (1 + percentageRateDecimal);
    return baseAmount;
  };

  // Função para obter o valor base da inscrição
  const getBaseAmount = () => {
    const installments = paymentData.installmentCount || 1;
    return calculateBaseFromTotal(registration.amount, installments);
  };

  // Obter o valor total correto (já inclui as taxas do Asaas)
  const getTotalAmountWithFees = () => {
    // O registration.amount já contém o valor total com as taxas do Asaas
    // pois foi calculado no frontend e enviado como totalAmount para o backend
    const totalWithFees = registration.amount;
    
    // Debug: verificar os valores
    console.log('[CreditCardPayment] Debug:', {
      registrationAmount: registration.amount,
      paymentDataValue: paymentData.value,
      installments: paymentData.installmentCount || 1,
      feeRate: getAsaasCreditCardRate(paymentData.installmentCount || 1),
      difference: Math.abs(paymentData.value - totalWithFees)
    });
    
    return totalWithFees;
  };

  const getInstallmentText = () => {
    const totalWithFees = getTotalAmountWithFees();
    
    if (paymentData.installmentCount && paymentData.installmentCount > 1) {
      const installmentValue = totalWithFees / paymentData.installmentCount;
      const feeRate = getAsaasCreditCardRate(paymentData.installmentCount);
      return `${paymentData.installmentCount}x de ${formatCurrency(installmentValue)} (taxa ${feeRate}% + R$ 0,49)`;
    }
    
    const feeRate = getAsaasCreditCardRate(1);
    return `Pagamento à vista (taxa ${feeRate}% + R$ 0,49)`;
  };

  return (
    <div className="space-y-6">
      {/* Status do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getCardIcon()}
            Pagamento via {getCardType()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-500 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Redirecionamento para pagamento seguro</strong>
              <br />
              Você será redirecionado para o ambiente seguro do Asaas para finalizar o pagamento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Detalhes do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes do Pagamento</CardTitle>
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
                Inclui taxa de {getAsaasCreditCardRate(paymentData.installmentCount || 1)}% + R$ 0,49
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Parcelamento</p>
              <p className="text-lg font-semibold">
                {getInstallmentText()}
              </p>
            </div>
          </div>

          {/* Detalhamento das Taxas */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-900 mb-1">Taxas do Gateway de Pagamento</p>
                <div className="text-orange-800 space-y-1">
                  <p>• Valor da inscrição: {formatCurrency(getBaseAmount())}</p>
                  <p>• Taxa Asaas: {getAsaasCreditCardRate(paymentData.installmentCount || 1)}% + R$ 0,49</p>
                  <p>• <strong>Total a pagar: {formatCurrency(getTotalAmountWithFees())}</strong></p>
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
                <p className="font-medium text-green-900 mb-1">Pagamento 100% seguro</p>
                <p className="text-green-800">
                  Seus dados são protegidos com criptografia SSL de 256 bits.
                  O pagamento é processado pelo Asaas, certificado PCI DSS.
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Pagamento */}
          <div className="flex justify-center pt-4">
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
                  Pagar {formatCurrency(getTotalAmountWithFees())}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cartões Aceitos */}
      <Card>
        <CardHeader>
          <CardTitle>Cartões Aceitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-sm">Visa</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-sm">Mastercard</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-sm">American Express</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-sm">Elo</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-sm">Hipercard</span>
            </Badge>
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
              <p className="font-medium">Clique em "Pagar com {getCardType()}"</p>
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

      {/* Informações Importantes */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Informações importantes:</p>
                <ul className="text-blue-800 space-y-1">
                  <li>• A aprovação do pagamento é imediata</li>
                  <li>• Certifique-se de que o cartão tem limite disponível</li>
                  <li>• Em caso de recusa, verifique os dados informados</li>
                  <li>• O ambiente de pagamento é 100% seguro e certificado</li>
                  <li>• Parcelamento disponível conforme política do cartão</li>
                  <li>• <strong>O valor final inclui as taxas do gateway de pagamento Asaas</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 