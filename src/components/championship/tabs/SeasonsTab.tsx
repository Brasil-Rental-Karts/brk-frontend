import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, Users, Trophy, MoreVertical, DollarSign } from "lucide-react";
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

interface Season {
  id: string;
  name: string;
  year: number;
  status: string;
  startDate: string;
  endDate: string;
  participants: number;
  inscriptionFee: number;
  location: string;
  rounds: number;
  description?: string;
}

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
export const SeasonsTab = ({ championshipId: _championshipId }: SeasonsTabProps) => {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Season>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // TODO: Usar championshipId para buscar dados reais da API
  // Mock data - substituir por dados reais da API
  const [seasons] = useState<Season[]>([
    {
      id: "1",
      name: "Temporada Recanto Divisa 2025/1",
      year: 2025,
      status: "Ativa",
      startDate: "2025-02-22",
      endDate: "2025-06-29",
      participants: 100,
      inscriptionFee: 400.00,
      location: "São Paulo",
      rounds: 12,
      description: "Temporada principal do campeonato"
    },
    {
      id: "2", 
      name: "Temporada Recanto Divisa 2025/2",
      year: 2025,
      status: "Inscrito",
      startDate: "2025-02-22",
      endDate: "2025-06-29",
      participants: 33,
      inscriptionFee: 400.00,
      location: "Rio de Janeiro",
      rounds: 10,
      description: "Temporada de estreia"
    },
    {
      id: "3",
      name: "Temporada Recanto Divisa 2024/2",
      year: 2024,
      status: "Concluído",
      startDate: "2024-02-22",
      endDate: "2024-06-29",
      participants: 100,
      inscriptionFee: 400.00,
      location: "Brasília", 
      rounds: 14,
      description: "Expansão para nova região"
    },
    {
      id: "4",
      name: "Temporada Recanto Divisa 2024/1",
      year: 2024,
      status: "Concluído",
      startDate: "2024-02-22",
      endDate: "2024-06-29",
      participants: 100,
      inscriptionFee: 400.00,
      location: "São Paulo",
      rounds: 12,
      description: "Temporada principal do campeonato"
    },
    {
      id: "5",
      name: "Temporada Recanto Divisa 2024/3",
      year: 2024,
      status: "Planejada",
      startDate: "2024-08-15",
      endDate: "2024-12-22",
      participants: 85,
      inscriptionFee: 450.00,
      location: "Belo Horizonte",
      rounds: 16,
      description: "Temporada de expansão"
    },
    {
      id: "6",
      name: "Temporada Recanto Divisa 2023/1",
      year: 2023,
      status: "Finalizada",
      startDate: "2023-01-10",
      endDate: "2023-05-20",
      participants: 75,
      inscriptionFee: 350.00,
      location: "Salvador",
      rounds: 12,
      description: "Temporada inaugural"
    },
    {
      id: "7",
      name: "Temporada Recanto Divisa 2023/2",
      year: 2023,
      status: "Finalizada",
      startDate: "2023-06-01",
      endDate: "2023-10-15",
      participants: 90,
      inscriptionFee: 350.00,
      location: "Porto Alegre",
      rounds: 14,
      description: "Segunda temporada"
    },
    {
      id: "8",
      name: "Temporada Recanto Divisa 2025/3",
      year: 2025,
      status: "Planejada",
      startDate: "2025-07-01",
      endDate: "2025-11-30",
      participants: 120,
      inscriptionFee: 500.00,
      location: "Curitiba",
      rounds: 18,
      description: "Temporada especial"
    },
    {
      id: "9",
      name: "Temporada Recanto Divisa 2022/1",
      year: 2022,
      status: "Finalizada",
      startDate: "2022-03-01",
      endDate: "2022-07-30",
      participants: 60,
      inscriptionFee: 300.00,
      location: "Fortaleza",
      rounds: 10,
      description: "Temporada piloto"
    },
    {
      id: "10",
      name: "Temporada Recanto Divisa 2022/2",
      year: 2022,
      status: "Finalizada",
      startDate: "2022-08-15",
      endDate: "2022-12-20",
      participants: 65,
      inscriptionFee: 320.00,
      location: "Recife",
      rounds: 12,
      description: "Segunda temporada do ano"
    },
    {
      id: "11",
      name: "Temporada Recanto Divisa 2023/3",
      year: 2023,
      status: "Finalizada",
      startDate: "2023-11-01",
      endDate: "2023-12-31",
      participants: 45,
      inscriptionFee: 380.00,
      location: "Manaus",
      rounds: 8,
      description: "Temporada de fim de ano"
    },
    {
      id: "12",
      name: "Temporada Recanto Divisa 2025/4",
      year: 2025,
      status: "Planejada",
      startDate: "2025-12-01",
      endDate: "2026-03-31",
      participants: 80,
      inscriptionFee: 600.00,
      location: "Goiânia",
      rounds: 15,
      description: "Temporada de verão"
    },
  ]);

  // Aplicar filtros e ordenação aos dados
  const processedSeasons = useMemo(() => {
    let result = [...seasons];

    // Aplicar filtros
    result = result.filter(season => {
      // Filtro por ano baseado no período (startDate)
      if (filters.year) {
        const seasonYear = new Date(season.startDate).getFullYear();
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
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
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

  // Configuração da paginação
  const pagination = usePagination(processedSeasons.length, 5, 1);
  
  // Dados da página atual
  const currentPageSeasons = useMemo(() => {
    const { startIndex, endIndex } = pagination.info;
    return processedSeasons.slice(startIndex, endIndex);
  }, [processedSeasons, pagination.info]);

  const handleSort = (column: keyof Season) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddSeason = () => {
    console.log("Adicionar nova temporada");
    // TODO: Implementar modal ou navegação para criação de temporada
  };

  const handleSeasonAction = (action: string, seasonId: string) => {
    console.log(`Ação: ${action} para temporada: ${seasonId}`);
    // TODO: Implementar ações específicas
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativa":
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Ativa</Badge>;
      case "Finalizada":
        return <Badge variant="secondary">Finalizada</Badge>;
      case "Planejada":
        return <Badge variant="outline" className="border-blue-200 text-blue-800">Planejada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
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

  if (processedSeasons.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma temporada criada"
        description="Crie sua primeira temporada para começar a organizar o campeonato"
        action={{
          label: "Adicionar Temporada",
          onClick: handleAddSeason,
        }}
      />
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold">Temporadas</h2>
          <p className="text-muted-foreground">
            Gerencie as temporadas do seu campeonato
          </p>
        </div>
        <Button onClick={handleAddSeason} className="sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Temporada
        </Button>
      </div>

      {/* Filtros dinâmicos */}
      <div className="flex-shrink-0">
        <DynamicFilter
          fields={filterFields}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Tabela de temporadas com altura adaptável */}
      <Card className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("name")}
                >
                  Nome da Temporada
                  {sortBy === "name" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("startDate")}
                >
                  Período
                  {sortBy === "startDate" && (
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
                  onClick={() => handleSort("inscriptionFee")}
                >
                  Inscrição
                  {sortBy === "inscriptionFee" && (
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
              {currentPageSeasons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhuma temporada encontrada com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                currentPageSeasons.map((season) => (
                  <TableRow key={season.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium py-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        {season.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(season.startDate)} a {formatDate(season.endDate)}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {season.participants} participantes
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(season.inscriptionFee)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {getStatusBadge(season.status)}
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
                            onClick={() => handleSeasonAction("view", season.id)}
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSeasonAction("edit", season.id)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSeasonAction("participants", season.id)}
                          >
                            Gerenciar participantes
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
    </div>
  );
}; 