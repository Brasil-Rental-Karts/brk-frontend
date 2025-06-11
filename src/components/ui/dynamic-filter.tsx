import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "brk-design-system";
import { Combobox } from "brk-design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "brk-design-system";
import { Calendar } from "brk-design-system";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "brk-design-system";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "brk-design-system";

// Local type definition since ComboboxOption is not exported from brk-design-system
interface ComboboxOption {
  value: string;
  label: string;
}

// Hook customizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Tipos de filtro suportados
export type FilterFieldType = 'text' | 'select' | 'combobox' | 'date' | 'number';

// Configuração de um campo de filtro
export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  debounceMs?: number; // Tempo de debounce específico por campo
}

// Valores dos filtros
export type FilterValues = Record<string, any>;

// Props do componente
interface DynamicFilterProps {
  fields: FilterField[];
  onFiltersChange: (filters: FilterValues) => void;
  className?: string;
  debounceMs?: number; // Debounce global padrão
}

/**
 * Componente de filtro dinâmico com combobox digitável e debounce
 * Otimizado para evitar acessos excessivos ao backend
 */
export const DynamicFilter = ({ 
  fields, 
  onFiltersChange, 
  className,
  debounceMs = 500 // Debounce padrão de 500ms
}: DynamicFilterProps) => {
  const [filters, setFilters] = useState<FilterValues>({});
  
  // Valores debounced para campos específicos
  const debouncedFilters = useDebounce(filters, debounceMs);

  // Inicializar valores padrão apenas quando os campos mudarem
  useEffect(() => {
    const defaultValues: FilterValues = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaultValues[field.key] = field.defaultValue;
      }
    });
    setFilters(defaultValues);
  }, [fields]);

  // Disparar onFiltersChange apenas quando o valor debounced mudar
  useEffect(() => {
    onFiltersChange(debouncedFilters);
  }, [debouncedFilters]);

  // Atualizar filtro específico
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value
    }));
  }, []);

  // Preparar opções para combobox
  const prepareComboboxOptions = useCallback((options: { value: string; label: string }[] = []): ComboboxOption[] => {
    return options.map(option => ({
      value: option.value,
      label: option.label
    }));
  }, []);

  // Renderizar campo de filtro baseado no tipo
  const renderFilterField = useCallback((field: FilterField) => {
    const value = filters[field.key] || '';
    const placeholder = field.placeholder || field.label;

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Input
            key={field.key}
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={placeholder}
            value={value}
            onChange={(e) => updateFilter(field.key, e.target.value)}
            className="w-full min-w-[100px] max-w-[140px] text-sm h-9"
          />
        );

      case 'combobox':
        return (
          <Combobox
            key={field.key}
            options={prepareComboboxOptions(field.options)}
            value={value}
            placeholder={placeholder}
            searchPlaceholder={`Buscar ${field.label.toLowerCase()}...`}
            emptyText={`Nenhum ${field.label.toLowerCase()} encontrado`}
            onValueChange={(newValue) => updateFilter(field.key, newValue)}
            className="w-[140px] h-9"
          />
        );

      case 'select':
        return (
          <Select
            key={field.key}
            value={value}
            onValueChange={(newValue) => updateFilter(field.key, newValue)}
          >
            <SelectTrigger className="w-full min-w-[100px] max-w-[140px] text-sm h-9">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Popover key={field.key}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full min-w-[100px] max-w-[140px] justify-start text-left font-normal text-sm h-9",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => updateFilter(field.key, date?.toISOString() || '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return null;
    }
  }, [filters, updateFilter, prepareComboboxOptions]);

  // Memoizar os campos renderizados para evitar re-renders desnecessários
  const renderedFields = useMemo(() => {
    return fields.map(renderFilterField);
  }, [fields, renderFilterField]);

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Label "Filtro" */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filtro:</span>
      </div>
      
      {/* Campos de filtro */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {renderedFields}
      </div>
    </div>
  );
}; 