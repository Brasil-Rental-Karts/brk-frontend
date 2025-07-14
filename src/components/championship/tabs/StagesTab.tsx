import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { PlusCircle, MapPin, Clock, Users, MoreVertical, Calendar, Flag, Link as LinkIcon, Eye } from "lucide-react";
import { InlineLoader } from "@/components/ui/loading";
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
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "brk-design-system";
import { useIsMobile } from "@/hooks/use-mobile";
import { RaceTrackService } from '@/lib/services/race-track.service';
import { StageDetailsModal } from '@/components/championship/modals/StageDetailsModal';
import { useChampionshipData } from "@/contexts/ChampionshipContext";


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
    type: 'combobox',
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

const StageCard = ({ stage, onAction, getStageStatusBadge, raceTrack }: { 
  stage: StageWithSeasonName, 
  onAction: (action: string, stageId: string) => void, 
  getStageStatusBadge: (stage: Stage) => JSX.Element,
  raceTrack?: any
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-semibold tracking-tight">{stage.name}</h3>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
            {getStageStatusBadge(stage)}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onAction("details", stage.id)}
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction("edit", stage.id)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("duplicate", stage.id)}>
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("details", stage.id)}>
                  Ver Detalhes
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
      <CardContent className="space-y-4">
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
            <span className="font-medium">
              {raceTrack 
                ? raceTrack.name 
                : 'Carregando...'}
            </span>
            {stage.trackLayoutId && (
              <span className="text-xs text-muted-foreground mt-1">
                Traçado: {stage.trackLayoutId}
              </span>
            )}
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
  // Usar o contexto de dados do campeonato
  const { 
    getSeasons, 
    getCategories, 
    getStages,
    getRaceTracks,
    loading: contextLoading, 
    error: contextError,
    refreshStages,
    removeStage: removeStageFromContext
  } = useChampionshipData();

  // Obter dados do contexto
  const contextSeasons = getSeasons();
  const contextCategories = getCategories();
  const contextStages = getStages();
  const contextRaceTracks = getRaceTracks();

  // Estados locais
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Stage>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [deletingStage, setDeletingStage] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Adicionar estados para o modal de detalhes
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Usar dados do contexto
  const effectiveSeasons = contextSeasons;
  const effectiveStages = contextStages;
  const effectiveRaceTracks = contextRaceTracks;

  const seasonOptions = useMemo(() => [
    { value: 'all', label: 'Todas as temporadas' },
    ...effectiveSeasons.map((season) => ({ value: season.id, label: season.name }))
  ], [effectiveSeasons]);

  const filterFields = useMemo(() => createFilterFields(seasonOptions), [seasonOptions]);
  
  const canCreateStage = useMemo(() => effectiveSeasons.some((s) => s.status !== 'cancelado'), [effectiveSeasons]);

  // Aplicar filtros e ordenação aos dados
  const filteredStages = useMemo(() => {
    const allStages: StageWithSeasonName[] = effectiveStages.map(stage => {
      const season = effectiveSeasons.find(s => s.id === stage.seasonId);
      return {
        ...stage,
        seasonName: season?.name || 'Temporada não encontrada'
      };
    });

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
  }, [effectiveStages, effectiveSeasons, filters, sortBy, sortOrder]);


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
    navigate(`/championship/${championshipId}/stage/new`);
  };

  const handleEditStage = (stageId: string) => {
    navigate(`/championship/${championshipId}/stage/${stageId}/edit`);
  };

  const handleDuplicateStage = (stageId: string) => {
    const stageToDuplicate = filteredStages.find((s) => s.id === stageId);
    if (!stageToDuplicate) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...stageData } = stageToDuplicate;

    // Normalizar date para DD/MM/YYYY
    let date = stageData.date;
    if (date) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        // já está correto
      } else if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
        // ISO ou YYYY-MM-DD
        const [year, month, day] = date.split('T')[0].split('-');
        date = `${day}/${month}/${year}`;
      } else {
        // fallback para Date
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          date = `${day}/${month}/${year}`;
        } else {
          date = '';
        }
      }
    } else {
      date = '';
    }

    // Garantir que categoryIds seja array de strings
    let categoryIds = Array.isArray(stageData.categoryIds)
      ? stageData.categoryIds.map((c: any) => typeof c === 'string' ? c : c.id)
      : [];

    const duplicatedStageData = {
      name: `${stageData.name} (Cópia)`,
      date,
      time: stageData.time,
      raceTrackId: stageData.raceTrackId || '',
      streamLink: stageData.streamLink || '',
      seasonId: stageData.seasonId,
      categoryIds,
      doublePoints: stageData.doublePoints || false,
      briefing: stageData.briefing || '',
      briefingTime: stageData.briefingTime || '',
    };
    navigate(`/championship/${championshipId}/stage/new`, {
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

    setDeletingStage(true);
    setDeleteError(null);

    try {
      await StageService.delete(stageToDelete.id);
      
      // Remover do contexto
      removeStageFromContext(stageToDelete.id);
      
      // Atualizar dados do contexto
      await refreshStages();
      
      setShowDeleteDialog(false);
      setStageToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao deletar etapa');
    } finally {
      setDeletingStage(false);
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
      case "edit":
        handleEditStage(stageId);
        break;
      case "duplicate":
        handleDuplicateStage(stageId);
        break;
      case "delete":
        handleDeleteStage(stage);
        break;
      case "details":
        setSelectedStage(stage);
        setShowDetailsModal(true);
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

  // Determinar loading e error
  const isDataLoading = isLoading || contextLoading.seasons || contextLoading.stages;
  const dataError = initialError || contextError.seasons || contextError.stages;

  if (isDataLoading) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <InlineLoader size="lg" />
        </div>
      </Card>
    );
  }

  if (dataError) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar etapas</AlertTitle>
            <AlertDescription>{dataError}</AlertDescription>
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
      {/* Título da aba */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Etapas</h2>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie as etapas e eventos do campeonato
        </p>
      </div>

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
                  raceTrack={effectiveRaceTracks[stage.raceTrackId]}
                 />
              </div>
            ))}
          </div>
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <InlineLoader size="sm" />
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
                          <div className="font-medium">
                            {stage.raceTrackId && effectiveRaceTracks[stage.raceTrackId] 
                              ? effectiveRaceTracks[stage.raceTrackId].name 
                              : 'Carregando...'}
                          </div>
                          {stage.trackLayoutId && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Traçado: {stage.trackLayoutId}
                            </div>
                          )}
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
                            <DropdownMenuItem onClick={() => handleStageAction("edit", stage.id)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageAction("duplicate", stage.id)}>
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageAction("details", stage.id)}>
                              Ver Detalhes
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
        stage={selectedStage}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedStage(null);
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
              disabled={deletingStage}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteStage}
              disabled={deletingStage}
            >
              {deletingStage ? "Excluindo..." : "Excluir Etapa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
