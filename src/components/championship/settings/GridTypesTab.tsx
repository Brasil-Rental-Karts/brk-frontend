import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings2, Star, X, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GridType, GridTypeEnum } from "@/lib/types/grid-type";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { GridTypeForm } from "./GridTypeForm";

interface GridTypesTabProps {
  championshipId: string;
}

/**
 * Aba de gerenciamento de tipos de grid do campeonato
 */
export const GridTypesTab = ({ championshipId }: GridTypesTabProps) => {
  const [gridTypes, setGridTypes] = useState<GridType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modal de criação/edição
  const [showForm, setShowForm] = useState(false);
  const [editingGridType, setEditingGridType] = useState<GridType | null>(null);
  
  // Estados para modal de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGridType, setDeletingGridType] = useState<GridType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar tipos de grid
  const fetchGridTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GridTypeService.getByChampionship(championshipId);
      setGridTypes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  // Criar tipos pré-configurados
  const createPredefinedTypes = async () => {
    try {
      setLoading(true);
      await GridTypeService.createPredefined(championshipId);
      await fetchGridTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Alternar status ativo
  const toggleActive = async (gridType: GridType) => {
    // Verificar se está tentando desativar o último tipo ativo
    const activeGridTypes = gridTypes.filter(gt => gt.isActive);
    if (gridType.isActive && activeGridTypes.length <= 1) {
      setError("Não é possível desativar o último tipo de grid ativo. Pelo menos um tipo deve permanecer ativo.");
      return;
    }

    try {
      setError(null); // Limpar erro anterior
      await GridTypeService.toggleActive(championshipId, gridType.id);
      await fetchGridTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Definir como padrão
  const setAsDefault = async (gridType: GridType) => {
    try {
      setError(null); // Limpar erro anterior
      await GridTypeService.setAsDefault(championshipId, gridType.id);
      await fetchGridTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Excluir tipo de grid
  const deleteGridType = async () => {
    if (!deletingGridType) return;

    // Validar se pode excluir
    if (!canDelete(deletingGridType)) {
      if (gridTypes.length <= 1) {
        setError("Não é possível excluir o único tipo de grid. Pelo menos um tipo deve existir.");
      } else if (deletingGridType.isActive) {
        setError("Não é possível excluir o último tipo de grid ativo. Desative outro tipo primeiro ou crie um novo.");
      }
      setShowDeleteDialog(false);
      setDeletingGridType(null);
      return;
    }

    try {
      setIsDeleting(true);
      setError(null); // Limpar erro anterior
      await GridTypeService.delete(championshipId, deletingGridType.id);
      await fetchGridTypes();
      setShowDeleteDialog(false);
      setDeletingGridType(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handlers do formulário
  const handleCreateNew = () => {
    setEditingGridType(null);
    setShowForm(true);
  };

  const handleEdit = (gridType: GridType) => {
    setEditingGridType(gridType);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGridType(null);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingGridType(null);
    await fetchGridTypes();
  };

  const handleDeleteClick = (gridType: GridType) => {
    setDeletingGridType(gridType);
    setShowDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingGridType(null);
  };

  // Buscar dados ao montar
  useEffect(() => {
    fetchGridTypes();
  }, [fetchGridTypes]);

  // Função para obter o ícone do tipo de grid
  const getGridTypeIcon = (type: GridTypeEnum) => {
    switch (type) {
      case GridTypeEnum.SUPER_POLE:
        return "⚡";
      case GridTypeEnum.INVERTED:
        return "🔄";
      case GridTypeEnum.INVERTED_PARTIAL:
        return "🔃";
      default:
        return "📊";
    }
  };

  // Verificar se pode desativar um tipo de grid
  const canDeactivate = (gridType: GridType) => {
    const activeGridTypes = gridTypes.filter(gt => gt.isActive);
    return !(gridType.isActive && activeGridTypes.length <= 1);
  };

  // Verificar se pode excluir um tipo de grid
  const canDelete = (gridType: GridType) => {
    // Não pode excluir se há apenas um tipo de grid total
    if (gridTypes.length <= 1) return false;
    
    // Se está tentando excluir um tipo ativo, verificar se não é o último ativo
    if (gridType.isActive) {
      const activeGridTypes = gridTypes.filter(gt => gt.isActive);
      return activeGridTypes.length > 1;
    }
    
    // Pode excluir tipos inativos sempre (desde que não seja o único total)
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Carregando tipos de grid...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="h-auto p-1 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (gridTypes.length === 0) {
    return (
      <EmptyState
        icon={Settings2}
        title="Nenhum tipo de grid configurado"
        description="Configure tipos de grid para definir como as posições de largada serão determinadas"
        action={{
          label: "Criar Tipos Pré-configurados",
          onClick: createPredefinedTypes,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Grid</h3>
          <p className="text-sm text-muted-foreground">
            Configure como as posições de largada serão determinadas
          </p>
        </div>
        <Button onClick={handleCreateNew} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {/* Lista de tipos de grid */}
      <div className="grid gap-4">
        {gridTypes.map((gridType) => (
          <Card key={gridType.id} className={!gridType.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getGridTypeIcon(gridType.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{gridType.name}</CardTitle>
                      {gridType.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {gridType.description}
                    </CardDescription>
                    {gridType.type === GridTypeEnum.INVERTED_PARTIAL && gridType.invertedPositions && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {gridType.invertedPositions} posições invertidas
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Ativo</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Checkbox
                              checked={gridType.isActive}
                              onCheckedChange={() => {
                                if (canDeactivate(gridType)) {
                                  toggleActive(gridType);
                                }
                              }}
                              disabled={!canDeactivate(gridType)}
                              className={!canDeactivate(gridType) ? "opacity-50 cursor-not-allowed" : ""}
                            />
                          </div>
                        </TooltipTrigger>
                        {!canDeactivate(gridType) && (
                          <TooltipContent>
                            <p>Não é possível desativar o último tipo de grid ativo</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(gridType)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (canDelete(gridType)) {
                                handleDeleteClick(gridType);
                              }
                            }}
                            disabled={!canDelete(gridType)}
                            className={`text-destructive hover:text-destructive ${
                              !canDelete(gridType) ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!canDelete(gridType) && (
                        <TooltipContent>
                          <p>
                            {gridTypes.length <= 1 
                              ? "Não é possível excluir o único tipo de grid"
                              : "Não é possível excluir o último tipo de grid ativo"
                            }
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            {!gridType.isDefault && gridType.isActive && (
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAsDefault(gridType)}
                  className="text-xs"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Definir como Padrão
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Modal de criação/edição */}
      <GridTypeForm
        championshipId={championshipId}
        gridType={editingGridType}
        open={showForm}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o tipo de grid <strong>"{deletingGridType?.name}"</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteGridType}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 