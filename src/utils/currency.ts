/**
 * Utilitários para lidar com valores monetários
 */

/**
 * Converte um valor que pode ser string ou number para number
 * @param value Valor a ser convertido
 * @returns Número válido ou 0 se inválido
 */
export const parseMonetaryValue = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    // Remove caracteres não numéricos exceto ponto e vírgula
    const cleanValue = value.replace(/[^\d.,]/g, '');
    // Converte vírgula para ponto se necessário
    const normalizedValue = cleanValue.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
};

/**
 * Formata um valor como moeda brasileira
 * @param value Valor a ser formatado
 * @returns String formatada como R$ X,XX
 */
export const formatCurrency = (value: number | string): string => {
  const numericValue = parseMonetaryValue(value);
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};

/**
 * Formata um valor como número com 2 casas decimais
 * @param value Valor a ser formatado
 * @returns String formatada como X.XX
 */
export const formatDecimal = (value: number | string): string => {
  const numericValue = parseMonetaryValue(value);
  return numericValue.toFixed(2);
}; 