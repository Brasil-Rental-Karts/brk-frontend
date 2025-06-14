import React from 'react';
import { Download, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from 'brk-design-system';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { SeasonRegistration, RegistrationPaymentData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';

interface BoletoPaymentProps {
  paymentData: RegistrationPaymentData;
  registration: SeasonRegistration;
  onPaymentComplete: () => void;
}

export const BoletoPayment: React.FC<BoletoPaymentProps> = ({
  paymentData,
  registration
}) => {
  const formatExpirationDate = (expirationDate: string) => {
    return new Date(expirationDate).toLocaleDateString('pt-BR');
  };

  const isExpired = () => {
    if (!paymentData.expirationDate && !paymentData.dueDate) return false;
    const dateToCheck = paymentData.expirationDate || paymentData.dueDate;
    return new Date(dateToCheck) <= new Date();
  };

  const getExpirationDate = () => {
    return paymentData.expirationDate || paymentData.dueDate;
  };

  const handleDownloadBoleto = () => {
    if (paymentData.bankSlipUrl || paymentData.invoiceUrl) {
      window.open(paymentData.bankSlipUrl || paymentData.invoiceUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status do Pagamento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">Bol</span>
              </div>
              Pagamento via Boleto
            </CardTitle>
            
            {getExpirationDate() && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Vencimento:</p>
                <p className={`text-sm font-medium ${isExpired() ? 'text-destructive' : 'text-orange-600'}`}>
                  {formatExpirationDate(getExpirationDate()!)}
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
                Este boleto está vencido. Entre em contato para gerar uma nova cobrança.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-500 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Aguardando pagamento do boleto</strong>
                <br />
                Após o pagamento, a confirmação pode levar até 2 dias úteis.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Download do Boleto */}
      {!isExpired() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Boleto Bancário</CardTitle>
            <p className="text-sm text-muted-foreground">
              Faça o download do boleto para pagamento
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Valor */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(registration.amount)}
              </p>
            </div>

            {/* Informações do Boleto */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Vencimento:</p>
                <p className="text-muted-foreground">
                  {getExpirationDate() ? formatExpirationDate(getExpirationDate()!) : 'Não informado'}
                </p>
              </div>
              <div>
                <p className="font-medium">Situação:</p>
                <p className="text-muted-foreground">
                  {isExpired() ? 'Vencido' : 'Em aberto'}
                </p>
              </div>
            </div>

            {/* Botão de Download */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleDownloadBoleto}
                disabled={!paymentData.bankSlipUrl && !paymentData.invoiceUrl}
                className="w-full md:w-auto"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Boleto
              </Button>
            </div>

            {/* Link para visualizar online */}
            {(paymentData.bankSlipUrl || paymentData.invoiceUrl) && (
              <div className="text-center">
                <button
                  onClick={handleDownloadBoleto}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visualizar boleto online
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como pagar o boleto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Baixe o boleto</p>
              <p className="text-sm text-muted-foreground">
                Clique no botão "Baixar Boleto" e salve o arquivo PDF
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Efetue o pagamento</p>
              <p className="text-sm text-muted-foreground">
                Pague em qualquer banco, casa lotérica ou pelo internet banking
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Aguarde a confirmação</p>
              <p className="text-sm text-muted-foreground">
                A confirmação será feita em até 2 dias úteis após o pagamento
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
                  <li>• Não é possível pagar boleto vencido</li>
                  <li>• A compensação bancária pode levar até 2 dias úteis</li>
                  <li>• Guarde o comprovante de pagamento</li>
                  <li>• Em caso de dúvidas, entre em contato com a organização</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 