import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Trophy, Medal, Target, Star, Users, MoreVertical } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "brk-design-system";
import { usePagination } from "@/hooks/usePagination";
import { useIsMobile } from "@/hooks/use-mobile";

import { SeasonService, Season } from "@/lib/services/season.service";
import { ChampionshipClassificationService, SeasonClassification, ClassificationEntry } from "@/lib/services/championship-classification.service";
import { Loading } from '@/components/ui/loading';
import { InlineLoader } from '@/components/ui/loading';
import { formatName } from '@/utils/name';

interface ClassificationTabProps {
  championshipId: string;
}

// Configuração inicial dos filtros
const createFilterFields = (seasonOptions: { value: string; label: string }[] = [], categoryOptions: { value: string; label: string }[] = []): FilterField[] => [
  {
    key: 'seasonId',
    label: 'Temporada',
    type: 'combobox',
    placeholder: 'Temporada',
    options: seasonOptions
  },
  {
    key: 'categoryId',
    label: 'Categoria',
    type: 'combobox',
    placeholder: 'Todas as categorias',
    options: categoryOptions
  }
];

// Componente Card para Mobile
const ClassificationCard = ({ entry, position, onAction }: { 
  entry: ClassificationEntry, 
  position: number, 
  onAction: (action: string, entry: ClassificationEntry) => void 
}) => {
  const renderPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-bold text-yellow-500">1º</span>
        </div>
      );
    }
    if (position === 2) {
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-gray-400" />
          <span className="font-bold text-gray-400">2º</span>
        </div>
      );
    }
    if (position === 3) {
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-amber-600" />
          <span className="font-bold text-amber-600">3º</span>
        </div>
      );
    }
    return (
      <span className="font-semibold">
        {position}º
      </span>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {renderPositionBadge(position)}
          </div>
          <div>
                            <h3 className="text-lg font-semibold tracking-tight">{formatName(entry.user.name)}</h3>
            {entry.user.nickname && (
              <p className="text-sm text-muted-foreground">@{entry.user.nickname}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction("view", entry)}>
              Ver detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{entry.category.name}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Pontos</span>
            <span className="text-lg font-bold">{entry.totalPoints}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Etapas</span>
            <span className="font-medium">{entry.totalStages}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Vitórias</span>
            <div className="flex items-center gap-1">
              {entry.wins > 0 && <Trophy className="h-3 w-3 text-yellow-500" />}
              <span className="font-medium">{entry.wins}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Pódios</span>
            <div className="flex items-center gap-1">
              {entry.podiums > 0 && <Medal className="h-3 w-3 text-gray-400" />}
              <span className="font-medium">{entry.podiums}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Poles</span>
            <div className="flex items-center gap-1">
              {entry.polePositions > 0 && <Target className="h-3 w-3 text-blue-500" />}
              <span className="font-medium">{entry.polePositions}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">V. Rápidas</span>
            <div className="flex items-center gap-1">
              {entry.fastestLaps > 0 && <Star className="h-3 w-3 text-purple-500" />}
              <span className="font-medium">{entry.fastestLaps}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Melhor Posição</span>
            <span className="font-medium">
              {entry.bestPosition === null ? '-' : `${entry.bestPosition}º`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Tab de classificação do campeonato
 * Exibe classificação geral e por categorias, usando dados otimizados do Redis
 * Segue padrões dos maiores campeonatos de automobilismo mundial
 */
export const ClassificationTab = ({ championshipId }: ClassificationTabProps) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});
  
  // Dados básicos
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  
  // Dados de classificação do Redis
  const [seasonClassification, setSeasonClassification] = useState<SeasonClassification | null>(null);

  // Carregar dados iniciais
  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar temporadas
      const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
      setSeasons(seasonsData.data);
      
      // Selecionar temporada ativa por padrão
      const activeSeason = seasonsData.data.find((s: Season) => s.status === 'em_andamento') || seasonsData.data[0];
      if (activeSeason) {
        setSelectedSeasonId(activeSeason.id);
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar temporadas');
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  // Carregar classificação da temporada
  const fetchClassification = useCallback(async (seasonId: string) => {
    if (!seasonId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const classification = await ChampionshipClassificationService.getSeasonClassificationOptimized(seasonId);
      
      setSeasonClassification(classification);

    } catch (err: any) {
      console.error('❌ [FRONTEND] Erro ao carregar classificação:', err);
      setError(err.message || 'Erro ao carregar classificação');
      setSeasonClassification(null);
    } finally {
      setLoading(false);
    }
  }, []);



  // Efeitos
  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchClassification(selectedSeasonId);
      // Sincronizar o filtro com a temporada selecionada
      setFilters(prev => ({ ...prev, seasonId: selectedSeasonId }));
    }
  }, [selectedSeasonId, fetchClassification]);

  // Opções dos filtros
  const { seasonOptions, categoryOptions } = useMemo(() => {
    const seasonOpts = seasons.map(season => ({
      value: season.id,
      label: season.status === 'em_andamento' ? `${season.name} (Ativa)` : season.name
    }));

    const categoryOpts = [
      { value: 'all', label: 'Todas as categorias' }
    ];

    if (seasonClassification?.classificationsByCategory) {
      const validCategories = Object.entries(seasonClassification.classificationsByCategory).filter(
        ([_, data]) => data && data.category
      );
      
      categoryOpts.push(...validCategories.map(([categoryId, data]) => ({
        value: categoryId,
        label: `${data.category.name}`
      })));
    }

    return {
      seasonOptions: seasonOpts,
      categoryOptions: categoryOpts
    };
  }, [seasons, seasonClassification]);

  // Configuração dos filtros
  const filterFields = useMemo(() => createFilterFields(seasonOptions, categoryOptions), [seasonOptions, categoryOptions]);

  // Dados processados
  const { allPilots, filteredPilots } = useMemo(() => {
    if (!seasonClassification || !seasonClassification.classificationsByCategory) {
      return { allPilots: [], filteredPilots: [] };
    }

    // Verificar se há categorias válidas
    const validCategories = Object.entries(seasonClassification.classificationsByCategory).filter(
      ([_, data]) => data && data.category
    );

    const allPilotsArray: ClassificationEntry[] = [];
    validCategories.forEach(([_, categoryData]) => {
      if (categoryData && categoryData.pilots && Array.isArray(categoryData.pilots)) {
        allPilotsArray.push(...categoryData.pilots);
      }
    });

    const filteredPilotsArray = (!filters.categoryId || filters.categoryId === 'all')
      ? allPilotsArray.sort((a, b) => {
          // Ordenar por pontos (maior para menor) quando "todas as categorias" estiver selecionado
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          // Em caso de empate, ordenar por número de vitórias
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          // Em caso de empate, ordenar por número de pódios
          if (b.podiums !== a.podiums) {
            return b.podiums - a.podiums;
          }
          // Por último, ordenar por melhor posição (menor posição = melhor)
          if (a.bestPosition !== null && b.bestPosition !== null) {
            return a.bestPosition - b.bestPosition;
          }
          return 0;
        })
      : seasonClassification.classificationsByCategory[filters.categoryId]?.pilots || [];



    return {
      allPilots: allPilotsArray,
      filteredPilots: filteredPilotsArray
    };
  }, [seasonClassification, filters.categoryId]);

  // --- Lógica para Desktop (Paginação) ---
  const pagination = usePagination(filteredPilots.length, 10, 1);
  const paginatedDesktopPilots = useMemo(() => {
    if (isMobile) return [];
    return filteredPilots.slice(pagination.info.startIndex, pagination.info.endIndex);
  }, [isMobile, filteredPilots, pagination.info.startIndex, pagination.info.endIndex]);

  // --- Lógica para Mobile (Scroll Infinito) ---
  const [visibleMobilePilots, setVisibleMobilePilots] = useState<ClassificationEntry[]>([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const mobileItemsPerPage = 10;

  useEffect(() => {
    if (isMobile) {
      setVisibleMobilePilots(filteredPilots.slice(0, mobileItemsPerPage));
      setMobilePage(2);
      setHasMore(filteredPilots.length > mobileItemsPerPage);
    }
  }, [isMobile, filteredPilots]);

  const lastPilotElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoadingMore(true);
        setTimeout(() => {
          const newPilots = filteredPilots.slice(0, mobilePage * mobileItemsPerPage);
          setVisibleMobilePilots(newPilots);
          setHasMore(newPilots.length < filteredPilots.length);
          setMobilePage(prev => prev + 1);
          setLoadingMore(false);
        }, 300);
      }
    });

    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, mobilePage, filteredPilots]);

  // Define os dados a serem processados com base no dispositivo
  const processedPilots = isMobile ? visibleMobilePilots : paginatedDesktopPilots;

  // Renderizar badge de posição
  const renderPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-bold text-yellow-500">1º</span>
        </div>
      );
    }
    if (position === 2) {
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-gray-400" />
          <span className="font-bold text-gray-400">2º</span>
        </div>
      );
    }
    if (position === 3) {
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-amber-600" />
          <span className="font-bold text-amber-600">3º</span>
        </div>
      );
    }
    return (
      <span className="font-semibold">
        {position}º
      </span>
    );
  };

  // Handlers
  const handleFiltersChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    // Se uma temporada foi selecionada no filtro, atualizar a temporada selecionada
    if (newFilters.seasonId && newFilters.seasonId !== selectedSeasonId) {
      setSelectedSeasonId(newFilters.seasonId as string);
    }
    if (!isMobile) {
      pagination.actions.goToFirstPage();
    }
  }, [isMobile, pagination.actions, selectedSeasonId]);

  const handlePilotAction = (action: string, entry: ClassificationEntry) => {
    switch (action) {
      case "view":
        // TODO: Implementar visualização de detalhes do piloto
        break;
      default:
        break;
    }
  };

  const handlePageChange = (page: number) => pagination.actions.setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => pagination.actions.setItemsPerPage(items);

  if (loading) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <Loading type="spinner" size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar classificação</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => fetchSeasons()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!selectedSeasonId) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma temporada encontrada"
        description="Não há temporadas disponíveis para exibir a classificação"
      />
    );
  }

  // Se não há dados de classificação e não está carregando
  if (!loading && seasonClassification && Object.keys(seasonClassification.classificationsByCategory || {}).length === 0) {
    return (
      <div className="space-y-6">
        {/* Título da aba */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Classificação</h2>
          <p className="text-sm text-gray-600 mt-1">
            Classificação geral e por categorias do campeonato
          </p>
        </div>

        <EmptyState
          icon={Users}
          title="Classificação ainda não disponível"
          description="A classificação desta temporada ainda não foi calculada ou não há dados disponíveis."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da aba */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Classificação</h2>
        <p className="text-sm text-gray-600 mt-1">
          Classificação geral e por categorias do campeonato
        </p>
      </div>

      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <DynamicFilter
            fields={filterFields}
            onFiltersChange={handleFiltersChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Classificação */}
      {filteredPilots.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhuma classificação disponível"
          description="Ainda não há resultados para exibir na classificação"
        />
      ) : (
        <>
          {/* Subtítulo da categoria selecionada */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {filters.categoryId && filters.categoryId !== 'all' 
                ? `${categoryOptions.find(opt => opt.value === filters.categoryId)?.label}`
                : 'Classificação Geral'
              }
            </h3>
          </div>
          
          {isMobile ? (
            <>
              <div className="space-y-4">
                {processedPilots.map((entry, index) => {
                  const position = isMobile ? 
                    filteredPilots.findIndex(p => p.user.id === entry.user.id && p.category.id === entry.category.id) + 1 :
                    pagination.info.startIndex + index + 1;
                  
                  return (
                    <div key={`${entry.user.id}-${entry.category.id}`} ref={processedPilots.length === index + 1 ? lastPilotElementRef : null}>
                      <ClassificationCard 
                        entry={entry} 
                        position={position}
                        onAction={handlePilotAction}
                      />
                    </div>
                  );
                })}
              </div>
              {loadingMore && (
                <div className="flex justify-center items-center py-4">
                  <InlineLoader size="sm" />
                </div>
              )}
              {!loadingMore && !hasMore && processedPilots.length > 0 && (
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
                      <TableHead className="w-16">Pos.</TableHead>
                      <TableHead>Piloto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Pontos</TableHead>
                      <TableHead className="text-center">Vitórias</TableHead>
                      <TableHead className="text-center">Pódios</TableHead>
                      <TableHead className="text-center">Poles</TableHead>
                      <TableHead className="text-center">V. Rápidas</TableHead>
                      <TableHead className="text-center">Melhor Pos.</TableHead>
                      <TableHead className="text-center">Etapas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedPilots.map((entry, index) => (
                      <TableRow key={`${entry.user.id}-${entry.category.id}`}>
                        <TableCell className="font-medium">
                          {renderPositionBadge(pagination.info.startIndex + index + 1)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{formatName(entry.user.name)}</div>
                            {entry.user.nickname && (
                              <div className="text-xs text-muted-foreground">@{entry.user.nickname}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{entry.totalPoints}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {entry.wins > 0 && <Trophy className="h-3 w-3 text-yellow-500" />}
                            <span className="font-medium">{entry.wins}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {entry.podiums > 0 && <Medal className="h-3 w-3 text-gray-400" />}
                            <span className="font-medium">{entry.podiums}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {entry.polePositions > 0 && <Target className="h-3 w-3 text-blue-500" />}
                            <span className="font-medium">{entry.polePositions}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {entry.fastestLaps > 0 && <Star className="h-3 w-3 text-purple-500" />}
                            <span className="font-medium">{entry.fastestLaps}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">
                            {entry.bestPosition === null ? '-' : `${entry.bestPosition}º`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{entry.totalStages}</span>
                        </TableCell>
                      </TableRow>
                    ))}
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
        </>
      )}
    </div>
  );
}; 