import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Plus, Settings2, Star, X, Trash2 } from "lucide-react";
import { EmptyState } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "brk-design-system";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "brk-design-system";
import { GridType, GridTypeEnum } from "@/lib/types/grid-type";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { GridTypeIcon } from "@/lib/icons/grid-type-icons";
import { Loading } from '@/components/ui/loading';
import { useChampionshipData } from '@/contexts/ChampionshipContext';

interface GridTypesTabProps {
  championshipId: string;
}

/**
 * Aba de gerenciamento de tipos de grid do campeonato
 */
export const GridTypesTab = ({ championshipId }: GridTypesTabProps) => {
  const navigate = useNavigate();
  
  // Usar o contexto de dados do campeonato
  const { getGridTypes, updateGridType, updateAllGridTypes, removeGridType, loading: contextLoading, error: contextError } = useChampionshipData();
  
  const [gridTypes, setGridTypes] = useState<GridType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modal de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGridType, setDeletingGridType] = useState<GridType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar tipos de grid do contexto
  const loadGridTypes = useCallback(() => {
    try {
      setError(null);
      const data = getGridTypes();
      setGridTypes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getGridTypes]);

  // Atualizar grid types quando o contexto mudar
  useEffect(() => {
    const data = getGridTypes();
    setGridTypes(data);
    setLoading(false);
  }, [getGridTypes]);

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
      const updatedGridType = await GridTypeService.toggleActive(championshipId, gridType.id);
      
      // Se o grid type que foi alterado era padrão e agora não é mais,
      // ou se outro grid type se tornou padrão, recarregar todos os grid types
      // para garantir que o contexto esteja sincronizado
      if (gridType.isDefault !== updatedGridType.isDefault) {
        // Buscar todos os grid types atualizados do backend para garantir sincronização
        const allUpdatedGridTypes = await GridTypeService.getByChampionship(championshipId);
        updateAllGridTypes(allUpdatedGridTypes);
      } else {
        // Se apenas o status ativo mudou, atualizar apenas o grid type específico
        updateGridType(gridType.id, updatedGridType);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Definir como padrão
  const setAsDefault = async (gridType: GridType) => {
    try {
      setError(null); // Limpar erro anterior
      const updatedGridType = await GridTypeService.setAsDefault(championshipId, gridType.id);
      
      // Quando um grid type é definido como padrão, outros podem ter sido afetados
      // Buscar todos os grid types atualizados do backend para garantir sincronização
      const allUpdatedGridTypes = await GridTypeService.getByChampionship(championshipId);
      updateAllGridTypes(allUpdatedGridTypes);
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
      // Remover o grid type do contexto
      removeGridType(deletingGridType.id);
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
    navigate(`/championship/${championshipId}/grid-type/new`);
  };

  const handleEdit = (gridType: GridType) => {
    navigate(`/championship/${championshipId}/grid-type/${gridType.id}/edit`);
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
    loadGridTypes();
  }, [loadGridTypes]);

  // Função para obter o ícone do tipo de grid
  const getGridTypeIcon = (type: GridTypeEnum) => {
    return <GridTypeIcon type={type} size={24} withColor={true} />;
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

  // Usar loading do contexto se disponível
  const isLoading = contextLoading.gridTypes || loading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading type="spinner" size="sm" message="Carregando tipos de grid..." />
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
          label: "Novo Tipo",
          onClick: handleCreateNew,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Tipos de Grid</h3>
          <p className="text-sm text-muted-foreground">
            Configure como as posições de largada serão determinadas
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-full sm:w-auto">
          Adicionar Tipo de Grid
        </Button>
      </div>

      {/* Lista de tipos de grid */}
      <div className="grid gap-4">
        {gridTypes.map((gridType) => (
          <Card key={gridType.id} className={!gridType.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              {/* Layout Desktop */}
              <div className="hidden md:flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getGridTypeIcon(gridType.type)}</div>
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
                    {gridType.type === GridTypeEnum.QUALIFYING_SESSION && gridType.qualifyingDuration && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {gridType.qualifyingDuration} minutos
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

              {/* Layout Mobile */}
              <div className="md:hidden space-y-3">
                {/* Linha 1: Título, badge padrão e ações */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0">{getGridTypeIcon(gridType.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-sm truncate">{gridType.name}</CardTitle>
                        {gridType.isDefault && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            <Star className="mr-1 h-3 w-3" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(gridType)}
                      className="h-8 w-8 p-0"
                    >
                      <Settings2 className="h-3 w-3" />
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
                              className={`text-destructive hover:text-destructive h-8 w-8 p-0 ${
                                !canDelete(gridType) ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <Trash2 className="h-3 w-3" />
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

                {/* Linha 2: Descrição */}
                <div>
                  <CardDescription className="text-xs">
                    {gridType.description}
                  </CardDescription>
                </div>

                {/* Linha 3: Badges e checkbox ativo */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {gridType.type === GridTypeEnum.INVERTED_PARTIAL && gridType.invertedPositions && (
                      <Badge variant="outline" className="text-xs">
                        {gridType.invertedPositions} posições invertidas
                      </Badge>
                    )}
                    {gridType.type === GridTypeEnum.QUALIFYING_SESSION && gridType.qualifyingDuration && (
                      <Badge variant="outline" className="text-xs">
                        {gridType.qualifyingDuration} minutos
                      </Badge>
                    )}
                  </div>
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
                </div>
              </div>
            </CardHeader>
            {!gridType.isDefault && gridType.isActive && (
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAsDefault(gridType)}
                  className="text-xs w-full md:w-auto"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Definir como Padrão
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

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