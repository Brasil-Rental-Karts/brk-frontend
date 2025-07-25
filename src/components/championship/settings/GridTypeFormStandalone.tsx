import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "brk-design-system";
import { useEffect, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { GridTypeIcon } from "@/lib/icons/grid-type-icons";
import {
  GridType,
  GridTypeEnum,
  GridTypeFormData,
  PREDEFINED_GRID_TYPES,
} from "@/lib/types/grid-type";

interface GridTypeFormStandaloneProps {
  championshipId: string;
  initialData?: GridType | null;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Formulário standalone para criação/edição de tipos de grid
 */
export const GridTypeFormStandalone = ({
  championshipId,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: GridTypeFormStandaloneProps) => {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<GridTypeFormData>({
    name: "",
    description: "",
    type: GridTypeEnum.SUPER_POLE,
    isActive: true,
    isDefault: false,
    invertedPositions: 10,
    qualifyingDuration: 5,
  });

  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const isEditing = !!initialData;

  // Preencher formulário no modo de edição
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        type: initialData.type,
        isActive: initialData.isActive,
        isDefault: initialData.isDefault,
        invertedPositions: initialData.invertedPositions || 10,
        qualifyingDuration: initialData.qualifyingDuration || 5,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: GridTypeEnum.SUPER_POLE,
        isActive: true,
        isDefault: false,
        invertedPositions: 10,
        qualifyingDuration: 5,
      });
    }
    setError(null);
  }, [initialData]);

  const handleInputChange = (field: keyof GridTypeFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyTemplate = (template: (typeof PREDEFINED_GRID_TYPES)[0]) => {
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      isActive: true,
      isDefault: false,
      invertedPositions: template.invertedPositions || 10,
      qualifyingDuration: template.qualifyingDuration || 5,
    });
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error("Nome é obrigatório");
      }
      if (!formData.description.trim()) {
        throw new Error("Descrição é obrigatória");
      }
      if (
        formData.type === GridTypeEnum.INVERTED_PARTIAL &&
        (!formData.invertedPositions || formData.invertedPositions < 1)
      ) {
        throw new Error("Número de posições invertidas deve ser maior que 0");
      }
      if (
        formData.type === GridTypeEnum.QUALIFYING_SESSION &&
        (!formData.qualifyingDuration || formData.qualifyingDuration < 1)
      ) {
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

      await onSubmit(dataToSubmit);
    } catch (err: any) {
      setError(err.message);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                  className="justify-start h-auto p-3 text-left w-full"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="w-full min-w-0">
                    <div className="flex items-center gap-2 font-medium flex-wrap">
                      <GridTypeIcon
                        type={template.type}
                        size={18}
                        withColor={true}
                      />
                      <span className="flex-shrink-0">{template.name}</span>
                      {template.invertedPositions && (
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0"
                        >
                          {template.invertedPositions} posições
                        </Badge>
                      )}
                      {template.qualifyingDuration && (
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0"
                        >
                          {template.qualifyingDuration} min
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-words whitespace-normal leading-relaxed">
                      {template.description}
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
          <Label htmlFor="name" className="text-sm font-medium">
            Nome do Tipo de Grid <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Ex: Super Pole"
            disabled={loading}
            className="mt-1"
          />
        </div>

        {/* Descrição */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Descrição <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Descreva como funciona este tipo de grid"
            disabled={loading}
            className="mt-1"
            rows={3}
          />
        </div>

        {/* Tipo */}
        <div>
          <Label htmlFor="type" className="text-sm font-medium">
            Tipo de Grid <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleInputChange("type", value)}
            disabled={loading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GridTypeEnum.SUPER_POLE}>
                <div className="flex items-center gap-2">
                  <GridTypeIcon
                    type={GridTypeEnum.SUPER_POLE}
                    size={16}
                    withColor={true}
                  />
                  Super Pole
                </div>
              </SelectItem>
              <SelectItem value={GridTypeEnum.INVERTED}>
                <div className="flex items-center gap-2">
                  <GridTypeIcon
                    type={GridTypeEnum.INVERTED}
                    size={16}
                    withColor={true}
                  />
                  Invertido
                </div>
              </SelectItem>
              <SelectItem value={GridTypeEnum.INVERTED_PARTIAL}>
                <div className="flex items-center gap-2">
                  <GridTypeIcon
                    type={GridTypeEnum.INVERTED_PARTIAL}
                    size={16}
                    withColor={true}
                  />
                  Invertido Parcial
                </div>
              </SelectItem>
              <SelectItem value={GridTypeEnum.QUALIFYING_SESSION}>
                <div className="flex items-center gap-2">
                  <GridTypeIcon
                    type={GridTypeEnum.QUALIFYING_SESSION}
                    size={16}
                    withColor={true}
                  />
                  Sessão de Classificação
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {getTypeDescription(formData.type)}
          </p>
        </div>

        {/* Campos específicos por tipo */}
        {formData.type === GridTypeEnum.INVERTED_PARTIAL && (
          <div>
            <Label htmlFor="invertedPositions" className="text-sm font-medium">
              Número de Posições Invertidas{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="invertedPositions"
              type="number"
              min="1"
              value={formData.invertedPositions}
              onChange={(e) =>
                handleInputChange(
                  "invertedPositions",
                  parseInt(e.target.value) || 0,
                )
              }
              disabled={loading}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quantas posições da bateria anterior serão invertidas
            </p>
          </div>
        )}

        {formData.type === GridTypeEnum.QUALIFYING_SESSION && (
          <div>
            <Label htmlFor="qualifyingDuration" className="text-sm font-medium">
              Duração da Sessão (minutos){" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="qualifyingDuration"
              type="number"
              min="1"
              value={formData.qualifyingDuration}
              onChange={(e) =>
                handleInputChange(
                  "qualifyingDuration",
                  parseInt(e.target.value) || 0,
                )
              }
              disabled={loading}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tempo disponível para os pilotos fazerem suas voltas mais rápidas
            </p>
          </div>
        )}

        {/* Opções */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                handleInputChange("isActive", checked)
              }
              disabled={loading}
            />
            <Label htmlFor="isActive" className="text-sm">
              Ativo
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                handleInputChange("isDefault", checked)
              }
              disabled={loading}
            />
            <Label htmlFor="isDefault" className="text-sm">
              Definir como padrão
            </Label>
          </div>
        </div>
      </div>

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
              : "Criar Tipo de Grid"}
        </Button>
      </div>
    </form>
  );
};
