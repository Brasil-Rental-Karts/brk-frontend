import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { PlusCircle, MapPin, Clock, Users, MoreVertical, Calendar, Flag, Link as LinkIcon } from "lucide-react";
import { EmptyState } from "brk-design-system";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "brk-design-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "brk-design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "brk-design-system";
import { usePagination } from "@/hooks/usePagination";
import { StageService } from "@/lib/services/stage.service";
import { SeasonService } from "@/lib/services/season.service";
import { Stage } from "@/lib/types/stage";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { StageDetailsModal } from "@/components/championship/modals/StageDetailsModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "brk-design-system";

interface StagesTabProps {
  championshipId: string;
}

// Configuração inicial dos filtros
const createFilterFields = (seasonOptions: { value: string; label: string }[] = []): FilterField[] => [
  {
    key: 'seasonId',
    label: 'Temporada',
    type: 'combobox',
    placeholder: 'Todas as temporadas',
    options: seasonOptions
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'past', label: 'Realizadas' },
      { value: 'today', label: 'Hoje' },
      { value: 'soon', label: 'Em breve' },
      { value: 'future', label: 'Futuras' }
    ]
  }
];

/**
 * Tab de etapas do campeonato
 * Exibe e gerencia as etapas de um campeonato específico
 */
export const StagesTab = ({ championshipId }: StagesTabProps) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Stage>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonOptions, setSeasonOptions] = useState<{ value: string; label: string }[]>([]);
  const [seasonMap, setSeasonMap] = useState<{ [key: string]: any }>({});
  const [canCreateStage, setCanCreateStage] = useState(false);

  // Estados para o modal de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados para o modal de detalhes
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stageToView, setStageToView] = useState<Stage | null>(null);

  // Memoizar a configuração dos filtros para evitar re-renders
  const filterFields = useMemo(() => createFilterFields(seasonOptions), [seasonOptions]);

  // Buscar temporadas do campeonato (apenas uma vez)
  const fetchSeasons = useCallback(async () => {
    try {
      const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
      
      const hasCreatableSeason = seasonsData.data.some((season: any) => season.status !== 'cancelado');
      setCanCreateStage(hasCreatableSeason);

      // Criar mapa de temporadas
      const newSeasonMap: { [key: string]: any } = {};
      seasonsData.data.forEach((season: any) => {
        newSeasonMap[season.id] = season;
      });
      setSeasonMap(newSeasonMap);
      
      // Atualizar opções do filtro
      const newSeasonOptions = [
        { value: 'all', label: 'Todas as temporadas' },
        ...seasonsData.data.map((season: any) => ({
          value: season.id,
          label: season.name
        }))
      ];
      setSeasonOptions(newSeasonOptions);
      return seasonsData.data;
    } catch (err: any) {
      console.error('Error loading seasons:', err);
      return [];
    }
  }, [championshipId]);

  // Buscar etapas do backend
  const fetchStages = useCallback(async (seasons: any[] = []) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar etapas
      let allStages: Stage[] = [];
      
      if (filters.seasonId && filters.seasonId !== 'all') {
        // Se filtro por temporada específica
        allStages = await StageService.getBySeasonId(filters.seasonId as string);
      } else {
        // Buscar de todas as temporadas
        for (const season of seasons) {
          try {
            const seasonStages = await StageService.getBySeasonId(season.id);
            allStages.push(...seasonStages);
          } catch (err) {
            console.warn(`Error loading stages for season ${season.id}:`, err);
          }
        }
      }

      setStages(allStages);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar etapas');
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [filters.seasonId]);



  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      try {
        const seasons = await fetchSeasons();
        if (mounted) {
          await fetchStages(seasons);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
    
    return () => {
      mounted = false;
    };
  }, [championshipId]);

  // Aplicar filtros e ordenação aos dados
  const processedStages = useMemo(() => {
    if (stages.length === 0) return [];
    
    let result = [...stages];

    // Aplicar filtros
    if (filters.seasonId && filters.seasonId !== 'all') {
      result = result.filter(stage => stage.seasonId === filters.seasonId);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(stage => {
        const status = StageService.getStageStatus(stage.date, stage.time);
        return status === filters.status;
      });
    }

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Tratamento especial para data
      if (sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [stages, filters, sortBy, sortOrder]);

  // Configuração da paginação (baseada nas etapas filtradas)
  const pagination = usePagination(processedStages.length, 5, 1);

  // Aplicar paginação aos dados processados
  const paginatedStages = useMemo(() => {
    const startIndex = (pagination.state.currentPage - 1) * pagination.state.itemsPerPage;
    const endIndex = startIndex + pagination.state.itemsPerPage;
    return processedStages.slice(startIndex, endIndex);
  }, [processedStages, pagination.state.currentPage, pagination.state.itemsPerPage]);

  const handleSort = (column: keyof Stage) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddStage = () => {
    navigate(`/championship/${championshipId}/create-stage`);
  };

  const handleEditStage = (stageId: string) => {
    navigate(`/championship/${championshipId}/stage/${stageId}/edit`);
  };

  const handleDeleteStage = (stage: Stage) => {
    setStageToDelete(stage);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStage = async () => {
    if (!stageToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await StageService.delete(stageToDelete.id);
      
      // Remover da lista local
      setStages(prev => prev.filter(s => s.id !== stageToDelete.id));
      
      setShowDeleteDialog(false);
      setStageToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao deletar etapa');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteStage = () => {
    setShowDeleteDialog(false);
    setStageToDelete(null);
    setDeleteError(null);
  };

  const handleStageAction = (action: string, stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    switch (action) {
      case "view":
        setStageToView(stage);
        setShowDetailsModal(true);
        break;
      case "edit":
        handleEditStage(stageId);
        break;
      case "delete":
        handleDeleteStage(stage);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  // Handlers diretos para paginação
  const handlePageChange = useCallback((page: number) => {
    pagination.actions.setCurrentPage(page);
  }, [pagination.actions.setCurrentPage]);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    pagination.actions.setItemsPerPage(itemsPerPage);
  }, [pagination.actions.setItemsPerPage]);

  const handleFiltersChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    // Reset para primeira página quando filtros mudam
    pagination.actions.goToFirstPage();
  }, [pagination.actions.goToFirstPage]);

  const getSeasonName = (seasonId: string) => {
    return seasonMap[seasonId]?.name || 'Temporada não encontrada';
  };

  const getStageStatusBadge = (stage: Stage) => {
    const status = StageService.getStageStatus(stage.date, stage.time);
    
    switch (status) {
      case 'past':
        return <Badge variant="secondary">Realizada</Badge>;
      case 'today':
        return <Badge variant="default" className="bg-green-500">Hoje</Badge>;
      case 'soon':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Em breve</Badge>;
      case 'future':
        return <Badge variant="outline">Futura</Badge>;
      default:
        return <Badge variant="outline">Não definido</Badge>;
    }
  };

  const refreshStages = async () => {
    const seasons = Object.values(seasonMap);
    await fetchStages(seasons);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar etapas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={refreshStages} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (processedStages.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="Nenhuma etapa criada"
        description={
          canCreateStage
            ? "Crie a primeira etapa para começar a planejar o campeonato."
            : "É necessário ter pelo menos uma temporada que não esteja cancelada para criar uma etapa."
        }
        action={
          canCreateStage
            ? {
                label: "Criar Etapa",
                onClick: handleAddStage,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros e ação */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <DynamicFilter
            fields={filterFields}
            onFiltersChange={handleFiltersChange}
            className="w-full"
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full sm:w-auto">
                <Button onClick={handleAddStage} disabled={!canCreateStage} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Etapa
                </Button>
              </div>
            </TooltipTrigger>
            {!canCreateStage && (
              <TooltipContent>
                <p>É necessário ter pelo menos uma temporada que não esteja cancelada para criar uma etapa.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Tabela de etapas */}
      <Card className="w-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[200px]"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Nome da Etapa
                    {sortBy === "name" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data e Hora
                    {sortBy === "date" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Kartódromo
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Temporada
                  </div>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    Categorias
                  </div>
                </TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedStages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma etapa encontrada com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStages.map((stage) => (
                  <TableRow key={stage.id} className="hover:bg-muted/50">
                    <TableCell className="py-4">
                      <div>
                        <div className="font-medium">{stage.name}</div>
                        {stage.doublePoints && (
                          <Badge variant="outline" className="w-fit text-xs mt-1">
                            Pontos em dobro
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div>
                        <div className="font-medium">
                          {StageService.formatDate(stage.date)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {StageService.formatTime(stage.time)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div>
                        <div className="font-medium">{stage.kartodrome}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {stage.kartodromeAddress}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge variant="outline">
                        {getSeasonName(stage.seasonId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {getStageStatusBadge(stage)}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-medium">{stage.categoryIds.length}</span>
                        <span className="text-xs text-muted-foreground">
                          {stage.categoryIds.length === 1 ? 'categoria' : 'categorias'}
                        </span>
                        {stage.streamLink && (
                          <LinkIcon className="h-3 w-3 ml-2 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStageAction("view", stage.id)}>
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStageAction("edit", stage.id)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStageAction("delete", stage.id)}
                            className="text-destructive"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação sempre fixada na parte inferior */}
        <div className="flex-shrink-0">
          <Pagination
            currentPage={pagination.state.currentPage}
            totalPages={pagination.info.totalPages}
            itemsPerPage={pagination.state.itemsPerPage}
            totalItems={pagination.state.totalItems}
            startIndex={pagination.info.startIndex}
            endIndex={pagination.info.endIndex}
            hasNextPage={pagination.info.hasNextPage}
            hasPreviousPage={pagination.info.hasPreviousPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      </Card>

      {/* Modal de detalhes da etapa */}
      <StageDetailsModal
        stage={stageToView}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setStageToView(null);
        }}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a etapa <strong>"{stageToDelete?.name}"</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {deleteError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao excluir</AlertTitle>
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={cancelDeleteStage}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteStage}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir Etapa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 