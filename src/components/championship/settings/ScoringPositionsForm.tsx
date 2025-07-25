import { Button, Input } from "brk-design-system";
import { Plus, X } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";

import { ScoringPosition } from "@/lib/services/scoring-system.service";

interface ScoringPositionsFormProps {
  value?: ScoringPosition[] | null;
  onChange: (positions: ScoringPosition[]) => void;
  disabled?: boolean;
}

export const ScoringPositionsForm = forwardRef<
  HTMLDivElement,
  ScoringPositionsFormProps
>(({ value = [], onChange, disabled = false }, ref) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const positionsContainerRef = useRef<HTMLDivElement>(null);
  const [previousPositionsCount, setPreviousPositionsCount] = useState(0);

  // Garantir que value seja sempre um array
  const positions = Array.isArray(value) ? value : [];

  // Scroll automático quando adicionar posições
  useEffect(() => {
    if (
      positions.length > previousPositionsCount &&
      positionsContainerRef.current
    ) {
      setTimeout(() => {
        positionsContainerRef.current?.scrollTo({
          top: positionsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [positions.length, previousPositionsCount]);

  useEffect(() => {
    setPreviousPositionsCount(positions.length);
  }, [positions.length]);

  const addPosition = () => {
    const newPosition = {
      position: positions.length + 1,
      points: Math.max(0, (positions[positions.length - 1]?.points || 0) - 1),
    };
    onChange([...positions, newPosition]);
  };

  const removePosition = (index: number) => {
    const newPositions = positions.filter((_, i) => i !== index);
    // Reajustar posições
    const adjustedPositions = newPositions.map((pos, i) => ({
      ...pos,
      position: i + 1,
    }));
    onChange(adjustedPositions);
  };

  const updatePosition = (
    index: number,
    field: "position" | "points",
    value: number,
  ) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], [field]: value };
    onChange(newPositions);
  };

  const applyTemplate = (template: ScoringPosition[]) => {
    onChange(template);
    setShowTemplates(false);
  };

  const SCORING_TEMPLATES = [
    {
      label: "Kart Brasileiro",
      positions: [
        { position: 1, points: 20 },
        { position: 2, points: 17 },
        { position: 3, points: 15 },
        { position: 4, points: 13 },
        { position: 5, points: 11 },
        { position: 6, points: 10 },
        { position: 7, points: 9 },
        { position: 8, points: 8 },
        { position: 9, points: 7 },
        { position: 10, points: 6 },
      ],
    },
    {
      label: "Fórmula 1",
      positions: [
        { position: 1, points: 25 },
        { position: 2, points: 18 },
        { position: 3, points: 15 },
        { position: 4, points: 12 },
        { position: 5, points: 10 },
        { position: 6, points: 8 },
        { position: 7, points: 6 },
        { position: 8, points: 4 },
        { position: 9, points: 2 },
        { position: 10, points: 1 },
      ],
    },
    {
      label: "Simples (Top 3)",
      positions: [
        { position: 1, points: 10 },
        { position: 2, points: 6 },
        { position: 3, points: 3 },
      ],
    },
  ];

  return (
    <div ref={ref} className="space-y-4">
      {/* Templates */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Posições de Pontuação</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={disabled}
        >
          {showTemplates ? "Ocultar" : "Templates"}
        </Button>
      </div>

      {showTemplates && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-muted rounded-lg">
          {SCORING_TEMPLATES.map((template, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyTemplate(template.positions)}
              disabled={disabled}
              className="text-xs"
            >
              {template.label}
            </Button>
          ))}
        </div>
      )}

      {/* Lista de posições */}
      <div
        ref={positionsContainerRef}
        className="max-h-60 overflow-y-auto space-y-3"
      >
        <div className="grid grid-cols-4 gap-3">
          {positions.map((position, index) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {position.position}º Lugar
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePosition(index)}
                  disabled={disabled}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                type="number"
                value={position.points}
                onChange={(e) =>
                  updatePosition(index, "points", parseInt(e.target.value) || 0)
                }
                placeholder="0"
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Botão adicionar */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPosition}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Posição
      </Button>
    </div>
  );
});

ScoringPositionsForm.displayName = "ScoringPositionsForm";
