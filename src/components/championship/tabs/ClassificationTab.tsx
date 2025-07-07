import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Trophy, Medal, Target, Filter, Star, RefreshCw, Users } from "lucide-react";
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


import { Alert, AlertDescription, AlertTitle } from "brk-design-system";

import { SeasonService, Season } from "@/lib/services/season.service";
import { ChampionshipClassificationService, SeasonClassification, ClassificationEntry } from "@/lib/services/championship-classification.service";
import { Loading } from '@/components/ui/loading';
import { toast } from "sonner";

interface ClassificationTabProps {
  championshipId: string;
}

const PODIUM_POSITIONS = [1, 2, 3, 4, 5];

/**
 * Tab de classificação do campeonato
 * Exibe classificação geral e por categorias, usando dados otimizados do Redis
 * Segue padrões dos maiores campeonatos de automobilismo mundial
 */
export const ClassificationTab = ({ championshipId }: ClassificationTabProps) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados básicos
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  
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
      
      console.log('🔍 [FRONTEND] Buscando classificação para temporada:', seasonId);
      const classification = await ChampionshipClassificationService.getSeasonClassificationOptimized(seasonId);
      
      console.log('📊 [FRONTEND] Classificação recebida:', {
        hasData: !!classification,
        totalCategories: classification?.totalCategories,
        totalPilots: classification?.totalPilots,
        categoriesCount: Object.keys(classification?.classificationsByCategory || {}).length,
        categories: Object.keys(classification?.classificationsByCategory || {}),
        lastUpdated: classification?.lastUpdated
      });
      
      setSeasonClassification(classification);

    } catch (err: any) {
      console.error('❌ [FRONTEND] Erro ao carregar classificação:', err);
      setError(err.message || 'Erro ao carregar classificação');
      setSeasonClassification(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recalcular classificação
  const recalculateClassification = useCallback(async () => {
    if (!selectedSeasonId) return;
    
    try {
      setRefreshing(true);
      await ChampionshipClassificationService.recalculateSeasonClassification(selectedSeasonId);
      
      // Aguardar um pouco para o cache ser atualizado
      setTimeout(() => {
        fetchClassification(selectedSeasonId);
        toast.success('Classificação recalculada com sucesso!');
      }, 1000);
      
    } catch (err: any) {
      toast.error(err.message || 'Erro ao recalcular classificação');
    } finally {
      setRefreshing(false);
    }
  }, [selectedSeasonId, fetchClassification]);

  // Efeitos
  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchClassification(selectedSeasonId);
    }
  }, [selectedSeasonId, fetchClassification]);

  // Dados processados
  const { categories, allPilots, filteredPilots } = useMemo(() => {
    console.log('🔄 [FRONTEND] Processando dados de classificação:', {
      hasSeasonClassification: !!seasonClassification,
      hasClassificationsByCategory: !!seasonClassification?.classificationsByCategory,
      selectedCategoryId
    });

    if (!seasonClassification || !seasonClassification.classificationsByCategory) {
      console.log('⚠️ [FRONTEND] Sem dados de classificação para processar');
      return { categories: [], allPilots: [], filteredPilots: [] };
    }

    // Verificar se há categorias válidas
    const validCategories = Object.entries(seasonClassification.classificationsByCategory).filter(
      ([_, data]) => data && data.category
    );

    console.log('📋 [FRONTEND] Categorias válidas encontradas:', {
      total: validCategories.length,
      categories: validCategories.map(([id, data]) => ({ id, name: data.category?.name, pilotsCount: data.pilots?.length }))
    });

    const categoriesArray = validCategories.map(([categoryId, data]) => ({
      ...data.category,
      id: categoryId
    }));

    const allPilotsArray: ClassificationEntry[] = [];
    validCategories.forEach(([_, categoryData]) => {
      if (categoryData && categoryData.pilots && Array.isArray(categoryData.pilots)) {
        console.log('👥 [FRONTEND] Adicionando pilotos da categoria:', {
          categoryName: categoryData.category?.name,
          pilotsCount: categoryData.pilots.length
        });
        allPilotsArray.push(...categoryData.pilots);
      }
    });

    const filteredPilotsArray = selectedCategoryId === 'all' 
      ? allPilotsArray
      : seasonClassification.classificationsByCategory[selectedCategoryId]?.pilots || [];

    console.log('✅ [FRONTEND] Dados processados:', {
      categoriesCount: categoriesArray.length,
      allPilotsCount: allPilotsArray.length,
      filteredPilotsCount: filteredPilotsArray.length,
      selectedCategory: selectedCategoryId
    });

    return {
      categories: categoriesArray,
      allPilots: allPilotsArray,
      filteredPilots: filteredPilotsArray
    };
  }, [seasonClassification, selectedCategoryId]);

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
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            Nenhum piloto na classificação
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={recalculateClassification}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Recalculando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Calcular Classificação
                </>
              )}
            </Button>
          </div>
        </div>
        <EmptyState
          icon={Users}
          title="Classificação ainda não disponível"
          description="A classificação desta temporada ainda não foi calculada. Clique em 'Calcular Classificação' para gerar os dados."
        />
      </div>
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
                      <Badge variant="outline" className="text-xs">Lastro: {category.ballast}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            {filteredPilots.length} piloto{filteredPilots.length !== 1 ? 's' : ''} na classificação
          </div>
          {seasonClassification?.lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Última atualização: {new Date(seasonClassification.lastUpdated).toLocaleString('pt-BR')}
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={recalculateClassification}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Recalculando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalcular
                </>
              )}
            </Button>
          </div>
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
        <Card>
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
              {filteredPilots.map((entry, index) => (
                <TableRow key={`${entry.user.id}-${entry.category.id}`}>
                  <TableCell className="font-medium">
                    {renderPositionBadge(index + 1)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{entry.user.name}</div>
                      {entry.user.nickname && (
                        <div className="text-xs text-muted-foreground">@{entry.user.nickname}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.category.name}</span>
                      <Badge variant="outline" className="text-xs">Lastro: {entry.category.ballast}</Badge>
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
        </Card>
      )}
    </div>
  );
}; 