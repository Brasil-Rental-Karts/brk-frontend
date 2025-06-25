import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { PlusCircle, Tag, Users, MoreVertical, Calendar, Hash, Loader2 } from "lucide-react";
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
import { Season as BaseSeason } from "@/lib/services/season.service";
import { SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "brk-design-system";
import { useIsMobile } from "@/hooks/use-mobile";

// Estende a interface base da temporada para incluir as categorias
type Season = BaseSeason & { categories?: Category[] };

interface CategoriesTabProps {
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
  }
];

// Tipo local para incluir o nome da temporada
type CategoryWithSeasonName = Category & { seasonName: string };

const CategoryCard = ({ category, onAction, registrationCount }: { 
  category: CategoryWithSeasonName;
  onAction: (action: string, categoryId: string) => void;
  registrationCount: number;
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex-1 cursor-pointer pr-2" onClick={() => onAction("edit", category.id)}>
          <h3 className="text-lg font-semibold tracking-tight">{category.name}</h3>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge variant="outline">{category.seasonName}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction("edit", category.id)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("duplicate", category.id)}>
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAction("delete", category.id)}
                className="text-destructive"
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 cursor-pointer" onClick={() => onAction("edit", category.id)}>
        <div className="text-sm text-muted-foreground">
          Idade mínima: {category.minimumAge} anos
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Lastro</span>
            <span className="font-medium capitalize">{category.ballast}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Máx. Pilotos</span>
            <span className="font-medium">{registrationCount} / {category.maxPilots}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Baterias</span>
            <span className="font-medium">{category.batteriesConfig?.length || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


/**
 * Tab de categorias do campeonato
 * Exibe e gerencia as categorias de um campeonato específico
 */
export const CategoriesTab = ({ championshipId, seasons, isLoading, error: initialError, onRefresh }: CategoriesTabProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Category>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});

  // Estados para o modal de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const seasonOptions = useMemo(() => [
    { value: 'all', label: 'Todas as temporadas' },
    ...seasons.map((season) => ({ value: season.id, label: season.name }))
  ], [seasons]);

  const filterFields = useMemo(() => createFilterFields(seasonOptions), [seasonOptions]);
  
  const canCreateCategory = useMemo(() => seasons.some((s) => s.status !== 'cancelado'), [seasons]);

  // Buscar contagens de inscrições por categoria
  useEffect(() => {
    const fetchRegistrationCounts = async () => {
      const allCategories = seasons.flatMap(season => season.categories || []);
      const counts: Record<string, number> = {};
      
      try {
        await Promise.all(
          allCategories.map(async (category) => {
            try {
              const count = await SeasonRegistrationService.getCategoryRegistrationCount(category.id);
              counts[category.id] = count;
            } catch (error) {
              console.error(`Erro ao buscar contagem para categoria ${category.id}:`, error);
              counts[category.id] = 0;
            }
          })
        );
        
        setRegistrationCounts(counts);
      } catch (error) {
        console.error('Erro ao buscar contagens de inscrições:', error);
      }
    };

    if (seasons.length > 0) {
      fetchRegistrationCounts();
    }
  }, [seasons]);

  // Aplicar filtros e ordenação aos dados
  const filteredCategories = useMemo(() => {
    const allCategories: CategoryWithSeasonName[] = seasons.flatMap(season => 
      (season.categories || []).map((category: Category) => ({
        ...category,
        seasonName: season.name
      }))
    );
    
    let result = [...allCategories];

    // Aplicar filtros
    if (filters.seasonId && filters.seasonId !== 'all') {
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

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [seasons, filters, sortBy, sortOrder]);

  // --- Lógica para Desktop (Paginação) ---
  const pagination = usePagination(filteredCategories.length, 5, 1);
  const paginatedDesktopCategories = useMemo(() => {
    if (isMobile) return [];
    return filteredCategories.slice(pagination.info.startIndex, pagination.info.endIndex);
  }, [isMobile, filteredCategories, pagination.info.startIndex, pagination.info.endIndex]);

  // --- Lógica para Mobile (Scroll Infinito) ---
  const [visibleMobileCategories, setVisibleMobileCategories] = useState<CategoryWithSeasonName[]>([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const itemsPerPage = 5;

  useEffect(() => {
    if (isMobile) {
      setVisibleMobileCategories(filteredCategories.slice(0, itemsPerPage));
      setMobilePage(2);
      setHasMore(filteredCategories.length > itemsPerPage);
    }
  }, [isMobile, filteredCategories]);

  const lastCategoryElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoadingMore(true);
        setTimeout(() => {
          const newCategories = filteredCategories.slice(0, mobilePage * itemsPerPage);
          setVisibleMobileCategories(newCategories);
          setHasMore(newCategories.length < filteredCategories.length);
          setMobilePage(prev => prev + 1);
          setLoadingMore(false);
        }, 300);
      }
    });

    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, mobilePage, filteredCategories]);
  
  const processedCategories = isMobile ? visibleMobileCategories : paginatedDesktopCategories;

  const handleSort = (column: keyof Category) => {
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

  const handleAddCategory = () => {
    navigate(`/championship/${championshipId}/category/new`);
  };

  const handleEditCategory = (categoryId: string) => {
    navigate(`/championship/${championshipId}/category/${categoryId}`);
  };

  const handleDuplicateCategory = (categoryId: string) => {
    const categoryToDuplicate = filteredCategories.find((c) => c.id === categoryId);
    if (!categoryToDuplicate) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...categoryData } = categoryToDuplicate;
    const duplicatedCategoryData = {
      ...categoryData,
      name: `${categoryData.name} (Cópia)`,
    };
    navigate(`/championship/${championshipId}/category/new`, {
      state: { initialData: duplicatedCategoryData },
    });
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
      onRefresh(); // Notificar componente pai para re-buscar os dados
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
    const category = filteredCategories.find(c => c.id === categoryId);
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
      case "duplicate":
        handleDuplicateCategory(categoryId);
        break;
      default:
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
            <AlertTitle>Erro ao carregar categorias</AlertTitle>
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

  if (filteredCategories.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Nenhuma categoria criada"
        description={
          canCreateCategory
            ? "Crie sua primeira categoria para começar a organizar os participantes."
            : "É necessário ter pelo menos uma temporada que não esteja cancelada para criar uma categoria."
        }
        action={
          canCreateCategory
            ? {
                label: "Criar Categoria",
                onClick: handleAddCategory,
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
                <Button onClick={handleAddCategory} disabled={!canCreateCategory} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </div>
            </TooltipTrigger>
            {!canCreateCategory && (
              <TooltipContent>
                <p>É necessário ter pelo menos uma temporada que não esteja cancelada para criar uma categoria.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {isMobile ? (
        <>
          <div className="space-y-4">
            {processedCategories.map((category, index) => (
              <div key={category.id} ref={processedCategories.length === index + 1 ? lastCategoryElementRef : null}>
                 <CategoryCard category={category as CategoryWithSeasonName} onAction={handleCategoryAction} registrationCount={registrationCounts[category.id] || 0} />
              </div>
            ))}
          </div>
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!loadingMore && !hasMore && processedCategories.length > 0 && (
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
                  (processedCategories as CategoryWithSeasonName[]).map((category) => (
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
                          {category.seasonName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="text-sm font-medium">
                          {category.ballast}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="text-sm font-medium">
                          {registrationCounts[category.id] || 0} / {category.maxPilots}
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
                            <DropdownMenuItem onClick={() => handleCategoryAction("edit", category.id)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCategoryAction("duplicate", category.id)}>
                              Duplicar
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