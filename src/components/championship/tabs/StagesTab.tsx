import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { PlusCircle, MapPin, Clock, Users, MoreVertical, Calendar, Flag, Link as LinkIcon, Loader2 } from "lucide-react";
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
import { Season as BaseSeason } from "@/lib/services/season.service";
import { Category } from "@/lib/services/category.service";
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
import { useIsMobile } from "@/hooks/use-mobile";


type Season = BaseSeason & { categories?: Category[], stages?: Stage[] };
type StageWithSeasonName = Stage & { seasonName: string };

interface StagesTabProps {
  championshipId: string;
  seasons: Season[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
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

const StageCard = ({ stage, onAction, getStageStatusBadge }: { stage: StageWithSeasonName, onAction: (action: string, stageId: string) => void, getStageStatusBadge: (stage: Stage) => JSX.Element }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex-1 cursor-pointer pr-2" onClick={() => onAction("view", stage.id)}>
          <h3 className="text-lg font-semibold tracking-tight">{stage.name}</h3>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
            {getStageStatusBadge(stage)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction("view", stage.id)}>
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("edit", stage.id)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("duplicate", stage.id)}>
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onAction("delete", stage.id)}
                  className="text-destructive"
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 cursor-pointer" onClick={() => onAction("view", stage.id)}>
        {stage.doublePoints && (
          <Badge variant="outline" className="w-fit text-xs">
            Pontos em dobro
          </Badge>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium">{StageService.formatDate(stage.date)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Hora</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {StageService.formatTime(stage.time)}
            </span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-muted-foreground">Kartódromo</span>
            <span className="font-medium">{stage.kartodrome}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Temporada</span>
            <Badge variant="outline" className="w-fit mt-1">{stage.seasonName}</Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Categorias</span>
            <span className="font-medium">{stage.categoryIds.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


/**
 * Tab de etapas do campeonato
 * Exibe e gerencia as etapas de um campeonato específico
 */
export const StagesTab = ({ championshipId, seasons, isLoading, error: initialError, onRefresh }: StagesTabProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Stage>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Estados para o modal de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados para o modal de detalhes
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stageToView, setStageToView] = useState<Stage | null>(null);

  const seasonOptions = useMemo(() => [
    { value: 'all', label: 'Todas as temporadas' },
    ...seasons.map((season) => ({ value: season.id, label: season.name }))
  ], [seasons]);

  const filterFields = useMemo(() => createFilterFields(seasonOptions), [seasonOptions]);
  
  const canCreateStage = useMemo(() => seasons.some((s) => s.status !== 'cancelado'), [seasons]);

  // Aplicar filtros e ordenação aos dados
  const filteredStages = useMemo(() => {
    const allStages: StageWithSeasonName[] = seasons.flatMap(season => 
      (season.stages || []).map(stage => ({
        ...stage,
        seasonName: season.name
      }))
    );

    let result = [...allStages];

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

      if (sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [seasons, filters, sortBy, sortOrder]);


  // --- Lógica para Desktop (Paginação) ---
  const pagination = usePagination(filteredStages.length, 5, 1);
  const paginatedDesktopStages = useMemo(() => {
    if (isMobile) return [];
    return filteredStages.slice(pagination.info.startIndex, pagination.info.endIndex);
  }, [isMobile, filteredStages, pagination.info.startIndex, pagination.info.endIndex]);


  // --- Lógica para Mobile (Scroll Infinito) ---
  const [visibleMobileStages, setVisibleMobileStages] = useState<StageWithSeasonName[]>([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const itemsPerPage = 5;

  useEffect(() => {
    if (isMobile) {
      setVisibleMobileStages(filteredStages.slice(0, itemsPerPage));
      setMobilePage(2);
      setHasMore(filteredStages.length > itemsPerPage);
    }
  }, [isMobile, filteredStages]);

  const lastStageElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoadingMore(true);
        setTimeout(() => {
          const newStages = filteredStages.slice(0, mobilePage * itemsPerPage);
          setVisibleMobileStages(newStages);
          setHasMore(newStages.length < filteredStages.length);
          setMobilePage(prev => prev + 1);
          setLoadingMore(false);
        }, 300);
      }
    });

    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, mobilePage, filteredStages]);

  const processedStages = isMobile ? visibleMobileStages : paginatedDesktopStages;

  const handleSort = (column: keyof Stage) => {
    setSortBy(prevSortBy => {
      if (prevSortBy === column) {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortOrder('asc');
      }
      return column;
    });
    if (!isMobile) {
      pagination.actions.goToFirstPage();
    }
  };

  const handleAddStage = () => {
    navigate(`/championship/${championshipId}/create-stage`);
  };

  const handleEditStage = (stageId: string) => {
    navigate(`/championship/${championshipId}/stage/${stageId}/edit`);
  };

  const handleDuplicateStage = (stageId: string) => {
    const stageToDuplicate = filteredStages.find((s) => s.id === stageId);
    if (!stageToDuplicate) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...stageData } = stageToDuplicate;
    const duplicatedStageData = {
      ...stageData,
      name: `${stageData.name} (Cópia)`,
    };
    navigate(`/championship/${championshipId}/create-stage`, {
      state: { initialData: duplicatedStageData },
    });
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
      onRefresh(); // Notificar o componente pai
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
    const stage = filteredStages.find(s => s.id === stageId);
    if (!stage) return;

    switch (action) {
      case "view":
        setStageToView(stage);
        setShowDetailsModal(true);
        break;
      case "edit":
        handleEditStage(stageId);
        break;
      case "duplicate":
        handleDuplicateStage(stageId);
        break;
      case "delete":
        handleDeleteStage(stage);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  const handleFiltersChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    if (!isMobile) {
      pagination.actions.goToFirstPage();
    }
  }, [isMobile, pagination.actions]);

  const handlePageChange = (page: number) => pagination.actions.setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => pagination.actions.setItemsPerPage(items);

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

  if (isLoading) {
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

  if (initialError) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar etapas</AlertTitle>
            <AlertDescription>{initialError}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={onRefresh} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (filteredStages.length === 0 && Object.keys(filters).length === 0) {
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

      {isMobile ? (
         <>
          <div className="space-y-4">
            {processedStages.map((stage, index) => (
              <div key={stage.id} ref={processedStages.length === index + 1 ? lastStageElementRef : null}>
                 <StageCard 
                  stage={stage as StageWithSeasonName} 
                  onAction={handleStageAction}
                  getStageStatusBadge={getStageStatusBadge}
                 />
              </div>
            ))}
          </div>
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!loadingMore && !hasMore && processedStages.length > 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Fim dos resultados.
            </div>
          )}
        </>
      ) : (
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
                  (processedStages as StageWithSeasonName[]).map((stage) => (
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
                          {stage.seasonName}
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
                            <DropdownMenuItem onClick={() => handleStageAction("duplicate", stage.id)}>
                              Duplicar
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
      )}


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
