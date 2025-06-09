/**
 * Tipos de grid disponíveis para configuração do campeonato
 */
export enum GridTypeEnum {
  SUPER_POLE = 'super_pole',
  INVERTED = 'inverted',
  INVERTED_PARTIAL = 'inverted_partial',
  QUALIFYING_SESSION = 'qualifying_session'
}

/**
 * Interface para configuração de tipo de grid
 */
export interface GridType {
  id: string;
  name: string;
  description: string;
  type: GridTypeEnum;
  isActive: boolean;
  isDefault: boolean;
  // Para tipo invertido parcial, número de posições a serem invertidas
  invertedPositions?: number;
  // Para tipo sessão de classificação, duração em minutos
  qualifyingDuration?: number;
  championshipId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para criação/edição de tipo de grid
 */
export interface GridTypeFormData {
  name: string;
  description: string;
  type: GridTypeEnum;
  isActive: boolean;
  isDefault: boolean;
  invertedPositions?: number;
  qualifyingDuration?: number;
}

/**
 * Configurações pré-definidas para tipos de grid
 */
export const PREDEFINED_GRID_TYPES: Omit<GridTypeFormData, 'isActive' | 'isDefault'>[] = [
  {
    name: 'Super Pole',
    description: 'A volta mais rápida da classificação define a ordem de largada',
    type: GridTypeEnum.SUPER_POLE
  },
  {
    name: 'Invertido',
    description: 'Posições de largada são definidas pelo resultado da bateria anterior de forma invertida',
    type: GridTypeEnum.INVERTED
  },
  {
    name: 'Invertido + 10',
    description: 'Somente os 10 primeiros colocados da bateria anterior invertem suas posições',
    type: GridTypeEnum.INVERTED_PARTIAL,
    invertedPositions: 10
  },
  {
    name: 'Classificação 5min',
    description: 'Sessão de classificação por tempo determinado. Posições definidas pela volta mais rápida durante a sessão',
    type: GridTypeEnum.QUALIFYING_SESSION,
    qualifyingDuration: 5
  }
]; 