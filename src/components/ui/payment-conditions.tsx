import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Button } from 'brk-design-system';
import { Input } from 'brk-design-system';
import { Label } from 'brk-design-system';
import { Switch } from 'brk-design-system';
import { Textarea } from 'brk-design-system';
import { formatCurrency, parseMonetaryValue } from '../../utils/currency';
import { Trash2, Plus } from 'lucide-react';

export interface PaymentCondition {
  type: 'por_temporada' | 'por_etapa';
  value: number;
  description?: string;
  enabled: boolean;
  paymentMethods: ('pix' | 'cartao_credito')[];
  pixInstallments?: number;
  creditCardInstallments?: number;
}

interface PaymentConditionsProps {
  value: PaymentCondition[];
  onChange: (conditions: PaymentCondition[]) => void;
  error?: string;
}

// Função para formatar valor sem R$
const formatValueWithoutCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função de máscara monetária para digitação
function maskCurrencyInput(value: string): string {
  // Remove tudo que não for número
  let onlyDigits = value.replace(/\D/g, '');
  // Remove zeros à esquerda, mas mantém pelo menos 3 dígitos
  onlyDigits = onlyDigits.replace(/^0+(?!$)/, '');
  while (onlyDigits.length < 3) {
    onlyDigits = '0' + onlyDigits;
  }
  // Insere vírgula para centavos
  const cents = onlyDigits.slice(-2);
  let integer = onlyDigits.slice(0, -2);
  // Adiciona pontos de milhar
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return integer + ',' + cents;
}

// Função para criar opções de parcelas
const createInstallmentOptions = () => {
  const options = [];
  for (let i = 1; i <= 12; i++) {
    options.push({
      value: i.toString(),
      description: `${i}x`
    });
  }
  return options;
};

