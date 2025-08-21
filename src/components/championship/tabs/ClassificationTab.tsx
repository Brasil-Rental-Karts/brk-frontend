import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "brk-design-system";
import {
  Medal,
  MoreVertical,
  RefreshCw,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  DynamicFilter,
  FilterField,
  FilterValues,
} from "@/components/ui/dynamic-filter";
import { Loading } from "@/components/ui/loading";
import { InlineLoader } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { StageService } from "@/lib/services/stage.service";
import { ScoringSystem } from "@/lib/services/scoring-system.service";
import { useIsMobile } from "@/hooks/use-mobile";
// Removido: ChampionshipClassificationService
import { Season } from "@/lib/services/season.service";
import { formatName } from "@/utils/name";

// Interfaces para a nova estrutura de dados do Redis
interface ClassificationUser {
  id: string;
  name: string;
  nickname: string | null;
}

interface ClassificationPilot {
  totalPoints: number;
  totalStages: number;
  wins: number;
  podiums: number;
  polePositions: number;
  fastestLaps: number;
  bestPosition: number | null;
  averagePosition: string | null;
  lastCalculatedAt: string;
  user: ClassificationUser;
  categoryId?: string; // Adicionado para identificação
}

interface RedisClassificationData {
  lastUpdated: string;
  totalCategories: number;
  totalPilots: number;
  classificationsByCategory: {
    [categoryId: string]: {
      pilots: ClassificationPilot[];
    };
  };
}

interface ClassificationTabProps {
  championshipId: string;
}

// Configuração inicial dos filtros
const createFilterFields = (
  seasonOptions: { value: string; label: string }[] = [],
  categoryOptions: { value: string; label: string }[] = [],
): FilterField[] => [
  {
    key: "seasonId",
    label: "Temporada",
    type: "combobox",
    placeholder: "Temporada",
    options: seasonOptions,
  },
  {
    key: "categoryId",
    label: "Categoria",
    type: "combobox",
    placeholder: "Todas as categorias",
    options: categoryOptions,
  },
];

