import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { PlusCircle, Tag, Users, MoreVertical, Calendar, Hash } from "lucide-react";
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
import { CategoryService, Category } from "@/lib/services/category.service";
import { SeasonService } from "@/lib/services/season.service";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";

interface CategoriesTabProps {
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
  }
];

/**
 * Tab de categorias do campeonato
 * Exibe e gerencia as categorias de um campeonato específico
 */
export const CategoriesTab = ({ championshipId }: CategoriesTabProps) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Category>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonOptions, setSeasonOptions] = useState<{ value: string; label: string }[]>([]);

  // Estados para o modal de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Memoizar a configuração dos filtros para evitar re-renders
  const filterFields = useMemo(() => createFilterFields(seasonOptions), [seasonOptions]);

  // Buscar temporadas do campeonato (apenas uma vez)
  const fetchSeasons = useCallback(async () => {
    try {
      const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
      
      // Atualizar opções do filtro
      const newSeasonOptions = [
        { value: '', label: 'Todas as temporadas' },
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

  // Buscar categorias do backend
  const fetchCategories = useCallback(async (seasons: any[] = []) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar categorias
      let allCategories: Category[] = [];
      
      if (filters.seasonId) {
        // Se filtro por temporada específica
        allCategories = await CategoryService.getBySeasonId(filters.seasonId as string);
      } else {
        // Buscar de todas as temporadas
        for (const season of seasons) {
          try {
            const seasonCategories = await CategoryService.getBySeasonId(season.id);
            allCategories.push(...seasonCategories);
          } catch (err) {
            console.warn(`Error loading categories for season ${season.id}:`, err);
          }
        }
      }

      setCategories(allCategories);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar categorias');
      setCategories([]);
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
          await fetchCategories(seasons);
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
  const processedCategories = useMemo(() => {
    if (categories.length === 0) return [];
    
    let result = [...categories];

    // Aplicar filtros
    if (filters.seasonId) {
      result = result.filter(category => category.seasonId === filters.seasonId);
    }

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (typeof aValue === 'string') {
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
  }, [categories, filters, sortBy, sortOrder]);

  // Configuração da paginação (baseada nas categorias filtradas)
  const pagination = usePagination(processedCategories.length, 5, 1);

  // Aplicar paginação aos dados processados
  const paginatedCategories = useMemo(() => {
    const startIndex = (pagination.state.currentPage - 1) * pagination.state.itemsPerPage;
    const endIndex = startIndex + pagination.state.itemsPerPage;
    return processedCategories.slice(startIndex, endIndex);
  }, [processedCategories, pagination.state.currentPage, pagination.state.itemsPerPage]);

  const handleSort = (column: keyof Category) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddCategory = () => {
    navigate(`/championship/${championshipId}/create-category`);
  };

  const handleEditCategory = (categoryId: string) => {
    navigate(`/championship/${championshipId}/category/${categoryId}/edit`);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await CategoryService.delete(categoryToDelete.id);
      
      // Atualizar a lista de categorias
      const seasons = seasonOptions
        .filter(option => option.value !== '')
        .map(option => ({ id: option.value, name: option.label }));
      await fetchCategories(seasons);
      
      // Fechar o modal
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir categoria');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteCategory = () => {
    setShowDeleteDialog(false);
    setCategoryToDelete(null);
    setDeleteError(null);
  };

  const handleCategoryAction = (action: string, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    switch (action) {
      case "view":
        // TODO: Implementar visualização de detalhes da categoria
        break;
      case "edit":
        handleEditCategory(categoryId);
        break;
      case "delete":
        handleDeleteCategory(category);
        break;
      default:
    }
  };

  const getSeasonName = (seasonId: string) => {
    // Buscar nome da temporada do cache
    const seasonOption = seasonOptions.find((opt: any) => opt.value === seasonId);
    return seasonOption ? seasonOption.label : 'Temporada não encontrada';
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
            <AlertTitle>Erro ao carregar categorias</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (processedCategories.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Nenhuma categoria criada"
        description="Crie sua primeira categoria para começar a organizar os participantes"
        action={{
          label: "Criar Categoria",
          onClick: handleAddCategory
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
        <Button onClick={handleAddCategory} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Tabela de categorias */}
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
                    Nome da Categoria
                    {sortBy === "name" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Temporada
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    Lastro
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort("maxPilots")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    Máx. Pilotos
                    {sortBy === "maxPilots" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Hash className="h-4 w-4" />
                    Baterias
                  </div>
                </TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria encontrada com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-muted/50">
                    <TableCell className="py-4">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Idade mín: {category.minimumAge} anos
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge variant="outline">
                        {getSeasonName(category.seasonId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="text-sm font-medium">
                        {category.ballast}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="text-sm font-medium">
                        {category.maxPilots}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        pilotos
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="text-sm font-medium">
                        {category.batteriesConfig?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.batteriesConfig?.length === 1 ? 'bateria' : 'baterias'}
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
                          <DropdownMenuItem onClick={() => handleCategoryAction("view", category.id)}>
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCategoryAction("edit", category.id)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCategoryAction("delete", category.id)}
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
              Tem certeza que deseja excluir a categoria <strong>"{categoryToDelete?.name}"</strong>?
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
              onClick={cancelDeleteCategory}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCategory}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 