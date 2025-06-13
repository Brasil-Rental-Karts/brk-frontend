import React from 'react';
import { Alert, AlertDescription, AlertTitle } from 'brk-design-system';
import { AlertCircle, Lightbulb } from 'lucide-react';

interface AsaasError {
  message: string;
  technicalMessage?: string;
  suggestions?: string[];
  errorCode?: string;
  type?: string;
}

interface ErrorDisplayProps {
  error: AsaasError | string | null;
  showTechnicalDetails?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  showTechnicalDetails = false,
  className = "" 
}) => {
  if (!error) return null;

  // Se for uma string simples, exibe como erro padrão
  if (typeof error === 'string') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Se for um erro do Asaas com estrutura completa
  const isAsaasError = error.type === 'asaas_error';
  const userMessage = error.message;
  const technicalMessage = error.technicalMessage;
  const suggestions = error.suggestions || [];
  const errorCode = error.errorCode;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mensagem principal para o usuário */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {isAsaasError ? 'Problema identificado' : 'Erro'}
          {errorCode && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Código: {errorCode})
            </span>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {userMessage}
        </AlertDescription>
      </Alert>

      {/* Sugestões de solução */}
      {suggestions.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Como resolver:</AlertTitle>
          <AlertDescription className="mt-2">
            <ul className="list-disc list-inside space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm">{suggestion}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Detalhes técnicos (opcional, para desenvolvedores) */}
      {showTechnicalDetails && technicalMessage && (
        <Alert variant="default">
          <AlertTitle className="text-xs">Detalhes técnicos:</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1">
            {technicalMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ErrorDisplay; 