import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, Trophy, MoreVertical, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/usePagination";
import { SeasonService, Season, PaginatedSeasons } from "@/lib/services/season.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDateToBrazilian, getYearFromDate, compareDates, formatCurrency } from "@/utils/date";

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

/**
 * Tab de temporadas do campeonato
 * Exibe e gerencia as temporadas de um campeonato específico
 */
export const SeasonsTab = ({ championshipId }: SeasonsTabProps) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Season>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSeasons, setTotalSeasons] = useState(0);

  // Estados para o modal de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Configuração da paginação
  const pagination = usePagination(totalSeasons, 5, 1);

  // Buscar temporadas do backend
  const fetchSeasons = useCallback(async () => {
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

  // Carregar temporadas quando a página ou filtros mudarem
  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // Aplicar filtros e ordenação aos dados
  const processedSeasons = useMemo(() => {
    let result = [...seasons];

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
  }, [seasons, filters, sortBy, sortOrder]);

  const handleSort = (column: keyof Season) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddSeason = () => {
    navigate(`/championship/${championshipId}/create-season`);
  };

  const handleEditSeason = (seasonId: string) => {
    navigate(`/championship/${championshipId}/season/${seasonId}/edit`);
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
      await fetchSeasons();
      
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
    // Reset para primeira página quando filtros mudam
    pagination.actions.goToFirstPage();
  }, [pagination.actions.goToFirstPage]);

  // Handlers diretos para paginação
  const handlePageChange = useCallback((page: number) => {
    pagination.actions.setCurrentPage(page);
  }, [pagination.actions.setCurrentPage]);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    pagination.actions.setItemsPerPage(itemsPerPage);
  }, [pagination.actions.setItemsPerPage]);

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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={fetchSeasons} variant="outline">
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

      {/* Tabela de temporadas */}
      <Card className="w-full flex flex-col min-h-[600px]">
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
                        {formatCurrency(season.inscriptionValue)}
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