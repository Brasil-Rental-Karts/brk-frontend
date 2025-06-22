import React from 'react';
import { CreditCard, ExternalLink, AlertCircle, Shield } from 'lucide-react';
import { Button } from 'brk-design-system';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { SeasonRegistration, RegistrationPaymentData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';

interface CreditCardPaymentProps {
  paymentData: RegistrationPaymentData;
  registration: SeasonRegistration;
  onPaymentComplete: () => void;
}

export const CreditCardPayment: React.FC<CreditCardPaymentProps> = ({
  paymentData,
  registration
}) => {
  const handlePaymentRedirect = () => {
    if (paymentData.paymentLink) {
      window.open(paymentData.paymentLink, '_blank');
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

  const getInstallmentText = () => {
    console.log('=== DEBUG CREDIT CARD PAYMENT ===');
    console.log('paymentData.installmentCount:', paymentData.installmentCount);
    console.log('registration.amount:', registration.amount);
    console.log('paymentData:', paymentData);
    
    if (paymentData.installmentCount && paymentData.installmentCount > 1) {
      const installmentValue = registration.amount / paymentData.installmentCount;
      return `${paymentData.installmentCount}x de ${formatCurrency(installmentValue)}`;
    }
    
    return 'Pagamento à vista';
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
                {formatCurrency(registration.amount)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Parcelamento</p>
              <p className="text-lg font-semibold">
                {getInstallmentText()}
              </p>
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
              disabled={!paymentData.paymentLink}
              className="w-full md:w-auto"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Pagar com {getCardType()}
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
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 