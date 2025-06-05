import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Tag, Users, MoreVertical } from "lucide-react";
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
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/usePagination";

interface Category {
  id: string;
  name: string;
  description: string;
  minAge: number;
  maxAge: number;
  participants: number;
  maxParticipants: number;
  status: "Ativo" | "Inativo";
}

interface CategoriesTabProps {
  championshipId: string;
}

// Configuração dos filtros
const filterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'combobox',
    placeholder: 'Selecionar status',
    options: [
      { value: 'Ativo', label: 'Ativo' },
      { value: 'Inativo', label: 'Inativo' },
    ]
  },
  {
    key: 'name',
    label: 'Nome',
    type: 'text',
    placeholder: 'Buscar por nome',
  }
];

/**
 * Componente da aba Categorias
 * Exibe lista de categorias do campeonato com opções de gerenciamento
 */
export const CategoriesTab = ({ championshipId: _championshipId }: CategoriesTabProps) => {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Category>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data expandido para testar paginação
  const [categories] = useState<Category[]>([
    {
      id: "1",
      name: "Mirim",
      description: "Categoria para pilotos iniciantes",
      minAge: 8,
      maxAge: 12,
      participants: 25,
      maxParticipants: 30,
      status: "Ativo",
    },
    {
      id: "2",
      name: "Cadete",
      description: "Categoria intermediária",
      minAge: 13,
      maxAge: 17,
      participants: 35,
      maxParticipants: 40,
      status: "Ativo",
    },
    {
      id: "3",
      name: "Júnior",
      description: "Categoria para jovens pilotos",
      minAge: 18,
      maxAge: 25,
      participants: 28,
      maxParticipants: 35,
      status: "Ativo",
    },
    {
      id: "4",
      name: "Sênior",
      description: "Categoria principal",
      minAge: 26,
      maxAge: 45,
      participants: 42,
      maxParticipants: 50,
      status: "Ativo",
    },
    {
      id: "5",
      name: "Master",
      description: "Categoria para pilotos experientes",
      minAge: 46,
      maxAge: 99,
      participants: 18,
      maxParticipants: 25,
      status: "Ativo",
    },
    {
      id: "6",
      name: "Super Master",
      description: "Categoria para veteranos experientes",
      minAge: 56,
      maxAge: 99,
      participants: 12,
      maxParticipants: 20,
      status: "Ativo",
    },
    {
      id: "7",
      name: "Graduados",
      description: "Categoria para pilotos formados",
      minAge: 16,
      maxAge: 99,
      participants: 22,
      maxParticipants: 25,
      status: "Ativo",
    },
    {
      id: "8",
      name: "Especial",
      description: "Categoria para eventos especiais",
      minAge: 18,
      maxAge: 99,
      participants: 0,
      maxParticipants: 15,
      status: "Inativo",
    },
  ]);

  // Aplicar filtros e ordenação aos dados
  const processedCategories = useMemo(() => {
    let result = [...categories];

    // Aplicar filtros
    result = result.filter(category => {
      // Filtro por status
      if (filters.status && category.status !== filters.status) {
        return false;
      }

      // Filtro por nome
      if (filters.name && !category.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Tratamento especial para diferentes tipos de dados
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

  // Configuração da paginação
  const pagination = usePagination(processedCategories.length, 5, 1);
  
  // Dados da página atual
  const currentPageCategories = useMemo(() => {
    const { startIndex, endIndex } = pagination.info;
    return processedCategories.slice(startIndex, endIndex);
  }, [processedCategories, pagination.info]);

  const handleSort = (column: keyof Category) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddCategory = () => {
    
    // TODO: Implementar modal ou navegação para criação de categoria
  };

  const handleCategoryAction = (_action: string, _categoryId: string) => {
    
    // TODO: Implementar ações específicas
  };

  const getStatusColor = (status: Category["status"]) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inativo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getOccupancyColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
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

  if (processedCategories.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Nenhuma categoria criada"
        description="Crie suas primeiras categorias para organizar os participantes"
        action={{
          label: "Adicionar Categoria",
          onClick: handleAddCategory,
        }}
      />
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold">Categorias</h2>
          <p className="text-muted-foreground">
            Gerencie as categorias de participação do campeonato
          </p>
        </div>
        <Button onClick={handleAddCategory} className="sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Categoria
        </Button>
      </div>

      {/* Filtros dinâmicos */}
      <div className="flex-shrink-0">
        <DynamicFilter
          fields={filterFields}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Tabela de categorias com altura adaptável */}
      <Card className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("name")}
                >
                  Nome da Categoria
                  {sortBy === "name" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="py-3">Descrição</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("minAge")}
                >
                  Faixa Etária
                  {sortBy === "minAge" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("participants")}
                >
                  Participantes
                  {sortBy === "participants" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortBy === "status" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="w-10 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhuma categoria encontrada com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                currentPageCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 max-w-xs truncate">
                      {category.description}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-sm">
                        {category.minAge} - {category.maxAge} anos
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span 
                          className={`text-sm font-medium ${getOccupancyColor(category.participants, category.maxParticipants)}`}
                        >
                          {category.participants}/{category.maxParticipants}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={getStatusColor(category.status)}>
                        {category.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleCategoryAction("view", category.id)}
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCategoryAction("edit", category.id)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCategoryAction("participants", category.id)}
                          >
                            Gerenciar participantes
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
    </div>
  );
}; 