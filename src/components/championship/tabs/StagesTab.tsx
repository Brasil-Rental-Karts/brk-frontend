import { useState, useMemo, useCallback } from "react";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { PlusCircle, Calendar, MapPin, Flag, MoreVertical } from "lucide-react";
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
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "brk-design-system";
import { usePagination } from "@/hooks/usePagination";
import { formatDateToBrazilian, compareDates } from "@/utils/date";

interface Stage {
  id: string;
  name: string;
  seasonName: string;
  date: string;
  location: string;
  status: "Agendado" | "Em andamento" | "Concluído" | "Cancelado";
  participants: number;
  trackLayout?: string;
}

interface StagesTabProps {
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
      { value: 'Agendado', label: 'Agendado' },
      { value: 'Em andamento', label: 'Em andamento' },
      { value: 'Concluído', label: 'Concluído' },
      { value: 'Cancelado', label: 'Cancelado' },
    ]
  },
  {
    key: 'seasonName',
    label: 'Temporada',
    type: 'combobox',
    placeholder: 'Selecionar temporada',
    options: [
      { value: 'Temporada 2025/1', label: 'Temporada 2025/1' },
      { value: 'Temporada 2024/2', label: 'Temporada 2024/2' },
      { value: 'Temporada 2024/1', label: 'Temporada 2024/1' },
    ]
  }
];

/**
 * Componente da aba Etapas
 * Exibe lista de etapas do campeonato com opções de gerenciamento
 */
export const StagesTab = ({ championshipId: _championshipId }: StagesTabProps) => {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Stage>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data expandido para testar paginação
  const [stages] = useState<Stage[]>([
    {
      id: "1",
      name: "1ª Etapa",
      seasonName: "Temporada 2025/1",
      date: "2025-03-15",
      location: "Kartódromo Granja Viana",
      status: "Agendado",
      participants: 85,
      trackLayout: "Configuração A",
    },
    {
      id: "2",
      name: "2ª Etapa", 
      seasonName: "Temporada 2025/1",
      date: "2025-04-12",
      location: "Kartódromo Aldeia da Serra",
      status: "Agendado",
      participants: 92,
      trackLayout: "Configuração B",
    },
    {
      id: "3",
      name: "3ª Etapa",
      seasonName: "Temporada 2024/2",
      date: "2024-12-20",
      location: "Kartódromo Granja Viana",
      status: "Concluído",
      participants: 78,
      trackLayout: "Configuração A",
    },
    {
      id: "4",
      name: "4ª Etapa",
      seasonName: "Temporada 2024/2",
      date: "2024-11-25",
      location: "Kartódromo Speed Park",
      status: "Concluído",
      participants: 82,
      trackLayout: "Configuração C",
    },
    {
      id: "5",
      name: "5ª Etapa",
      seasonName: "Temporada 2024/1",
      date: "2024-10-15",
      location: "Kartódromo Beto Carrero",
      status: "Concluído",
      participants: 95,
      trackLayout: "Configuração D",
    },
    {
      id: "6",
      name: "6ª Etapa",
      seasonName: "Temporada 2024/1",
      date: "2024-09-18",
      location: "Kartódromo Granja Viana",
      status: "Concluído",
      participants: 88,
      trackLayout: "Configuração A",
    },
    {
      id: "7",
      name: "7ª Etapa",
      seasonName: "Temporada 2025/1",
      date: "2025-05-20",
      location: "Kartódromo Interlagos",
      status: "Agendado",
      participants: 0,
      trackLayout: "Configuração E",
    },
    {
      id: "8",
      name: "8ª Etapa",
      seasonName: "Temporada 2025/1",
      date: "2025-06-15",
      location: "Kartódromo Ayrton Senna",
      status: "Agendado",
      participants: 0,
      trackLayout: "Configuração F",
    },
  ]);

  // Aplicar filtros e ordenação aos dados
  const processedStages = useMemo(() => {
    let result = [...stages];

    // Aplicar filtros
    result = result.filter(stage => {
      // Filtro por status
      if (filters.status && stage.status !== filters.status) {
        return false;
      }

      // Filtro por temporada
      if (filters.seasonName && stage.seasonName !== filters.seasonName) {
        return false;
      }

      return true;
    });

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Tratamento especial para diferentes tipos de dados
      if (sortBy === 'date') {
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
  }, [stages, filters, sortBy, sortOrder]);

  // Configuração da paginação
  const pagination = usePagination(processedStages.length, 5, 1);
  
  // Dados da página atual
  const currentPageStages = useMemo(() => {
    const { startIndex, endIndex } = pagination.info;
    return processedStages.slice(startIndex, endIndex);
  }, [processedStages, pagination.info]);

  const handleSort = (column: keyof Stage) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddStage = () => {
    
    // TODO: Implementar modal ou navegação para criação de etapa
  };

  const handleStageAction = (_action: string, _stageId: string) => {
    
    // TODO: Implementar ações específicas
  };

  const getStatusColor = (status: Stage["status"]) => {
    switch (status) {
      case "Agendado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Em andamento":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Concluído":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
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

  if (processedStages.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="Nenhuma etapa criada"
        description="Crie sua primeira etapa para começar a organizar as corridas"
        action={{
          label: "Adicionar Etapa",
          onClick: handleAddStage,
        }}
      />
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold">Etapas</h2>
          <p className="text-muted-foreground">
            Gerencie as etapas e corridas do seu campeonato
          </p>
        </div>
        <Button onClick={handleAddStage} className="sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Etapa
        </Button>
      </div>

      {/* Filtros dinâmicos */}
      <div className="flex-shrink-0">
        <DynamicFilter
          fields={filterFields}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Tabela de etapas com altura adaptável */}
      <Card className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("name")}
                >
                  Etapa
                  {sortBy === "name" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="py-3">Temporada</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("date")}
                >
                  Data
                  {sortBy === "date" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("location")}
                >
                  Local
                  {sortBy === "location" && (
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
              {currentPageStages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhuma etapa encontrada com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                currentPageStages.map((stage) => (
                  <TableRow key={stage.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium py-2">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        {stage.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">{stage.seasonName}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDateToBrazilian(stage.date)}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {stage.location}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-sm">
                        {stage.participants} participantes
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={getStatusColor(stage.status)}>
                        {stage.status}
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
                            onClick={() => handleStageAction("view", stage.id)}
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStageAction("edit", stage.id)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStageAction("participants", stage.id)}
                          >
                            Gerenciar participantes
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
    </div>
  );
}; 