export const PaymentConditions: React.FC<PaymentConditionsProps> = ({
  value = [],
  onChange,
  error
}) => {
  const [conditions, setConditions] = useState<PaymentCondition[]>(value);
  const [editingValues, setEditingValues] = useState<{ [key: number]: string }>({});

  // Inicializar valores de edição
  React.useEffect(() => {
    const initialEditingValues: { [key: number]: string } = {};
    value.forEach((condition, index) => {
      initialEditingValues[index] = formatValueWithoutCurrency(condition.value);
    });
    setEditingValues(initialEditingValues);
  }, [value]);

  const addCondition = () => {
    const newCondition: PaymentCondition = {
      type: 'por_temporada',
      value: 0,
      description: '',
      enabled: true,
      paymentMethods: [],
      pixInstallments: 1,
      creditCardInstallments: 1
    };
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);
    setEditingValues(prev => ({
      ...prev,
      [updatedConditions.length - 1]: '0,00'
    }));
    onChange(updatedConditions);
  };

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index);
    setConditions(updatedConditions);
    
    // Remover valor de edição
    const newEditingValues = { ...editingValues };
    delete newEditingValues[index];
    setEditingValues(newEditingValues);
    
    onChange(updatedConditions);
  };

  const updateCondition = (index: number, field: keyof PaymentCondition, newValue: any) => {
    const updatedConditions = conditions.map((condition, i) => {
      if (i === index) {
        return { ...condition, [field]: newValue };
      }
      return condition;
    });
    setConditions(updatedConditions);
    onChange(updatedConditions);
  };

  const handleValueChange = (index: number, inputValue: string) => {
    // Aplica máscara monetária
    const masked = maskCurrencyInput(inputValue);
    setEditingValues(prev => ({
      ...prev,
      [index]: masked
    }));
  };

  const handleValueBlur = (index: number) => {
    // Converter para número e atualizar a condição quando sair do campo
    const inputValue = editingValues[index] || '';
    const numericValue = parseMonetaryValue(inputValue);
    
    // Atualizar a condição com o valor numérico
    updateCondition(index, 'value', numericValue);
    
    // Formatar o valor de edição sem R$
    setEditingValues(prev => ({
      ...prev,
      [index]: formatValueWithoutCurrency(numericValue)
    }));
  };

  const handlePaymentMethodChange = (index: number, method: 'pix' | 'cartao_credito', checked: boolean) => {
    const condition = conditions[index];
    const updatedMethods = checked 
      ? [...condition.paymentMethods, method]
      : condition.paymentMethods.filter(m => m !== method);
    
    updateCondition(index, 'paymentMethods', updatedMethods);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Condições de Pagamento</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCondition}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Condição
        </Button>
      </div>

      {conditions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma condição de pagamento configurada</p>
          <p className="text-sm">Clique em "Adicionar Condição" para começar</p>
        </div>
      )}

      {conditions.map((condition, index) => (
        <Card key={index} className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Condição {index + 1}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={condition.enabled}
                    onCheckedChange={(checked: boolean) => updateCondition(index, 'enabled', checked)}
                  />
                  <Label className="text-sm">
                    {condition.enabled ? 'Ativa' : 'Inativa'}
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`type-${index}`}>Tipo de Pagamento</Label>
                <select
                  id={`type-${index}`}
                  value={condition.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCondition(index, 'type', e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="por_temporada">Por Temporada</option>
                  <option value="por_etapa">Por Etapa</option>
                </select>
              </div>
              <div>
                <Label htmlFor={`value-${index}`}>Valor (R$)</Label>
                <Input
                  id={`value-${index}`}
                  type="text"
                  value={editingValues[index] || formatValueWithoutCurrency(condition.value)}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  onBlur={() => handleValueBlur(index)}
                  placeholder="0,00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Métodos de Pagamento</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id={`pix-${index}`}
                    checked={condition.paymentMethods.includes('pix')}
                    onChange={(e) => handlePaymentMethodChange(index, 'pix', e.target.checked)}
                  />
                  <Label htmlFor={`pix-${index}`} className="text-sm">PIX</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id={`credit-${index}`}
                    checked={condition.paymentMethods.includes('cartao_credito')}
                    onChange={(e) => handlePaymentMethodChange(index, 'cartao_credito', e.target.checked)}
                  />
                  <Label htmlFor={`credit-${index}`} className="text-sm">Cartão de Crédito</Label>
                </div>
              </div>

              {/* Configurações de Parcelas */}
              {(condition.paymentMethods.includes('pix') || condition.paymentMethods.includes('cartao_credito')) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {condition.paymentMethods.includes('pix') && (
                    <div>
                      <Label htmlFor={`pix-installments-${index}`}>Parcelas PIX</Label>
                      <select
                        id={`pix-installments-${index}`}
                        value={condition.pixInstallments || 1}
                        onChange={(e) => updateCondition(index, 'pixInstallments', parseInt(e.target.value))}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        {createInstallmentOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {condition.paymentMethods.includes('cartao_credito') && (
                    <div>
                      <Label htmlFor={`credit-installments-${index}`}>Parcelas Cartão de Crédito</Label>
                      <select
                        id={`credit-installments-${index}`}
                        value={condition.creditCardInstallments || 1}
                        onChange={(e) => updateCondition(index, 'creditCardInstallments', parseInt(e.target.value))}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        {createInstallmentOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor={`description-${index}`}>Descrição (opcional)</Label>
              <Textarea
                id={`description-${index}`}
                value={condition.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateCondition(index, 'description', e.target.value)}
                placeholder="Descrição da condição de pagamento..."
                className="w-full"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      {conditions.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Resumo das Condições</h4>
          <div className="space-y-2">
            {conditions
              .filter(c => c.enabled)
              .map((condition, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">
                      {condition.type === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
                      {condition.description && ` - ${condition.description}`}
                    </span>
                    <span className="font-medium">{formatCurrency(condition.value)}</span>
                  </div>
                  {condition.paymentMethods.length > 0 && (
                    <div className="text-xs text-muted-foreground ml-4">
                      Métodos: {condition.paymentMethods.map(method => 
                        method === 'pix' ? 'PIX' : 'Cartão de Crédito'
                      ).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            {conditions.filter(c => c.enabled).length === 0 && (
              <p className="text-muted-foreground text-sm">
                Nenhuma condição ativa configurada
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 