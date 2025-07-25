import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from "brk-design-system";
import { Plus, Trash2 } from "lucide-react";
import React, { forwardRef, useState } from "react";

import { parseMonetaryValue } from "../../utils/currency";

export interface PaymentCondition {
  type: "por_temporada" | "por_etapa";
  value: number;
  description?: string;
  enabled: boolean;
  paymentMethods: ("pix" | "cartao_credito")[];
  pixInstallments?: number;
  creditCardInstallments?: number;
}

interface PaymentConditionsProps {
  value: PaymentCondition[];
  onChange: (conditions: PaymentCondition[]) => void;
  error?: string;
  onBlur?: () => void;
  name?: string;
}

// Função para formatar valor sem R$
const formatValueWithoutCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Função de máscara monetária para digitação
function maskCurrencyInput(value: string): string {
  // Remove tudo que não for número
  let onlyDigits = value.replace(/\D/g, "");
  // Remove zeros à esquerda, mas mantém pelo menos 3 dígitos
  onlyDigits = onlyDigits.replace(/^0+(?!$)/, "");
  while (onlyDigits.length < 3) {
    onlyDigits = "0" + onlyDigits;
  }
  // Insere vírgula para centavos
  const cents = onlyDigits.slice(-2);
  let integer = onlyDigits.slice(0, -2);
  // Adiciona pontos de milhar
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return integer + "," + cents;
}

// Função para criar opções de parcelas
const createInstallmentOptions = () => {
  const options = [];
  for (let i = 1; i <= 12; i++) {
    options.push({
      value: i.toString(),
      description: `${i}x`,
    });
  }
  return options;
};

export const PaymentConditions = forwardRef<
  HTMLDivElement,
  PaymentConditionsProps
