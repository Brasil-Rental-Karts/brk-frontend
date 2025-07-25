import { Button, Checkbox, Input } from "brk-design-system";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  ScoringSystem,
  ScoringSystemData,
} from "@/lib/services/scoring-system.service";

interface ScoringSystemFormStandaloneProps {
  championshipId: string;
  initialData?: ScoringSystem | null;
  onSubmit: (formData: ScoringSystemData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

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
      { position: 11, points: 5 },
      { position: 12, points: 4 },
      { position: 13, points: 3 },
      { position: 14, points: 2 },
      { position: 15, points: 1 },
    ],
  },
  {
    label: "Top 5",
    positions: [
      { position: 1, points: 5 },
      { position: 2, points: 4 },
      { position: 3, points: 3 },
      { position: 4, points: 2 },
      { position: 5, points: 1 },
    ],
  },
];

export const ScoringSystemFormStandalone = ({
  championshipId,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: ScoringSystemFormStandaloneProps) => {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<ScoringSystemData>({
    name: "",
    positions: [{ position: 1, points: 25 }],
    polePositionPoints: 0,
    fastestLapPoints: 0,
    isActive: true,
    isDefault: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const positionsContainerRef = useRef<HTMLDivElement>(null);
  const [previousPositionsCount, setPreviousPositionsCount] = useState(0);

  const isEditing = !!initialData;

  // Preencher formulário no modo de edição
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        positions: initialData.positions,
        polePositionPoints: initialData.polePositionPoints,
        fastestLapPoints: initialData.fastestLapPoints,
        isActive: initialData.isActive,
        isDefault: initialData.isDefault,
      });
    } else {
      setFormData({
        name: "",
        positions: [{ position: 1, points: 25 }],
        polePositionPoints: 0,
        fastestLapPoints: 0,
        isActive: true,
        isDefault: false,
      });
    }
    setError(null);
  }, [initialData]);

  // Scroll automático quando adicionar posições
  useEffect(() => {
    if (
      formData.positions.length > previousPositionsCount &&
      positionsContainerRef.current
    ) {
      setTimeout(() => {
        positionsContainerRef.current?.scrollTo({
          top: positionsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
    setPreviousPositionsCount(formData.positions.length);
  }, [formData.positions.length, previousPositionsCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error("Nome é obrigatório");
      }
      if (formData.positions.length === 0) {
        throw new Error("Pelo menos uma posição deve ser configurada");
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const applyTemplate = (template: (typeof SCORING_TEMPLATES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      positions: template.positions,
    }));
    setShowTemplates(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Templates */}
      {!isEditing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Templates de Pontuação</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              {showTemplates ? "Ocultar" : "Mostrar"} Templates
            </Button>
          </div>

          {showTemplates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
              {SCORING_TEMPLATES.map((template, idx) => (
                <Button
                  key={template.label}
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="w-full min-w-0">
                    <div className="flex items-center gap-2 font-medium flex-wrap">
                      <span className="flex-shrink-0">{template.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({template.positions.length} posições)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-words whitespace-normal leading-relaxed">
                      {template.positions
                        .slice(0, 3)
                        .map((pos) => `${pos.position}º: ${pos.points}pts`)
                        .join(", ")}
                      {template.positions.length > 3 && "..."}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campos do formulário */}
      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="text-sm font-medium">
            Nome do Sistema <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex: Fórmula 1, Kart Brasileiro, etc."
            disabled={loading}
            className="mt-1"
          />
        </div>

        {/* Pontuação por posição */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Pontuação por posição</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const prevPositions = formData.positions;
                const lastPoints =
                  prevPositions.length > 0
                    ? prevPositions[prevPositions.length - 1].points
                    : 0;
                const newPoints = Math.max(0, lastPoints - 1);
                setFormData((prev) => ({
                  ...prev,
                  positions: [
                    ...prev.positions,
                    { position: prev.positions.length + 1, points: newPoints },
                  ],
                }));
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Posição
            </Button>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto"
            ref={positionsContainerRef}
          >
            {formData.positions.map((pos, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded"
              >
                <div className="w-8 text-center font-medium text-sm">
                  {index + 1}º
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={pos.points}
                    onChange={(e) => {
                      const newPositions = [...formData.positions];
                      newPositions[index] = {
                        ...newPositions[index],
                        points: parseInt(e.target.value) || 0,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        positions: newPositions,
                      }));
                    }}
                    className="w-full px-2 py-1 text-sm"
                    min="0"
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
                <div className="w-6">
                  {formData.positions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newPositions = formData.positions
                          .filter((_, i) => i !== index)
                          .map((pos, newIndex) => ({
                            ...pos,
                            position: newIndex + 1,
                          }));
                        setFormData((prev) => ({
                          ...prev,
                          positions: newPositions,
                        }));
                      }}
                      className="text-destructive hover:text-destructive h-5 w-5 p-0"
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pontos extras */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Pontos Extras</h4>
          <div
            className={`${isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}`}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Pole Position</label>
              <Input
                type="number"
                value={formData.polePositionPoints || 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    polePositionPoints: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                step="1"
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Pontos para quem faz a pole position
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Volta Mais Rápida</label>
              <Input
                type="number"
                value={formData.fastestLapPoints || 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fastestLapPoints: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                step="1"
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Pontos para a volta mais rápida da corrida
              </p>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Configurações</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.isActive || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: !!checked,
                  }))
                }
                disabled={loading}
              />
              Sistema ativo
              <span className="text-xs text-muted-foreground ml-1">
                (sistemas ativos podem ser usados nas corridas)
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.isDefault || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isDefault: !!checked,
                  }))
                }
                disabled={loading}
              />
              Definir como padrão
              <span className="text-xs text-muted-foreground ml-1">
                (sistema usado por padrão em novas corridas)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 border border-destructive/50 rounded-md bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Botões */}
      <div
        className={`flex ${isMobile ? "flex-col space-y-2" : "justify-end space-x-2"}`}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className={isMobile ? "w-full" : ""}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className={isMobile ? "w-full" : ""}
        >
          {loading
            ? "Salvando..."
            : isEditing
              ? "Salvar Alterações"
              : "Criar Sistema"}
        </Button>
      </div>
    </form>
  );
};
