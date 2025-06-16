import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Trophy, Medal, Target, Calendar, Filter, Star } from "lucide-react";
import { EmptyState } from "brk-design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "brk-design-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";

import { SeasonService, Season } from "@/lib/services/season.service";
import { CategoryService } from "@/lib/services/category.service";
import { StageService } from "@/lib/services/stage.service";
import { SeasonRegistrationService } from "@/lib/services/season-registration.service";

interface ClassificationTabProps {
  championshipId: string;
}

interface Category {
  id: string;
  name: string;
  ballast: string;
  seasonId: string;
  batteriesConfig: any[];
}

interface Stage {
  id: string;
  name: string;
  date: string;
  doublePoints: boolean;
  seasonId: string;
  categoryIds: string[];
}

interface Pilot {
  id: string;
  name: string;
  email: string;
  categories: { id: string; category: Category }[];
}

interface StageResult {
  pilotId: string;
  stageId: string;
  categoryId: string;
  position: number;
  points: number;
  doublePoints: boolean;
}

interface ClassificationEntry {
  pilot: Pilot;
  category: Category;
  totalPoints: number;
  totalPointsWithoutBonus: number;
  victories: number;
  podiums: number;
  stageResults: StageResult[];
  bestPosition: number;
  participations: number;
}

const PODIUM_POSITIONS = [1, 2, 3];

/**
 * Tab de classificação do campeonato
 * Exibe classificação geral e por categorias, com resultados por etapas
 * Segue padrões dos maiores campeonatos de automobilismo mundial
 */
