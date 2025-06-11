import { useState, useEffect } from "react";
import { Button } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Badge } from "brk-design-system";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { GridType, GridTypeEnum, GridTypeFormData, PREDEFINED_GRID_TYPES } from "@/lib/types/grid-type";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { GridTypeIcon } from "@/lib/icons/grid-type-icons";

interface GridTypeFormProps {
  championshipId: string;
  gridType?: GridType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Formulário para criação/edição de tipos de grid
 */
export const GridTypeForm = ({
  championshipId,
  gridType,
  open,
  onOpenChange,
  onSuccess
}: GridTypeFormProps) => {
  const [formData, setFormData] = useState<GridTypeFormData>({
    name: "",
    description: "",
    type: GridTypeEnum.SUPER_POLE,
    isActive: true,
    isDefault: false,
    invertedPositions: 10,
    qualifyingDuration: 5
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const isEditing = !!gridType;

  // Preencher formulário no modo de edição
  useEffect(() => {
    if (gridType) {
      setFormData({
        name: gridType.name,
        description: gridType.description,
        type: gridType.type,
        isActive: gridType.isActive,
        isDefault: gridType.isDefault,
        invertedPositions: gridType.invertedPositions || 10,
        qualifyingDuration: gridType.qualifyingDuration || 5
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: GridTypeEnum.SUPER_POLE,
        isActive: true,
        isDefault: false,
        invertedPositions: 10,
        qualifyingDuration: 5
      });
    }
    setError(null);
  }, [gridType, open]);

  const handleInputChange = (field: keyof GridTypeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyTemplate = (template: typeof PREDEFINED_GRID_TYPES[0]) => {
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      isActive: true,
      isDefault: false,
      invertedPositions: template.invertedPositions || 10,
      qualifyingDuration: template.qualifyingDuration || 5
    });
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error("Nome é obrigatório");
      }
      if (!formData.description.trim()) {
        throw new Error("Descrição é obrigatória");
      }
      if (formData.type === GridTypeEnum.INVERTED_PARTIAL && (!formData.invertedPositions || formData.invertedPositions < 1)) {
        throw new Error("Número de posições invertidas deve ser maior que 0");
      }
      if (formData.type === GridTypeEnum.QUALIFYING_SESSION && (!formData.qualifyingDuration || formData.qualifyingDuration < 1)) {
        throw new Error("Duração da classificação deve ser maior que 0");
      }

      // Preparar dados
      const dataToSubmit = { ...formData };
      if (formData.type !== GridTypeEnum.INVERTED_PARTIAL) {
        delete dataToSubmit.invertedPositions;
      }
      if (formData.type !== GridTypeEnum.QUALIFYING_SESSION) {
        delete dataToSubmit.qualifyingDuration;
      }

      if (isEditing) {
        await GridTypeService.update(championshipId, gridType.id, dataToSubmit);
      } else {
        await GridTypeService.create(championshipId, dataToSubmit);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeDescription = (type: GridTypeEnum) => {
    switch (type) {
      case GridTypeEnum.SUPER_POLE:
        return "A volta mais rápida da classificação define a ordem de largada";
      case GridTypeEnum.INVERTED:
        return "Posições de largada são definidas pelo resultado da bateria anterior de forma invertida";
      case GridTypeEnum.INVERTED_PARTIAL:
        return "Inverte apenas as primeiras N posições da bateria anterior (personalizável)";
      case GridTypeEnum.QUALIFYING_SESSION:
        return "Sessão de classificação por tempo determinado. Posições definidas pela volta mais rápida durante a sessão";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? "Editar Tipo de Grid" : "Novo Tipo de Grid"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configure como as posições de largada serão determinadas
          </DialogDescription>
        </DialogHeader>

        {/* Templates rápidos - apenas no modo de criação */}
        {!isEditing && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">Templates Rápidos</Label>
                <p className="text-xs text-muted-foreground">
                  Use um template para criar rapidamente ou personalize abaixo
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs"
              >
                {showTemplates ? "Ocultar" : "Mostrar"} Templates
              </Button>
            </div>
            
            {showTemplates && (
              <div className="grid gap-2">
                {PREDEFINED_GRID_TYPES.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => applyTemplate(template)}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <GridTypeIcon 
                          type={template.type} 
                          size={18} 
                          withColor={true}
                        />
                        {template.name}
                        {template.invertedPositions && (
                          <Badge variant="outline" className="text-xs">
                            {template.invertedPositions} posições
                          </Badge>
                        )}
                        {template.qualifyingDuration && (
                          <Badge variant="outline" className="text-xs">
                            {template.qualifyingDuration} min
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Super Pole Personalizado"
              disabled={loading}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value as GridTypeEnum)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GridTypeEnum.SUPER_POLE}>
                  <div className="flex items-center gap-2">
                    <GridTypeIcon type={GridTypeEnum.SUPER_POLE} size={16} />
                    Super Pole
                  </div>
                </SelectItem>
                <SelectItem value={GridTypeEnum.INVERTED}>
                  <div className="flex items-center gap-2">
                    <GridTypeIcon type={GridTypeEnum.INVERTED} size={16} />
                    Invertido
                  </div>
                </SelectItem>
                <SelectItem value={GridTypeEnum.INVERTED_PARTIAL}>
                  <div className="flex items-center gap-2">
                    <GridTypeIcon type={GridTypeEnum.INVERTED_PARTIAL} size={16} />
                    Invertido Parcial
                  </div>
                </SelectItem>
                <SelectItem value={GridTypeEnum.QUALIFYING_SESSION}>
                  <div className="flex items-center gap-2">
                    <GridTypeIcon type={GridTypeEnum.QUALIFYING_SESSION} size={16} />
                    Classificação por Tempo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getTypeDescription(formData.type)}
            </p>
          </div>

          {/* Posições invertidas (apenas para tipo parcial) */}
          {formData.type === GridTypeEnum.INVERTED_PARTIAL && (
            <div className="space-y-2">
              <Label htmlFor="invertedPositions">Número de posições invertidas *</Label>
              <div className="space-y-2">
                <Input
                  id="invertedPositions"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.invertedPositions || ""}
                  onChange={(e) => handleInputChange("invertedPositions", parseInt(e.target.value) || 1)}
                  placeholder="10"
                  disabled={loading}
                  className="w-full"
                />
                <div className="grid grid-cols-3 sm:flex gap-1">
                  {[3, 5, 8, 10, 12, 15].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("invertedPositions", num)}
                      disabled={loading}
                      className="px-2 py-1 text-xs flex-1"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Quantas posições a partir do primeiro colocado serão invertidas (ex: 10 = inverte do 1º ao 10º lugar)
              </p>
            </div>
          )}

          {/* Duração da classificação (apenas para tipo qualifying_session) */}
          {formData.type === GridTypeEnum.QUALIFYING_SESSION && (
            <div className="space-y-2">
              <Label htmlFor="qualifyingDuration">Duração da classificação (minutos) *</Label>
              <div className="space-y-2">
                <Input
                  id="qualifyingDuration"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.qualifyingDuration || ""}
                  onChange={(e) => handleInputChange("qualifyingDuration", parseInt(e.target.value) || 1)}
                  placeholder="5"
                  disabled={loading}
                  className="w-full"
                />
                <div className="grid grid-cols-3 sm:flex gap-1">
                  {[3, 5, 10, 15, 20, 30].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("qualifyingDuration", num)}
                      disabled={loading}
                      className="px-2 py-1 text-xs flex-1"
                    >
                      {num}min
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tempo total da sessão de classificação. Posições definidas pela volta mais rápida durante este período
              </p>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva como este tipo de grid funciona..."
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Opções */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                disabled={loading}
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                Ativar este tipo de grid
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => handleInputChange("isDefault", checked)}
                disabled={loading}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Definir como padrão
              </Label>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 