import { useState, useEffect, forwardRef } from "react";
import { Button } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Card, CardContent, CardHeader, CardTitle } from "brk-design-system";
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
import { Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { BatteryConfig, BatteriesConfig, BATTERY_TEMPLATES, validateBatteriesConfig } from "@/lib/types/battery.types";
import { GridType } from "@/lib/types/grid-type";
import { ScoringSystem } from "@/lib/services/scoring-system.service";
import { GridTypeIcon } from "@/lib/icons/grid-type-icons";

interface BatteriesConfigFormProps {
  value: BatteriesConfig;
  onChange: (config: BatteriesConfig) => void;
  gridTypes: GridType[];
  scoringSystems: ScoringSystem[];
  disabled?: boolean;
}

/**
 * Componente para configurar baterias de uma categoria
 */
export const BatteriesConfigForm = forwardRef<HTMLDivElement, BatteriesConfigFormProps>(({
  value: batteries = [],
  onChange,
  gridTypes,
  scoringSystems,
  disabled = false
}, ref) => {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingBattery, setEditingBattery] = useState<BatteryConfig | null>(null);
  const [showBatteryForm, setShowBatteryForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Validate whenever the value from the parent form changes
  useEffect(() => {
    const validationErrors = validateBatteriesConfig(batteries);
    setErrors(validationErrors);
  }, [batteries]);

  const addBattery = (template?: BatteryConfig) => {
    const newOrder = Math.max(0, ...batteries.map(b => b.order)) + 1;
    const newBattery: BatteryConfig = template || {
      name: `Bateria ${newOrder}`,
      gridType: gridTypes.find(gt => gt.isDefault)?.id || gridTypes[0]?.id || "",
      scoringSystemId: scoringSystems.find(ss => ss.isDefault)?.id || scoringSystems[0]?.id || "",
      order: newOrder,
      isRequired: true,
      description: ""
    };
    onChange([...batteries, { ...newBattery, order: newOrder }]);
  };

  const updateBattery = (index: number, updatedBattery: BatteryConfig) => {
    const newBatteries = [...batteries];
    newBatteries[index] = updatedBattery;
    onChange(newBatteries);
  };

  const removeBattery = (index: number) => {
    const newBatteries = batteries.filter((_, i) => i !== index);
    const reorderedBatteries = newBatteries.map((battery, i) => ({
      ...battery,
      order: i + 1
    }));
    onChange(reorderedBatteries);
  };

  const applyTemplate = (templateKey: keyof typeof BATTERY_TEMPLATES) => {
    const template = BATTERY_TEMPLATES[templateKey];
    const templatedBatteries = template.map((battery, index) => ({
      ...battery,
      gridType: gridTypes.find(gt => gt.isDefault)?.id || gridTypes[0]?.id || "",
      scoringSystemId: scoringSystems.find(ss => ss.isDefault)?.id || scoringSystems[0]?.id || "",
      order: index + 1
    }));
    onChange(templatedBatteries);
    setShowTemplateDialog(false);
  };

  const handleEditBattery = (battery: BatteryConfig, index: number) => {
    setEditingBattery({ ...battery, order: index });
    setShowBatteryForm(true);
  };

  const handleSaveBattery = (battery: BatteryConfig) => {
    if (editingBattery) {
      updateBattery(editingBattery.order, battery);
    } else {
      addBattery(battery);
    }
    setEditingBattery(null);
    setShowBatteryForm(false);
  };

  const getGridTypeName = (gridTypeId: string) => {
    const gridType = gridTypes.find(gt => gt.id === gridTypeId);
    return gridType ? gridType.name : "Tipo não encontrado";
  };

  const getGridTypeIcon = (gridTypeId: string) => {
    const gridType = gridTypes.find(gt => gt.id === gridTypeId);
    if (!gridType) return <span className="text-lg">❓</span>;
    
    return <GridTypeIcon type={gridType.type} size={20} withColor={true} />;
  };

  const getScoringSystemName = (scoringSystemId: string) => {
    const scoringSystem = scoringSystems.find(ss => ss.id === scoringSystemId);
    return scoringSystem ? scoringSystem.name : "Sistema não encontrado";
  };

  return (
    <div className="space-y-4" ref={ref}>
      {/* Header com templates */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Label className="text-base font-medium">Configuração de Baterias</Label>
          <p className="text-sm text-muted-foreground">
            Configure as baterias, seus tipos de grid e sistemas de pontuação
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateDialog(true)}
            disabled={disabled}
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Settings2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Templates
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingBattery(null);
              setShowBatteryForm(true);
            }}
            disabled={disabled}
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Erros de validação - só mostra se há baterias ou se não está carregando */}
      {errors.length > 0 && batteries.length > 0 && !disabled && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de baterias */}
      <div className="space-y-3">
        {batteries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-center">
                <h3 className="text-lg font-medium">Nenhuma bateria configurada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione baterias para definir a estrutura da categoria
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplateDialog(true)}
                  disabled={disabled}
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Usar Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          batteries
            .sort((a, b) => a.order - b.order)
            .map((battery, index) => (
              <Card key={index} className={!battery.isRequired ? "border-dashed opacity-75" : ""}>
                <CardHeader className="pb-3">
                  {/* Layout Desktop */}
                  <div className="hidden sm:flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          {getGridTypeIcon(battery.gridType)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{battery.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            #{battery.order}
                          </Badge>
                          {!battery.isRequired && (
                            <Badge variant="secondary" className="text-xs">
                              Opcional
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Grid: {getGridTypeName(battery.gridType)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pontuação: {getScoringSystemName(battery.scoringSystemId)}
                          </p>
                          {battery.description && (
                            <p className="text-xs text-muted-foreground">
                              {battery.description}
                            </p>
                          )}
                          {battery.duration && (
                            <Badge variant="outline" className="text-xs">
                              {battery.duration} min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBattery(battery, index)}
                        disabled={disabled}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBattery(index)}
                        disabled={disabled || batteries.length <= 1}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Layout Mobile */}
                  <div className="sm:hidden space-y-3">
                    {/* Linha 1: Título e badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                          {getGridTypeIcon(battery.gridType)}
                        </div>
                        <CardTitle className="text-sm">{battery.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          #{battery.order}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBattery(battery, index)}
                          disabled={disabled}
                          className="h-8 w-8 p-0"
                        >
                          <Settings2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBattery(index)}
                          disabled={disabled || batteries.length <= 1}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Linha 2: Informações e badges */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Grid: {getGridTypeName(battery.gridType)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pontuação: {getScoringSystemName(battery.scoringSystemId)}
                      </p>
                      {battery.description && (
                        <p className="text-xs text-muted-foreground">
                          {battery.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {!battery.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Opcional
                          </Badge>
                        )}
                        {battery.duration && (
                          <Badge variant="outline" className="text-xs">
                            {battery.duration} min
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
        )}
      </div>

      {/* Dialog de templates */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Escolher Template</DialogTitle>
            <DialogDescription className="text-sm">
              Selecione um template pré-configurado para as baterias
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start h-auto p-4"
              onClick={() => applyTemplate('SINGLE')}
            >
              <div className="text-left">
                <div className="font-medium">Bateria Única</div>
                <div className="text-sm text-muted-foreground">
                  Uma única "Bateria 1" principal
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start h-auto p-4"
              onClick={() => applyTemplate('QUALIFYING_RACE')}
            >
              <div className="text-left">
                <div className="font-medium">Classificação + Corrida</div>
                <div className="text-sm text-muted-foreground">
                  Bateria de classificação seguida da corrida principal
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start h-auto p-4"
              onClick={() => applyTemplate('QUALIFYING_SEMI_FINAL')}
            >
              <div className="text-left">
                <div className="font-medium">Classificação + Semifinal + Final</div>
                <div className="text-sm text-muted-foreground">
                  Formato completo com eliminatórias
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start h-auto p-4"
              onClick={() => applyTemplate('PRACTICE_QUALIFYING_RACE')}
            >
              <div className="text-left">
                <div className="font-medium">Treino + Classificação + Corrida</div>
                <div className="text-sm text-muted-foreground">
                  Formato completo com treino opcional
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de bateria */}
      <BatteryFormDialog
        open={showBatteryForm}
        onOpenChange={setShowBatteryForm}
        battery={editingBattery}
        gridTypes={gridTypes}
        scoringSystems={scoringSystems}
        onSave={handleSaveBattery}
      />
    </div>
  );
});

// Componente auxiliar para o formulário de bateria
interface BatteryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  battery: BatteryConfig | null;
  gridTypes: GridType[];
  scoringSystems: ScoringSystem[];
  onSave: (battery: BatteryConfig) => void;
}

const BatteryFormDialog = ({
  open,
  onOpenChange,
  battery,
  gridTypes,
  scoringSystems,
  onSave
}: BatteryFormDialogProps) => {
  const [formData, setFormData] = useState<BatteryConfig>({
    name: "",
    gridType: "",
    scoringSystemId: "",
    order: 1,
    isRequired: true,
    description: ""
  });

  useEffect(() => {
    if (battery) {
      setFormData(battery);
    } else {
      setFormData({
        name: "",
        gridType: gridTypes.find(gt => gt.isDefault)?.id || gridTypes[0]?.id || "",
        scoringSystemId: scoringSystems.find(ss => ss.isDefault)?.id || scoringSystems[0]?.id || "",
        order: 1,
        isRequired: true,
        description: ""
      });
    }
  }, [battery, gridTypes, scoringSystems, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {battery ? "Editar Bateria" : "Nova Bateria"}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da bateria
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Classificação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gridType">Tipo de Grid *</Label>
            <Select
              value={formData.gridType}
              onValueChange={(value) => setFormData({ ...formData, gridType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de grid" />
              </SelectTrigger>
              <SelectContent>
                {gridTypes.map((gridType) => (
                  <SelectItem key={gridType.id} value={gridType.id}>
                    <div className="flex items-center gap-2">
                      <GridTypeIcon type={gridType.type} size={16} />
                      {gridType.name}
                      {gridType.isDefault && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scoringSystemId">Sistema de Pontuação *</Label>
            <Select
              value={formData.scoringSystemId}
              onValueChange={(value) => setFormData({ ...formData, scoringSystemId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o sistema de pontuação" />
              </SelectTrigger>
              <SelectContent>
                {scoringSystems.map((scoringSystem) => (
                  <SelectItem key={scoringSystem.id} value={scoringSystem.id}>
                    <div className="flex items-center gap-2">
                      {scoringSystem.name}
                      {scoringSystem.isDefault && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional da bateria"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration || ""}
              onChange={(e) => setFormData({ 
                ...formData, 
                duration: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Ex: 15"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRequired"
              checked={formData.isRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked === true })}
            />
            <Label htmlFor="isRequired" className="text-sm font-normal">
              Bateria obrigatória
            </Label>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {battery ? "Atualizar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 