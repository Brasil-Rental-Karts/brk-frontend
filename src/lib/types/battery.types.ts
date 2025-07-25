/**
 * Configuração de uma bateria individual
 */
export interface BatteryConfig {
  /** Nome da bateria (ex: "Bateria 1", "Classificação", "Final") */
  name: string;

  /** Tipo de grid utilizado nesta bateria */
  gridType: string; // ID do GridType

  /** Sistema de pontuação utilizado nesta bateria */
  scoringSystemId: string; // ID do ScoringSystem

  /** Ordem da bateria na sequência */
  order: number;

  /** Descrição opcional da bateria */
  description?: string;

  /** Se esta bateria é obrigatória ou opcional */
  isRequired: boolean;

  /** Duração em minutos (opcional) */
  duration?: number;
}

/**
 * Array de configurações de baterias para uma categoria
 */
export type BatteriesConfig = BatteryConfig[];

/**
 * Templates pré-definidos de configurações de bateria
 */
export const BATTERY_TEMPLATES = {
  SINGLE_25MIN: [
    {
      name: "Bateria 1",
      gridType: "",
      scoringSystemId: "",
      order: 1,
      isRequired: true,
      description: "Bateria única de 25 minutos",
      duration: 25,
    },
  ] as BatteriesConfig,

  TWO_BATTERIES: [
    {
      name: "Bateria 1",
      gridType: "",
      scoringSystemId: "",
      order: 1,
      isRequired: true,
      description: "Primeira bateria com grid padrão",
      duration: 15,
    },
    {
      name: "Bateria 2",
      gridType: "",
      scoringSystemId: "",
      order: 2,
      isRequired: true,
      description: "Segunda bateria com grid invertido",
      duration: 15,
    },
  ] as BatteriesConfig,
} as const;

/**
 * Validação básica para BatteryConfig
 */
export const validateBatteryConfig = (battery: BatteryConfig): string[] => {
  const errors: string[] = [];

  if (!battery.name || battery.name.trim().length === 0) {
    errors.push("Nome da bateria é obrigatório");
  }

  if (battery.order === undefined || battery.order < 0) {
    errors.push("Ordem da bateria deve ser maior ou igual a 0");
  }

  if (battery.duration !== undefined && battery.duration < 1) {
    errors.push("Duração deve ser maior que 0");
  }

  return errors;
};

/**
 * Validação para array de baterias
 */
export const validateBatteriesConfig = (
  batteries: BatteriesConfig,
): string[] => {
  const errors: string[] = [];

  if (!Array.isArray(batteries) || batteries.length === 0) {
    errors.push("Pelo menos uma bateria deve ser configurada");
    return errors;
  }

  // Validar cada bateria individualmente
  batteries.forEach((battery, index) => {
    const batteryErrors = validateBatteryConfig(battery);
    batteryErrors.forEach((error) => {
      errors.push(`Bateria ${index + 1}: ${error}`);
    });
  });

  // Validar ordens únicas
  const orders = batteries.map((b) => b.order);
  const uniqueOrders = [...new Set(orders)];
  if (orders.length !== uniqueOrders.length) {
    errors.push("Ordens das baterias devem ser únicas");
  }

  // Validar nomes únicos
  const names = batteries.map((b) => b.name.trim().toLowerCase());
  const uniqueNames = [...new Set(names)];
  if (names.length !== uniqueNames.length) {
    errors.push("Nomes das baterias devem ser únicos");
  }

  return errors;
};