export const ClassificationTab = ({ championshipId }: ClassificationTabProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"general" | "categories" | "stages">("general");
  
  // Dados básicos
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  
  // Filtros
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  
  // Dados processados
  const [classification, setClassification] = useState<ClassificationEntry[]>([]);

  // Carregar dados iniciais
  const fetchData = useCallback(async () => {
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
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  // Carregar dados dependentes da temporada
  const fetchSeasonData = useCallback(async (seasonId: string) => {
    if (!seasonId) return;
    
    try {
      setLoading(true);
      
      // Buscar categorias, etapas e pilotos da temporada
      const [categoriesData, stagesData, pilotsData] = await Promise.all([
        CategoryService.getBySeasonId(seasonId),
        StageService.getBySeasonId(seasonId),
        SeasonRegistrationService.getBySeasonId(seasonId)
      ]);

      setCategories(categoriesData);
      setStages(stagesData);
      
      // Processar pilotos confirmados
      const confirmedPilots = pilotsData
        .filter((reg: any) => reg.status === 'confirmed' && reg.paymentStatus === 'paid')
        .map((reg: any) => ({
          id: reg.user.id,
          name: reg.user.name,
          email: reg.user.email,
          categories: reg.categories || []
        }));
      
      setPilots(confirmedPilots);

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados da temporada');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular classificação
  const calculateClassification = useCallback(() => {
    if (!pilots.length || !categories.length || !stages.length) {
      setClassification([]);
      return;
    }

    const entries: ClassificationEntry[] = [];

    // Para cada piloto e categoria
    pilots.forEach(pilot => {
      pilot.categories.forEach(pilotCategory => {
        const category = categories.find(c => c.id === pilotCategory.category.id);
        if (!category) return;

        // Filtrar por categoria se selecionado
        if (selectedCategoryId !== 'all' && category.id !== selectedCategoryId) return;

        // Simular resultados das etapas (em produção, viria do backend)
        const stageResults: StageResult[] = stages
          .filter(stage => stage.categoryIds.includes(category.id))
          .map(stage => {
            // Simular posição aleatória para demonstração
            const position = Math.floor(Math.random() * 20) + 1;
            const basePoints = getPointsForPosition(position);
            const points = stage.doublePoints ? basePoints * 2 : basePoints;
            
            return {
              pilotId: pilot.id,
              stageId: stage.id,
              categoryId: category.id,
              position,
              points,
              doublePoints: stage.doublePoints
            };
          });

        // Calcular estatísticas
        const totalPoints = stageResults.reduce((sum, result) => sum + result.points, 0);
        const totalPointsWithoutBonus = stageResults.reduce((sum, result) => {
          const basePoints = getPointsForPosition(result.position);
          return sum + basePoints;
        }, 0);
        
        const victories = stageResults.filter(r => r.position === 1).length;
        const podiums = stageResults.filter(r => PODIUM_POSITIONS.includes(r.position)).length;
        const bestPosition = stageResults.length > 0 ? Math.min(...stageResults.map(r => r.position)) : 999;
        const participations = stageResults.length;

        entries.push({
          pilot,
          category,
          totalPoints,
          totalPointsWithoutBonus,
          victories,
          podiums,
          stageResults,
          bestPosition,
          participations
        });
      });
    });

    // Ordenar por pontuação total, depois por vitórias, depois por pódios
    entries.sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
      if (a.victories !== b.victories) return b.victories - a.victories;
      if (a.podiums !== b.podiums) return b.podiums - a.podiums;
      if (a.bestPosition !== b.bestPosition) return a.bestPosition - b.bestPosition;
      return 0;
    });

    setClassification(entries);
  }, [pilots, categories, stages, selectedCategoryId]);

  // Sistema de pontuação baseado na Fórmula 1 (25-18-15-12-10-8-6-4-2-1)
  const getPointsForPosition = (position: number): number => {
    const pointsTable: { [key: number]: number } = {
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    };
    return pointsTable[position] || 0;
  };

  // Agrupar classificação por categoria
  const classificationByCategory = useMemo(() => {
    const grouped: { [categoryId: string]: { category: Category; entries: ClassificationEntry[] } } = {};
    
    classification.forEach(entry => {
      if (!grouped[entry.category.id]) {
        grouped[entry.category.id] = {
          category: entry.category,
          entries: []
        };
      }
      grouped[entry.category.id].entries.push(entry);
    });

    return Object.values(grouped);
  }, [classification]);

  // Efeitos
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchSeasonData(selectedSeasonId);
    }
  }, [selectedSeasonId, fetchSeasonData]);

  useEffect(() => {
    calculateClassification();
  }, [calculateClassification]);

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

  // Renderizar estatísticas do piloto
  const renderPilotStats = (entry: ClassificationEntry) => (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Trophy className="h-3 w-3" />
        <span>{entry.victories} vitória{entry.victories !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-1">
        <Medal className="h-3 w-3" />
        <span>{entry.podiums} pódio{entry.podiums !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-1">
        <Target className="h-3 w-3" />
        <span>Melhor: {entry.bestPosition === 999 ? '-' : `${entry.bestPosition}º`}</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>{entry.participations} etapa{entry.participations !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="w-full">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
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
            <AlertTitle>Erro ao carregar classificação</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => fetchData()} variant="outline">
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
        action={{
          label: "Ver Temporadas",
          onClick: () => {
            // TODO: Implementar navegação para aba de temporadas
            console.log("Navegar para temporadas");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Temporada</label>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione a temporada" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    <div className="flex items-center gap-2">
                      {season.name}
                      {season.status === 'em_andamento' && <Badge variant="secondary" className="text-xs">Ativa</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Categoria</label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.name}
                      <Badge variant="outline" className="text-xs">{category.ballast}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {classification.length} piloto{classification.length !== 1 ? 's' : ''} na classificação
        </div>
      </div>

      {/* Sistema de tabs para diferentes visualizações */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList>
          <TabsTrigger value="general">Classificação Geral</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="stages">Por Etapas</TabsTrigger>
        </TabsList>

        {/* Classificação Geral */}
        <TabsContent value="general" className="mt-6">
          {classification.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Nenhuma classificação disponível"
              description="Ainda não há resultados para exibir na classificação geral"
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Piloto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Pontos</TableHead>
                    <TableHead className="text-center">Estatísticas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classification.map((entry, index) => (
                    <TableRow key={`${entry.pilot.id}-${entry.category.id}`}>
                      <TableCell className="font-medium">
                        {renderPositionBadge(index + 1)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{entry.pilot.name}</div>
                          <div className="text-xs text-muted-foreground">{entry.pilot.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.category.name}</span>
                          <Badge variant="outline" className="text-xs">{entry.category.ballast}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-lg font-bold">{entry.totalPoints}</div>
                          {entry.totalPoints !== entry.totalPointsWithoutBonus && (
                            <div className="text-xs text-muted-foreground">
                              ({entry.totalPointsWithoutBonus} + bônus)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderPilotStats(entry)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Classificação por Categoria */}
        <TabsContent value="categories" className="mt-6">
          {classificationByCategory.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="Nenhuma categoria encontrada"
              description="Não há categorias com pilotos para exibir"
            />
          ) : (
            <div className="space-y-6">
              {classificationByCategory.map(({ category, entries }) => (
                <Card key={category.id}>
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <Badge variant="outline">{category.ballast}</Badge>
                      <Badge variant="secondary">{entries.length} piloto{entries.length !== 1 ? 's' : ''}</Badge>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Pos.</TableHead>
                        <TableHead>Piloto</TableHead>
                        <TableHead className="text-center">Pontos</TableHead>
                        <TableHead className="text-center">Estatísticas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry, index) => (
                        <TableRow key={entry.pilot.id}>
                          <TableCell className="font-medium">
                            {renderPositionBadge(index + 1)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{entry.pilot.name}</div>
                              <div className="text-xs text-muted-foreground">{entry.pilot.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <div className="text-lg font-bold">{entry.totalPoints}</div>
                              {entry.totalPoints !== entry.totalPointsWithoutBonus && (
                                <div className="text-xs text-muted-foreground">
                                  ({entry.totalPointsWithoutBonus} + bônus)
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderPilotStats(entry)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resultados por Etapas */}
        <TabsContent value="stages" className="mt-6">
          {stages.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhuma etapa encontrada"
              description="Ainda não há etapas criadas para esta temporada"
            />
          ) : (
            <Card>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Resultados por Etapas</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize os resultados de cada etapa da temporada
                </p>
              </div>
              <div className="p-4">
                <div className="grid gap-4">
                  {stages.map((stage) => (
                    <Card key={stage.id} className="border">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{stage.name}</h4>
                            <Badge variant="outline">
                              {new Date(stage.date).toLocaleDateString('pt-BR')}
                            </Badge>
                            {stage.doublePoints && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Pontos em Dobro
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Esta funcionalidade será implementada com os resultados reais das etapas
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 