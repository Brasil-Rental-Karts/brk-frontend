import React, { useState } from 'react';
import { Copy, Check, Clock, AlertCircle } from 'lucide-react';
import { Button } from 'brk-design-system';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';

import { SeasonRegistration, RegistrationPaymentData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface PixPaymentProps {
  paymentData: RegistrationPaymentData;
  registration: SeasonRegistration;
  onPaymentComplete: () => void;
}

export const PixPayment: React.FC<PixPaymentProps> = ({
  paymentData,
  registration
}) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const formatExpirationTime = (expirationDate: string) => {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diffMs = expiration.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expirado';
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    }
    
    return `${diffMinutes}m`;
  };

  const isExpired = () => {
    if (!paymentData.expirationDate && !paymentData.dueDate) return false;
    const dateToCheck = paymentData.expirationDate || paymentData.dueDate;
    return new Date(dateToCheck) <= new Date();
  };

  const getExpirationText = () => {
    if (paymentData.expirationDate) {
      return formatExpirationTime(paymentData.expirationDate);
    }
    if (paymentData.dueDate) {
      return formatExpirationTime(paymentData.dueDate);
    }
    return '24h';
  };

  return (
    <div className="space-y-6">
      {/* Status do Pagamento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00D4AA] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Pix</span>
              </div>
              Pagamento via PIX
            </CardTitle>
            
            {(paymentData.expirationDate || paymentData.dueDate) && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Expira em:</p>
                <p className={`text-sm font-medium ${isExpired() ? 'text-destructive' : 'text-orange-600'}`}>
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
                Este código PIX expirou. Gere uma nova cobrança para continuar.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-[#00D4AA] bg-[#00D4AA]/5">
              <Clock className="h-4 w-4 text-[#00D4AA]" />
              <AlertDescription className="text-[#00D4AA]">
                <strong>Aguardando pagamento via PIX</strong>
                <br />
                Após o pagamento, a confirmação será automática em alguns minutos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* QR Code e Chave PIX */}
      {!isExpired() && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code PIX</CardTitle>
              <p className="text-sm text-muted-foreground">
                Escaneie o código com seu banco ou carteira digital
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block shadow-sm border">
                <QRCode
                  value={paymentData.pixQrCode || ''}
                  size={200}
                  level="M"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use a câmera do seu celular ou app do banco
              </p>
            </CardContent>
          </Card>

          {/* Chave PIX */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chave PIX</CardTitle>
              <p className="text-sm text-muted-foreground">
                Copie e cole no seu app de pagamento
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

              {/* Chave PIX */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Chave PIX:</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {paymentData.pixKey || 'Não disponível'}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(paymentData.pixKey || '', 'pixKey')}
                    className="shrink-0"
                    disabled={!paymentData.pixKey}
                  >
                    {copySuccess === 'pixKey' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copySuccess === 'pixKey' && (
                  <p className="text-xs text-green-600">Chave PIX copiada!</p>
                )}
              </div>

              {/* Código PIX Copia e Cola */}
              {(paymentData.pixQrCode || paymentData.pixCopyPaste) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código PIX Copia e Cola:</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all max-h-20 overflow-y-auto">
                      {paymentData.pixCopyPaste || paymentData.pixQrCode}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(paymentData.pixCopyPaste || paymentData.pixQrCode || '', 'pixCode')}
                      className="shrink-0"
                    >
                      {copySuccess === 'pixCode' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {copySuccess === 'pixCode' && (
                    <p className="text-xs text-green-600">Código PIX copiado!</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instruções */}
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

      {/* Informações Importantes */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Informações importantes:</p>
                <ul className="text-blue-800 space-y-1">
                  <li>• O PIX é processado 24 horas por dia, 7 dias por semana</li>
                  <li>• A confirmação do pagamento é automática</li>
                  <li>• Não é necessário enviar comprovante</li>
                  <li>• O valor deve ser pago exatamente como mostrado</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 