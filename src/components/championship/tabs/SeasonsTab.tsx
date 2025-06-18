import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { PlusCircle, Calendar, Trophy, MoreVertical, DollarSign, Loader2 } from "lucide-react";
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
import { SeasonService, Season, PaginatedSeasons } from "@/lib/services/season.service";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { formatDateToBrazilian, getYearFromDate, compareDates, formatCurrency } from "@/utils/date";
import { useIsMobile } from "@/hooks/use-mobile";

interface SeasonsTabProps {
  championshipId: string;
}

// Configuração dos filtros
const filterFields: FilterField[] = [
  {
    key: 'year',
    label: 'Ano',
    type: 'combobox',
    placeholder: 'Ano',
    options: [
      { value: '2025', label: '2025' },
      { value: '2024', label: '2024' },
      { value: '2023', label: '2023' },
      { value: '2022', label: '2022' },
    ]
  }
];

const SeasonCard = ({ season, onAction, getStatusBadge, formatPeriod }: { season: Season, onAction: (action: string, seasonId: string) => void, getStatusBadge: (status: string) => JSX.Element, formatPeriod: (startDate: string, endDate: string) => string }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-lg font-semibold tracking-tight">{season.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction("view", season.id)}>
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("edit", season.id)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAction("delete", season.id)}
              className="text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        {season.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {season.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Status</span>
            {getStatusBadge(season.status)}
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Período</span>
            <span className="font-medium">{formatPeriod(season.startDate, season.endDate)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Inscrição</span>
            <span className="font-medium">{formatCurrency(parseFloat(season.inscriptionValue?.toString() || '0'))}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Modalidade</span>
            <span className="font-medium capitalize">{season.inscriptionType}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Tab de temporadas do campeonato
 * Exibe e gerencia as temporadas de um campeonato específico
 */
export const SeasonsTab = ({ championshipId }: SeasonsTabProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Season>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // --- Estados para Desktop ---
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [totalSeasons, setTotalSeasons] = useState(0);
  const pagination = usePagination(totalSeasons, 5, 1);

  // --- Estados para Mobile ---
  const [mobileSeasons, setMobileSeasons] = useState<Season[]>([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // --- Estados compartilhados ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o modal de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Lógica de fetch para Desktop (paginação)
  const fetchSeasonsForDesktop = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result: PaginatedSeasons = await SeasonService.getByChampionshipId(
        championshipId,
        pagination.state.currentPage,
        pagination.state.itemsPerPage
      );
      
      setSeasons(result.data);
      setTotalSeasons(result.total);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar temporadas');
      setSeasons([]);
      setTotalSeasons(0);
    } finally {
      setLoading(false);
    }
  }, [championshipId, pagination.state.currentPage, pagination.state.itemsPerPage]);

  // Lógica de fetch para Mobile (scroll infinito)
  const fetchSeasonsForMobile = useCallback(async (page: number) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const result = await SeasonService.getByChampionshipId(championshipId, page, 5);
      
      setMobileSeasons(prev => {
        const newSeasons = page === 1 ? result.data : [...prev, ...result.data];
        setHasMore(newSeasons.length < result.total);
        return newSeasons;
      });
      setMobilePage(page + 1);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar temporadas');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [championshipId]);
  
  // Carregar dados iniciais (Desktop)
  useEffect(() => {
    if (!isMobile) {
      fetchSeasonsForDesktop();
    }
  }, [isMobile, fetchSeasonsForDesktop]);

  // Carregar dados iniciais ou resetar (Mobile)
  useEffect(() => {
    if (isMobile) {
      setMobileSeasons([]);
      setMobilePage(1);
      setHasMore(true);
      fetchSeasonsForMobile(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, championshipId, JSON.stringify(filters)]);

  // Intersection Observer para carregar mais no mobile
  const observer = useRef<IntersectionObserver>();
  const lastSeasonElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchSeasonsForMobile(mobilePage);
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, mobilePage, fetchSeasonsForMobile]);

  // Aplicar filtros e ordenação aos dados
  const processedSeasons = useMemo(() => {
    const sourceSeasons = isMobile ? mobileSeasons : seasons;
    let result = [...sourceSeasons];

    // Aplicar filtros
    result = result.filter(season => {
      // Filtro por ano baseado no período (startDate) usando função utilitária
      if (filters.year) {
        const seasonYear = getYearFromDate(season.startDate);
        if (seasonYear.toString() !== filters.year.toString()) {
          return false;
        }
      }

      return true;
    });

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Tratamento especial para diferentes tipos de dados
      if (sortBy === 'startDate' || sortBy === 'endDate') {
        // Usar função utilitária para comparar datas
        const comparison = compareDates(aValue, bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
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
  }, [isMobile, mobileSeasons, seasons, filters, sortBy, sortOrder]);

  const handleSort = (column: keyof Season) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddSeason = () => {
    navigate(`/championship/${championshipId}/season/new`);
  };

  const handleEditSeason = (seasonId: string) => {
    navigate(`/championship/${championshipId}/season/${seasonId}`);
  };

  const handleDeleteSeason = (season: Season) => {
    setSeasonToDelete(season);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSeason = async () => {
    if (!seasonToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await SeasonService.delete(seasonToDelete.id);
      
      // Atualizar a lista de temporadas
      if (isMobile) {
        setMobileSeasons(prev => prev.filter(s => s.id !== seasonToDelete.id));
      } else {
        await fetchSeasonsForDesktop();
      }
      
      // Fechar o modal
      setShowDeleteDialog(false);
      setSeasonToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir temporada');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteSeason = () => {
    setShowDeleteDialog(false);
    setSeasonToDelete(null);
    setDeleteError(null);
  };

  const handleSeasonAction = (action: string, seasonId: string) => {
    const season = seasons.find(s => s.id === seasonId);
    if (!season) return;

    switch (action) {
      case "view":
        // TODO: Implementar visualização de detalhes da temporada

        break;
      case "edit":
        handleEditSeason(seasonId);
        break;
      case "delete":
        handleDeleteSeason(season);
        break;
      default:

    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'agendado': { color: 'bg-blue-100 text-blue-800', label: 'Agendado' },
      'em_andamento': { color: 'bg-green-100 text-green-800', label: 'Em andamento' },
      'cancelado': { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
      'finalizado': { color: 'bg-gray-100 text-gray-800', label: 'Finalizado' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatPeriod = (startDate: string, endDate: string) => {
    return `${formatDateToBrazilian(startDate)} - ${formatDateToBrazilian(endDate)}`;
  };

  const handleFiltersChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    if (!isMobile) {
      pagination.actions.goToFirstPage();
    }
  }, [isMobile, pagination.actions]);

  // Handlers diretos para paginação
  const handlePageChange = useCallback((page: number) => {
    if (!isMobile) {
      pagination.actions.setCurrentPage(page);
    }
  }, [isMobile, pagination.actions]);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    pagination.actions.setItemsPerPage(itemsPerPage);
  }, [pagination.actions]);

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
            <AlertTitle>Erro ao carregar temporadas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={isMobile ? () => fetchSeasonsForMobile(1) : fetchSeasonsForDesktop} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (processedSeasons.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma temporada criada"
        description="Crie sua primeira temporada para começar a organizar as competições"
        action={{
          label: "Criar Temporada",
          onClick: handleAddSeason
        }}
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
        <Button onClick={handleAddSeason} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Temporada
        </Button>
      </div>

      {isMobile ? (
        <>
          <div className="space-y-4">
            {processedSeasons.map((season, index) => (
              <div key={season.id} ref={processedSeasons.length === index + 1 ? lastSeasonElementRef : null}>
                <SeasonCard 
                  season={season} 
                  onAction={handleSeasonAction}
                  getStatusBadge={getStatusBadge}
                  formatPeriod={formatPeriod}
                />
              </div>
            ))}
          </div>
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!loadingMore && !hasMore && processedSeasons.length > 0 && (
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
                      Nome da Temporada
                      {sortBy === "name" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Status
                      {sortBy === "status" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort("startDate")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Período
                      {sortBy === "startDate" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort("inscriptionValue")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Inscrição
                      {sortBy === "inscriptionValue" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedSeasons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma temporada encontrada com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  processedSeasons.map((season) => (
                    <TableRow key={season.id} className="hover:bg-muted/50">
                      <TableCell className="py-4">
                        <div>
                          <div className="font-medium">{season.name}</div>
                          {season.description && (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {season.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {getStatusBadge(season.status)}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="text-sm">
                          {formatPeriod(season.startDate, season.endDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="text-sm font-medium">
                          {formatCurrency(parseFloat(season.inscriptionValue?.toString() || '0'))}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {season.inscriptionType}
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
                            <DropdownMenuItem onClick={() => handleSeasonAction("view", season.id)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSeasonAction("edit", season.id)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSeasonAction("delete", season.id)}
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
      )}

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a temporada <strong>"{seasonToDelete?.name}"</strong>?
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
              onClick={cancelDeleteSeason}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteSeason}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir Temporada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 