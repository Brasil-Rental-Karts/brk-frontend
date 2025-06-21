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
        return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'} e ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`;
      }
      return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
    }
    
    // Mostrar em semanas se for mais de 7 dias
    if (diffWeeks > 0) {
      const remainingDays = diffDays % 7;
      if (remainingDays > 0) {
        return `${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'} e ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`;
      }
      return `${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
    }
    
    // Mostrar em dias se for mais de 24 horas
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      if (remainingHours > 0) {
        return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} e ${remainingHours}h`;
      }
      return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
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
              <div>
                <div>Pagamento via PIX</div>
                {paymentData.installmentCount && paymentData.installmentCount > 1 && (
                  <div className="text-sm font-normal text-muted-foreground">
                    Parcelado em {paymentData.installmentCount}x
                  </div>
                )}
              </div>
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
              <AlertDescription className="text-[#00D4AA]">
                <strong>
                  {paymentData.installmentCount && paymentData.installmentCount > 1 
                    ? `Aguardando pagamento da ${paymentData.installmentNumber || 1}ª parcela via PIX`
                    : 'Aguardando pagamento via PIX'
                  }
                </strong>
                <br />
                {paymentData.installmentCount && paymentData.installmentCount > 1 && (
                  <>
                    As próximas parcelas serão enviadas por email nas datas de vencimento.
                    <br />
                  </>
                )}
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
                <p className="text-sm text-muted-foreground">
                  {paymentData.installmentCount && paymentData.installmentCount > 1 
                    ? `Valor da ${paymentData.installmentNumber || 1}ª parcela` 
                    : 'Valor'
                  }
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(paymentData.value)}
                </p>
                {paymentData.installmentCount && paymentData.installmentCount > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {paymentData.installmentCount}x de {formatCurrency(paymentData.value)} 
                    (Total: {formatCurrency(registration.amount)})
                  </p>
                )}
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