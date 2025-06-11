import { useState, useMemo, useCallback } from "react";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Trophy, Medal, Award, Download } from "lucide-react";
import { EmptyState } from "brk-design-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "brk-design-system";
import { Avatar, AvatarFallback, AvatarImage } from "brk-design-system";
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "brk-design-system";
import { usePagination } from "@/hooks/usePagination";

interface ClassificationEntry {
  position: number;
  pilotId: string;
  pilotName: string;
  pilotAvatar?: string;
  category: string;
  totalPoints: number;
  victories: number;
  podiums: number;
  participations: number;
  bestPosition: number;
}

interface ClassificationTabProps {
  championshipId: string;
}

// Configuração dos filtros
const filterFields: FilterField[] = [
  {
    key: 'category',
    label: 'Categoria',
    type: 'combobox',
    placeholder: 'Selecionar categoria',
    options: [
      { value: 'Mirim', label: 'Mirim' },
      { value: 'Cadete', label: 'Cadete' },
      { value: 'Júnior', label: 'Júnior' },
      { value: 'Sênior', label: 'Sênior' },
      { value: 'Master', label: 'Master' },
    ]
  },
  {
    key: 'pilotName',
    label: 'Piloto',
    type: 'text',
    placeholder: 'Buscar por nome',
  }
];

/**
 * Componente da aba Classificação
 * Exibe a classificação geral do campeonato por categoria
 */
export const ClassificationTab = ({ championshipId: _championshipId }: ClassificationTabProps) => {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof ClassificationEntry>("position");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data expandido para testar paginação
  const [classification] = useState<ClassificationEntry[]>([
    {
      position: 1,
      pilotId: "1",
      pilotName: "João Silva",
      category: "Sênior",
      totalPoints: 285,
      victories: 4,
      podiums: 6,
      participations: 8,
      bestPosition: 1,
    },
    {
      position: 2,
      pilotId: "2",
      pilotName: "Maria Santos",
      category: "Sênior",
      totalPoints: 268,
      victories: 3,
      podiums: 5,
      participations: 8,
      bestPosition: 1,
    },
    {
      position: 3,
      pilotId: "3",
      pilotName: "Pedro Oliveira",
      category: "Sênior",
      totalPoints: 245,
      victories: 2,
      podiums: 4,
      participations: 7,
      bestPosition: 1,
    },
    {
      position: 4,
      pilotId: "4",
      pilotName: "Ana Costa",
      category: "Júnior",
      totalPoints: 220,
      victories: 1,
      podiums: 3,
      participations: 6,
      bestPosition: 2,
    },
    {
      position: 5,
      pilotId: "5",
      pilotName: "Carlos Ferreira",
      category: "Master",
      totalPoints: 198,
      victories: 1,
      podiums: 2,
      participations: 8,
      bestPosition: 2,
    },
    {
      position: 6,
      pilotId: "6",
      pilotName: "Roberto Lima",
      category: "Mirim",
      totalPoints: 185,
      victories: 2,
      podiums: 4,
      participations: 7,
      bestPosition: 1,
    },
    {
      position: 7,
      pilotId: "7",
      pilotName: "Fernanda Rocha",
      category: "Cadete",
      totalPoints: 172,
      victories: 1,
      podiums: 3,
      participations: 6,
      bestPosition: 1,
    },
    {
      position: 8,
      pilotId: "8",
      pilotName: "Ricardo Alves",
      category: "Sênior",
      totalPoints: 165,
      victories: 0,
      podiums: 2,
      participations: 8,
      bestPosition: 3,
    },
    {
      position: 9,
      pilotId: "9",
      pilotName: "Luciana Monteiro",
      category: "Júnior",
      totalPoints: 158,
      victories: 1,
      podiums: 2,
      participations: 7,
      bestPosition: 1,
    },
    {
      position: 10,
      pilotId: "10",
      pilotName: "Eduardo Santos",
      category: "Master",
      totalPoints: 145,
      victories: 0,
      podiums: 1,
      participations: 6,
      bestPosition: 3,
    },
    {
      position: 11,
      pilotId: "11",
      pilotName: "Patrícia Gomes",
      category: "Sênior",
      totalPoints: 138,
      victories: 0,
      podiums: 1,
      participations: 7,
      bestPosition: 2,
    },
    {
      position: 12,
      pilotId: "12",
      pilotName: "Bruno Martins",
      category: "Cadete",
      totalPoints: 125,
      victories: 0,
      podiums: 2,
      participations: 5,
      bestPosition: 2,
    },
  ]);

  // Aplicar filtros e ordenação aos dados
  const processedClassification = useMemo(() => {
    let result = [...classification];

    // Aplicar filtros
    result = result.filter(entry => {
      // Filtro por categoria
      if (filters.category && entry.category !== filters.category) {
        return false;
      }

      // Filtro por nome do piloto
      if (filters.pilotName && !entry.pilotName.toLowerCase().includes(filters.pilotName.toLowerCase())) {
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
  }, [classification, filters, sortBy, sortOrder]);

  // Configuração da paginação
  const pagination = usePagination(processedClassification.length, 5, 1);
  
  // Dados da página atual
  const currentPageClassification = useMemo(() => {
    const { startIndex, endIndex } = pagination.info;
    return processedClassification.slice(startIndex, endIndex);
  }, [processedClassification, pagination.info]);

  const handleSort = (column: keyof ClassificationEntry) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleExportClassification = () => {
    
    // TODO: Implementar exportação da classificação
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{position}º</span>;
    }
  };

  const getPositionBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case 3:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getPilotInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  if (processedClassification.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma classificação disponível"
        description="A classificação será exibida após o início das corridas"
      />
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold">Classificação Geral</h2>
          <p className="text-muted-foreground">
            Ranking dos pilotos por pontuação acumulada
          </p>
        </div>
        <Button onClick={handleExportClassification} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filtros dinâmicos */}
      <div className="flex-shrink-0">
        <DynamicFilter
          fields={filterFields}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Tabela de classificação com altura adaptável */}
      <Card className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead 
                  className="w-16 cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("position")}
                >
                  Pos.
                  {sortBy === "position" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("pilotName")}
                >
                  Piloto
                  {sortBy === "pilotName" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("category")}
                >
                  Categoria
                  {sortBy === "category" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("totalPoints")}
                >
                  Pontos
                  {sortBy === "totalPoints" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("victories")}
                >
                  Vitórias
                  {sortBy === "victories" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("podiums")}
                >
                  Pódios
                  {sortBy === "podiums" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("participations")}
                >
                  Participações
                  {sortBy === "participations" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("bestPosition")}
                >
                  Melhor Pos.
                  {sortBy === "bestPosition" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageClassification.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhum piloto encontrado com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                currentPageClassification.map((entry) => (
                  <TableRow key={entry.pilotId} className="hover:bg-muted/50">
                    <TableCell className="py-2">
                      <div className="flex items-center justify-center">
                        {getPositionIcon(entry.position)}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.pilotAvatar} alt={entry.pilotName} />
                          <AvatarFallback className="text-xs">
                            {getPilotInitials(entry.pilotName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{entry.pilotName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline">
                        {entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <span className="font-bold text-lg">{entry.totalPoints}</span>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <Badge className={entry.victories > 0 ? "bg-green-100 text-green-800" : ""}>
                        {entry.victories}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <Badge className={entry.podiums > 0 ? "bg-blue-100 text-blue-800" : ""}>
                        {entry.podiums}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <span className="text-sm">{entry.participations}</span>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <Badge className={getPositionBadgeColor(entry.bestPosition)}>
                        {entry.bestPosition}º
                      </Badge>
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