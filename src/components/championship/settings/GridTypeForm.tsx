import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GridType, GridTypeEnum, GridTypeFormData, PREDEFINED_GRID_TYPES } from "@/lib/types/grid-type";
import { GridTypeService } from "@/lib/services/grid-type.service";

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
    invertedPositions: 10
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
        invertedPositions: gridType.invertedPositions || 10
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: GridTypeEnum.SUPER_POLE,
        isActive: true,
        isDefault: false,
        invertedPositions: 10
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
      invertedPositions: template.invertedPositions || 10
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

      // Preparar dados
      const dataToSubmit = { ...formData };
      if (formData.type !== GridTypeEnum.INVERTED_PARTIAL) {
        delete dataToSubmit.invertedPositions;
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
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tipo de Grid" : "Novo Tipo de Grid"}
          </DialogTitle>
          <DialogDescription>
            Configure como as posições de largada serão determinadas
          </DialogDescription>
        </DialogHeader>

        {/* Templates rápidos - apenas no modo de criação */}
        {!isEditing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
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
                        <span className="text-lg">
                          {template.type === GridTypeEnum.SUPER_POLE && "⚡"}
                          {template.type === GridTypeEnum.INVERTED && "🔄"}
                          {template.type === GridTypeEnum.INVERTED_PARTIAL && "🔃"}
                        </span>
                        {template.name}
                        {template.invertedPositions && (
                          <Badge variant="outline" className="text-xs">
                            {template.invertedPositions} posições
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
                  Super Pole ⚡
                </SelectItem>
                <SelectItem value={GridTypeEnum.INVERTED}>
                  Invertido 🔄
                </SelectItem>
                <SelectItem value={GridTypeEnum.INVERTED_PARTIAL}>
                  Invertido Parcial 🔃
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
              <div className="flex gap-2">
                <Input
                  id="invertedPositions"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.invertedPositions || ""}
                  onChange={(e) => handleInputChange("invertedPositions", parseInt(e.target.value) || 1)}
                  placeholder="10"
                  disabled={loading}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {[3, 5, 8, 10, 12, 15].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("invertedPositions", num)}
                      disabled={loading}
                      className="px-2 py-1 text-xs"
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