// Componente Card para Mobile
const ClassificationCard = ({
  entry,
  position,
  onAction,
}: {
  entry: ClassificationPilot;
  position: number;
  onAction: (action: string, entry: ClassificationPilot) => void;
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
    return <span className="font-semibold">{position}º</span>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {renderPositionBadge(position)}
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {formatName(entry.user.name)}
            </h3>
            {entry.user.nickname && (
              <p className="text-sm text-muted-foreground">
                @{entry.user.nickname}
              </p>
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
              {entry.polePositions > 0 && (
                <Target className="h-3 w-3 text-blue-500" />
              )}
              <span className="font-medium">{entry.polePositions}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">V. Rápidas</span>
            <div className="flex items-center gap-1">
              {entry.fastestLaps > 0 && (
                <Star className="h-3 w-3 text-purple-500" />
              )}
              <span className="font-medium">{entry.fastestLaps}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">
              Melhor Posição
            </span>
            <span className="font-medium">
              {entry.bestPosition === null ? "-" : `${entry.bestPosition}º`}
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
export const ClassificationTab = ({
  championshipId,
}: ClassificationTabProps) => {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterValues>({});
  const [updatingCache, setUpdatingCache] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [seasonStages, setSeasonStages] = useState<any[]>([]);

  // Usar o contexto de dados do campeonato
  const {
    getSeasons,
    getCategories,
    getClassification,
    fetchClassification,
    refreshClassification,
    loading: contextLoading,
    error: contextError,
    getScoringSystems,
    getRegistrations,
  } = useChampionshipData();

  // Obter dados do contexto
  const contextSeasons = getSeasons();
  const contextCategories = getCategories();

  // Dados básicos
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  // Dados de classificação do Redis
  const [seasonClassification, setSeasonClassification] =
    useState<RedisClassificationData | null>(null);

  // Carregar etapas da temporada selecionada (com resultados)
  const loadSeasonStages = useCallback(async (seasonId: string) => {
    try {
      const stages = await StageService.getBySeasonId(seasonId);
      // Ordenar por data/hora ascendentes
      const ordered = [...stages].sort((a: any, b: any) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (da !== db) return da - db;
        return (a.time || '').localeCompare(b.time || '');
      });
      setSeasonStages(ordered);
    } catch (err) {
      console.error("Erro ao carregar etapas da temporada:", err);
      setSeasonStages([]);
    }
  }, []);

  // Carregar dados iniciais
  const fetchSeasons = useCallback(async () => {
    try {
      // Usar temporadas do contexto
      if (contextSeasons.length > 0) {
        // Selecionar temporada ativa por padrão
        const activeSeason =
          contextSeasons.find((s: Season) => s.status === "em_andamento") ||
          contextSeasons[0];
        if (activeSeason) {
          setSelectedSeasonId(activeSeason.id);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar temporadas:", err);
    }
  }, [contextSeasons]);

  // Carregar classificação da temporada
  const loadClassification = useCallback(
    async (seasonId: string) => {
      if (!seasonId) return;

      try {
        // Buscar classificação do contexto
        let classification = getClassification(seasonId);

        // Se não existe no contexto, buscar do backend
        if (!classification) {
          await fetchClassification(seasonId);
          classification = getClassification(seasonId);
        }

        setSeasonClassification(classification);
      } catch (err: any) {
        console.error("❌ [FRONTEND] Erro ao carregar classificação:", err);
        setSeasonClassification(null);
      }
    },
    [getClassification, fetchClassification],
  );

  // Efeitos
  useEffect(() => {
    if (contextSeasons.length > 0) {
      fetchSeasons();
    }
  }, [contextSeasons, fetchSeasons]);

  useEffect(() => {
    if (selectedSeasonId) {
      loadClassification(selectedSeasonId);
      loadSeasonStages(selectedSeasonId);
      // Removido: setFilters(prev => ({ ...prev, seasonId: selectedSeasonId }));
    }
  }, [selectedSeasonId, loadClassification, loadSeasonStages]);

  // Opções dos filtros
  const { seasonOptions, categoryOptions } = useMemo(() => {
    const seasonOpts = contextSeasons.map((season) => ({
      value: season.id,
      label:
        season.status === "em_andamento"
          ? `${season.name} (Ativa)`
          : season.name,
    }));

    const categoryOpts = [{ value: "all", label: "Todas as categorias" }];

    // Usar categorias do contexto
    if (contextCategories.length > 0) {
      categoryOpts.push(
        ...contextCategories.map((category) => ({
          value: category.id,
          label: category.name,
        })),
      );
    }

    return {
      seasonOptions: seasonOpts,
      categoryOptions: categoryOpts,
    };
  }, [contextSeasons, contextCategories]);

  // Configuração dos filtros
  const filterFields = useMemo(
    () => createFilterFields(seasonOptions, categoryOptions),
    [seasonOptions, categoryOptions],
  );

  // Criar mapa de categorias por ID para uso na renderização
  const categoriesMap = useMemo(() => {
    const map: { [key: string]: { id: string; name: string } } = {};
    contextCategories.forEach((category) => {
      map[category.id] = {
        id: category.id,
        name: category.name,
      };
    });
    return map;
  }, [contextCategories]);

  // Dados processados
  // Construir tabela de pontos por etapa (por categoria)
  type PilotRow = {
    userId: string;
    name: string;
    nickname?: string | null;
    total: number;
    perCell: Record<string, { points: number; token: string; hadPenalty: boolean; minNoPenalty?: boolean }>; // key stageId:batteryIndex
  };

  const { columns, tableRows } = useMemo(() => {
    if (!selectedSeasonId || !filters.categoryId || filters.categoryId === "all") {
      return { columns: [] as any[], tableRows: [] as PilotRow[] };
    }

    const categoryId = String(filters.categoryId);
    const scoringSystems: ScoringSystem[] = getScoringSystems();
    const defaultScoring = scoringSystems.find((s) => (s as any).isDefault) || scoringSystems[0];
    const positionToPoints = new Map<number, number>(
      (defaultScoring?.positions || []).map((p) => [p.position, p.points]),
    );

    // Considerar apenas etapas com resultados na categoria
    const stagesWithResults = seasonStages.filter((s: any) => s.stage_results && s.stage_results[categoryId]);

    // Construir conjunto de pilotos que apareceram em alguma etapa
    const pilotIds = new Set<string>();
    stagesWithResults.forEach((stage: any) => {
      const catResults = stage.stage_results[categoryId] || {};
      Object.keys(catResults).forEach((pid) => {
        pilotIds.add(pid);
      });
    });

    // Mapa auxiliar para nome/nickname via inscrições
    const registrations = getRegistrations().filter((r: any) => r.seasonId === selectedSeasonId);
    const userInfoById = new Map<string, { name: string; nickname?: string | null }>();
    registrations.forEach((reg: any) => {
      if (reg.user) {
        userInfoById.set(reg.userId, { name: reg.user.name, nickname: reg.user.nickname });
      }
    });

    const rows: PilotRow[] = Array.from(pilotIds).map((userId) => ({
      userId,
      name: userInfoById.get(userId)?.name || userId,
      nickname: userInfoById.get(userId)?.nickname || null,
      total: 0,
      perCell: {},
    }));

    // Preencher pontos por bateria (e somar por etapa no total)
    stagesWithResults.forEach((stage: any) => {
      const stageId = stage.id;
      const catResults = stage.stage_results[categoryId] || {};
      Object.entries(catResults).forEach(([userId, pilotResultsAny]) => {
        const pilotResults = pilotResultsAny as any;
        // Coletar posições por bateria
        const batteryIndexes = Object.keys(pilotResults)
          .map((k) => parseInt(k, 10))
          .filter((n) => !Number.isNaN(n))
          .sort((a, b) => a - b);

        let sumStagePoints = 0;
        batteryIndexes.forEach((bi) => {
          const r = pilotResults[bi];
          const status = (r?.status as string | undefined) || '';
          const pos = r?.finishPosition as number | undefined;
          const penaltyTimeSec = r?.penaltyTime ? parseInt(String(r.penaltyTime), 10) : 0;
          const key = `${stageId}:${bi}`;
          let token = '-';
          let points = 0;
          let hadPenalty = false;
          if (status === 'dq' || status === 'dc') {
            token = status.toUpperCase();
            hadPenalty = true;
          } else if (typeof pos === 'number' && pos > 0) {
            token = `P${pos}`;
            points = positionToPoints.get(pos) || 0;
          }
          if (penaltyTimeSec && penaltyTimeSec > 0) {
            hadPenalty = true;
          }
          const row = rows.find((rw) => rw.userId === userId);
          if (!row) return;
          row.perCell[key] = { points, token, hadPenalty };
          sumStagePoints += points;
        });
        const row = rows.find((rw) => rw.userId === userId);
        if (!row) return;
        const stagePts = sumStagePoints * (stage.doublePoints ? 2 : 1);
        row.total += stagePts;
      });
    });

    // Marcar menor pontuação por bateria, sem punição (por piloto)
    rows.forEach(row => {
      const entries = Object.entries(row.perCell).filter(([_, cell]) => cell && !cell.hadPenalty);
      if (entries.length === 0) return;
      const minPoints = Math.min(...entries.map(([_, cell]) => cell.points || 0));
      entries.forEach(([key, cell]) => {
        if ((cell.points || 0) === minPoints) {
          cell.minNoPenalty = true;
        }
      });
    });

    // Ordenar linhas por total desc, depois por nome
    rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });

    // Colunas por bateria de cada etapa (ordenadas por data/num bateria)
    const columns = stagesWithResults.flatMap((s: any, idx: number) => {
      const stageId = s.id as string;
      // Descobrir quantas baterias existem na categoria desta etapa (maior índice visto)
      const catRes = s.stage_results?.[categoryId] || {};
      const maxBattery = Object.values(catRes).reduce((max: number, pilot: any) => {
        const keys = Object.keys(pilot || {}).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n));
        return Math.max(max, ...keys);
      }, -1);
      const count = maxBattery >= 0 ? maxBattery + 1 : 0;
      return Array.from({ length: count }, (_, bi) => ({
        id: `${stageId}:${bi}`,
        label: `E${idx + 1} B${bi + 1}`,
        name: s.name as string,
        date: s.date as string,
      }));
    });

    return { columns, tableRows: rows };
  }, [filters.categoryId, selectedSeasonId, seasonStages, getScoringSystems, getRegistrations]);

  // Removidos: paginação e scroll infinito da visualização anterior

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
    return <span className="font-semibold">{position}º</span>;
  };

  // Handlers
  const handleFiltersChange = useCallback(
    (newFilters: FilterValues) => {
      setFilters(newFilters);
      // Se uma temporada foi selecionada no filtro, atualizar a temporada selecionada
      if (newFilters.seasonId && newFilters.seasonId !== selectedSeasonId) {
        setSelectedSeasonId(newFilters.seasonId as string);
      }
    },
    [selectedSeasonId],
  );

  const handlePilotAction = (action: string, entry: ClassificationPilot) => {
    switch (action) {
      case "view":
        // TODO: Implementar visualização de detalhes do piloto
        break;
      default:
        break;
    }
  };

  // Removidos: handlers de paginação da visualização anterior

  // Removido: atualização de cache de classificação

  // Determinar loading e error
  const isDataLoading =
    contextLoading.seasons ||
    contextLoading.categories ||
    contextLoading.classifications;
  const dataError =
    contextError.seasons ||
    contextError.categories ||
    contextError.classifications;

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
  if (!isDataLoading && filters.categoryId && filters.categoryId !== "all" && columns.length === 0) {
    return (
      <div className="space-y-6">
        {/* Título da aba */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Classificação</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tabela de pontos por etapa (selecione uma categoria com etapas finalizadas)
          </p>
        </div>

        <EmptyState
          icon={Users}
          title="Sem resultados para esta categoria"
          description="Ainda não há etapas com resultados para exibir."
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

      {/* Header com filtros e botão de atualizar cache */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <DynamicFilter
            fields={filterFields}
            onFiltersChange={handleFiltersChange}
            className="w-full"
          />
        </div>
        {/* Removido: botão de atualizar classificação */}
      </div>

      {/* Loading padrão durante atualização */}
      {showLoading && (
        <div className="flex justify-center items-center py-8">
          <Loading type="spinner" size="lg" />
        </div>
      )}

      {/* Mensagens de feedback */}
      {dataError && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{dataError}</AlertDescription>
        </Alert>
      )}

      {/* Classificação - só mostrar se não estiver carregando */}
      {!showLoading && (
        <>
          {!filters.categoryId || filters.categoryId === "all" ? (
            <EmptyState
              icon={Trophy}
              title="Selecione uma categoria"
              description="Escolha uma categoria para visualizar a pontuação por etapa"
            />
          ) : tableRows.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Nenhum piloto encontrado"
              description="Não há pilotos com resultados nesta categoria"
            />
              ) : (
                <Card className="w-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                      <TableHead className="w-12 text-center">Pos.</TableHead>
                          <TableHead>Piloto</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col.id} className="text-center" title={`${col.name} - ${new Date(col.date).toLocaleDateString('pt-BR')}`}>
                          {col.label}
                          </TableHead>
                      ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                    {tableRows.map((row, idx) => (
                      <TableRow key={row.userId}>
                        <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                            <div className="font-medium">{formatName(row.name)}</div>
                            {row.nickname && (
                              <div className="text-xs text-muted-foreground">@{row.nickname}</div>
                                )}
                              </div>
                            </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-bold">{row.total}</span>
                            </TableCell>
                        {columns.map((col) => {
                          const cell = row.perCell[col.id];
                          const danger = !!cell?.hadPenalty;
                          const warn = !danger && !!cell?.minNoPenalty;
                          return (
                            <TableCell key={`${row.userId}-${col.id}`} className={`text-center ${danger ? 'bg-red-50' : warn ? 'bg-yellow-50' : ''}`}>
                              {cell ? (
                                <div className={`flex flex-col items-center gap-1 ${danger ? 'text-red-700' : warn ? 'text-amber-700' : ''}`}>
                                  <span className={`font-medium ${danger ? 'bg-red-100' : warn ? 'bg-yellow-100' : ''} px-1 rounded`}>{cell.points}</span>
                                  <span className={`text-xs ${danger ? 'text-red-600' : warn ? 'text-amber-600' : 'text-muted-foreground'}`}>{cell.token}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 px-4 pb-3">
                    <span className="inline-block align-middle mr-2 w-3 h-3 bg-red-50 border border-red-200"></span>
                    Célula vermelha: piloto teve punição (tempo ou desclassificação) em alguma bateria da etapa
                  </div>
                </Card>
          )}
        </>
      )}
    </div>
  );
};
