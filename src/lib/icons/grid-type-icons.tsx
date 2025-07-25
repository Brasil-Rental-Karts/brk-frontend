import { ArrowUpDown, Clock, LucideIcon, RotateCcw, Zap } from "lucide-react";

import { GridTypeEnum } from "@/lib/types/grid-type";

/**
 * Mapeamento de ícones para cada tipo de grid
 */
export const GRID_TYPE_ICONS: Record<GridTypeEnum, LucideIcon> = {
  [GridTypeEnum.SUPER_POLE]: Zap,
  [GridTypeEnum.INVERTED]: RotateCcw,
  [GridTypeEnum.INVERTED_PARTIAL]: ArrowUpDown,
  [GridTypeEnum.QUALIFYING_SESSION]: Clock,
};

/**
 * Configurações visuais para cada tipo de grid
 */
export const GRID_TYPE_CONFIGS = {
  [GridTypeEnum.SUPER_POLE]: {
    icon: Zap,
    label: "Super Pole",
    color: "text-yellow-500", // Amarelo para raio
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  [GridTypeEnum.INVERTED]: {
    icon: RotateCcw,
    label: "Invertido",
    color: "text-blue-500", // Azul para rotação
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [GridTypeEnum.INVERTED_PARTIAL]: {
    icon: ArrowUpDown,
    label: "Invertido Parcial",
    color: "text-purple-500", // Roxo para parcial
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  [GridTypeEnum.QUALIFYING_SESSION]: {
    icon: Clock,
    label: "Classificação por Tempo",
    color: "text-green-500", // Verde para tempo
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
} as const;

/**
 * Componente para renderizar ícone de tipo de grid
 */
interface GridTypeIconProps {
  type: GridTypeEnum;
  size?: number;
  className?: string;
  withColor?: boolean;
}

export const GridTypeIcon = ({
  type,
  size = 16,
  className = "",
  withColor = true,
}: GridTypeIconProps) => {
  const config = GRID_TYPE_CONFIGS[type];
  const Icon = config.icon;

  return (
    <Icon
      size={size}
      className={`${withColor ? config.color : ""} ${className}`}
    />
  );
};

/**
 * Hook para obter configuração de um tipo de grid
 */
export const useGridTypeConfig = (type: GridTypeEnum) => {
  return GRID_TYPE_CONFIGS[type];
};