>(({ value = [], onChange, error, onBlur, name }, ref) => {
  const [conditions, setConditions] = useState<PaymentCondition[]>(value);
  const [editingValues, setEditingValues] = useState<{ [key: number]: string }>(
    {},
  );

  // Inicializar valores de edição
  React.useEffect(() => {
    const initialEditingValues: { [key: number]: string } = {};
    value.forEach((condition, index) => {
      initialEditingValues[index] = formatValueWithoutCurrency(condition.value);
    });
    setEditingValues(initialEditingValues);
  }, [value]);

  const addCondition = () => {
    // Verificar se já existe uma condição por temporada
    const hasPorTemporada = conditions.some(
      (condition) => condition.type === "por_temporada",
    );
    // Verificar se já existe uma condição por etapa
    const hasPorEtapa = conditions.some(
      (condition) => condition.type === "por_etapa",
    );

    // Determinar qual tipo adicionar
    let newType: "por_temporada" | "por_etapa";
    if (!hasPorTemporada) {
      newType = "por_temporada";
    } else if (!hasPorEtapa) {
      newType = "por_etapa";
    } else {
      // Se ambos os tipos já existem, não adicionar mais
      return;
    }

    const newCondition: PaymentCondition = {
      type: newType,
      value: 0,
      description: "",
      enabled: true,
      paymentMethods: [],
      pixInstallments: 1,
      creditCardInstallments: 1,
    };
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);
    setEditingValues((prev) => ({
      ...prev,
      [updatedConditions.length - 1]: "0,00",
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

  const updateCondition = (
    index: number,
    field: keyof PaymentCondition,
    newValue: any,
  ) => {
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
    setEditingValues((prev) => ({
      ...prev,
      [index]: masked,
    }));
  };

  const handleValueBlur = (index: number) => {
    // Converter para número e atualizar a condição quando sair do campo
    const inputValue = editingValues[index] || "";
    const numericValue = parseMonetaryValue(inputValue);

    // Atualizar a condição com o valor numérico
    updateCondition(index, "value", numericValue);

    // Formatar o valor de edição sem R$
    setEditingValues((prev) => ({
      ...prev,
      [index]: formatValueWithoutCurrency(numericValue),
    }));
  };

  const handlePaymentMethodChange = (
    index: number,
    method: "pix" | "cartao_credito",
    checked: boolean,
  ) => {
    const condition = conditions[index];
    const updatedMethods = checked
      ? [...condition.paymentMethods, method]
      : condition.paymentMethods.filter((m) => m !== method);

    updateCondition(index, "paymentMethods", updatedMethods);
  };

  // Verificar quais tipos já existem
  const hasPorTemporada = conditions.some(
    (condition) => condition.type === "por_temporada",
  );
  const hasPorEtapa = conditions.some(
    (condition) => condition.type === "por_etapa",
  );
  const canAddMore = !hasPorTemporada || !hasPorEtapa;

  return (
    <div ref={ref} className="space-y-4" onBlur={onBlur}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Condições de Pagamento</Label>
        {canAddMore && (
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
        )}
      </div>

      {conditions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma condição de pagamento configurada</p>
          <p className="text-sm">Clique em "Adicionar Condição" para começar</p>
        </div>
      )}

      {!canAddMore && conditions.length > 0 && (
        <div className="text-center py-4 text-muted-foreground bg-muted/50 rounded-md">
          <p className="text-sm">
            Máximo de condições atingido (1 por temporada + 1 por etapa)
          </p>
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
                    onCheckedChange={(checked: boolean) =>
                      updateCondition(index, "enabled", checked)
                    }
                  />
                  <Label className="text-sm">
                    {condition.enabled ? "Ativa" : "Inativa"}
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newType = e.target.value as
                      | "por_temporada"
                      | "por_etapa";
                    // Verificar se já existe outra condição com este tipo
                    const otherConditionWithSameType = conditions.find(
                      (c, i) => i !== index && c.type === newType,
                    );
                    if (otherConditionWithSameType) {
                      return; // Não permitir mudança se já existe outro com este tipo
                    }
                    updateCondition(index, "type", newType);
                  }}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option
                    value="por_temporada"
                    disabled={conditions.some(
                      (c, i) => i !== index && c.type === "por_temporada",
                    )}
                  >
                    Por Temporada
                  </option>
                  <option
                    value="por_etapa"
                    disabled={conditions.some(
                      (c, i) => i !== index && c.type === "por_etapa",
                    )}
                  >
                    Por Etapa
                  </option>
                </select>
              </div>
              <div>
                <Label htmlFor={`value-${index}`}>Valor (R$)</Label>
                <Input
                  id={`value-${index}`}
                  type="text"
                  value={
                    editingValues[index] ||
                    formatValueWithoutCurrency(condition.value)
                  }
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  onBlur={() => handleValueBlur(index)}
                  placeholder="0,00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Métodos de Pagamento
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`pix-${index}`}
                    checked={condition.paymentMethods.includes("pix")}
                    onChange={(e) =>
                      handlePaymentMethodChange(index, "pix", e.target.checked)
                    }
                  />
                  <Label htmlFor={`pix-${index}`} className="text-sm">
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`cartao-${index}`}
                    checked={condition.paymentMethods.includes(
                      "cartao_credito",
                    )}
                    onChange={(e) =>
                      handlePaymentMethodChange(
                        index,
                        "cartao_credito",
                        e.target.checked,
                      )
                    }
                  />
                  <Label htmlFor={`cartao-${index}`} className="text-sm">
                    Cartão de Crédito
                  </Label>
                </div>
              </div>
            </div>

            {/* Configurações de Parcelas */}
            {condition.paymentMethods.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {condition.paymentMethods.includes("pix") && (
                  <div>
                    <Label htmlFor={`pix-installments-${index}`}>
                      Parcelas PIX
                    </Label>
                    <select
                      id={`pix-installments-${index}`}
                      value={condition.pixInstallments || 1}
                      onChange={(e) =>
                        updateCondition(
                          index,
                          "pixInstallments",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      {createInstallmentOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {condition.paymentMethods.includes("cartao_credito") && (
                  <div>
                    <Label htmlFor={`credit-installments-${index}`}>
                      Parcelas Cartão
                    </Label>
                    <select
                      id={`credit-installments-${index}`}
                      value={condition.creditCardInstallments || 1}
                      onChange={(e) =>
                        updateCondition(
                          index,
                          "creditCardInstallments",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      {createInstallmentOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Descrição */}
            <div>
              <Label htmlFor={`description-${index}`}>
                Descrição (Opcional)
              </Label>
              <Textarea
                id={`description-${index}`}
                value={condition.description || ""}
                onChange={(e) =>
                  updateCondition(index, "description", e.target.value)
                }
                placeholder="Ex: Pagamento à vista ou em até 3x"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  );
});

PaymentConditions.displayName = "PaymentConditions";
