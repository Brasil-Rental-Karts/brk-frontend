import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { AlertTriangle, Plus, Filter, Download, MoreVertical } from "lucide-react";
import { EmptyState } from "brk-design-system";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { useIsMobile } from "@/hooks/use-mobile";
import { usePenalties } from "@/hooks/use-penalties";
import { PenaltyList } from "@/components/penalty/PenaltyList";
import { Penalty, PenaltyType, PenaltyStatus } from "@/lib/services/penalty.service";
import { SeasonService } from "@/lib/services/season.service";
import { CategoryService, Category } from "@/lib/services/category.service";
import { StageService, Stage } from "@/lib/services/stage.service";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { Loading } from '@/components/ui/loading';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

interface PenaltiesTabProps {
  championshipId: string;
}

// Configuração inicial dos filtros
const createFilterFields = (
  seasonOptions: { value: string; label: string }[] = [], 
  categoryOptions: { value: string; label: string }[] = [],
  stageOptions: { value: string; label: string }[] = []
): FilterField[] => [
  {
    key: 'seasonId',
    label: 'Temporada',
    type: 'combobox',
    placeholder: 'Todas as temporadas',
    options: seasonOptions
  },
  {
    key: 'categoryId',
    label: 'Categoria',
    type: 'combobox',
    placeholder: 'Todas as categorias',
    options: categoryOptions
  },
  {
    key: 'stageId',
    label: 'Etapa',
    type: 'combobox',
    placeholder: 'Todas as etapas',
    options: stageOptions
  },
  {
    key: 'type',
    label: 'Tipo de Punição',
    type: 'combobox',
    placeholder: 'Todos os tipos',
    options: [
      { value: 'all', label: 'Todos os tipos' },
      { value: PenaltyType.DISQUALIFICATION, label: 'Desqualificação' },
      { value: PenaltyType.TIME_PENALTY, label: 'Penalidade de Tempo' },
      { value: PenaltyType.POSITION_PENALTY, label: 'Penalidade de Posição' },
      { value: PenaltyType.SUSPENSION, label: 'Suspensão' },
      { value: PenaltyType.WARNING, label: 'Advertência' }
    ]
  },
  {
    key: 'status',
    label: 'Status',
    type: 'combobox',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: PenaltyStatus.PENDING, label: 'Pendente' },
      { value: PenaltyStatus.APPLIED, label: 'Aplicada' },
      { value: PenaltyStatus.CANCELLED, label: 'Cancelada' },
      { value: PenaltyStatus.APPEALED, label: 'Recorrida' }
    ]
  }
];

/**
 * Tab de punições do campeonato
 * Exibe lista de todas as punições aplicadas no campeonato
 */
export const PenaltiesTab = ({ championshipId }: PenaltiesTabProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Penalty>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState("");

  const {
    penalties: penaltiesData,
    loading: penaltiesLoading,
    error: penaltiesError,
    createPenalty,
    updatePenalty,
    applyPenalty,
    cancelPenalty,
    appealPenalty,
    deletePenalty,
    fetchPenaltiesByChampionshipId,
    clearError
  } = usePenalties();

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Carregar temporadas do campeonato
        const seasonsData = await SeasonService.getByChampionshipId(championshipId);
        setSeasons(seasonsData.data);

        // Carregar categorias - vamos buscar por temporada
        const allCategories: Category[] = [];
        for (const season of seasonsData.data) {
          const categoriesData = await CategoryService.getBySeasonId(season.id);
          allCategories.push(...categoriesData);
        }
        setCategories(allCategories);

        // Carregar etapas - vamos buscar por temporada
        const allStages: Stage[] = [];
        for (const season of seasonsData.data) {
          const stagesData = await StageService.getBySeasonId(season.id);
          allStages.push(...stagesData);
        }
        setStages(allStages);

        // Carregar punições
        await fetchPenaltiesByChampionshipId(championshipId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [championshipId, fetchPenaltiesByChampionshipId]);

  // Filtrar e ordenar punições
  const filteredAndSortedPenalties = useMemo(() => {
    let filtered = penaltiesData.filter(penalty => {
      // Filtro por temporada
      if (filters.seasonId && filters.seasonId !== 'all') {
        if (!penalty.seasonId || penalty.seasonId !== filters.seasonId) {
          return false;
        }
      }

      // Filtro por categoria
      if (filters.categoryId && filters.categoryId !== 'all') {
        if (!penalty.categoryId || penalty.categoryId !== filters.categoryId) {
          return false;
        }
      }

      // Filtro por etapa
      if (filters.stageId && filters.stageId !== 'all') {
        if (!penalty.stageId || penalty.stageId !== filters.stageId) {
          return false;
        }
      }

      // Filtro por tipo
      if (filters.type && filters.type !== 'all') {
        if (penalty.type !== filters.type) {
          return false;
        }
      }

      // Filtro por status
      if (filters.status && filters.status !== 'all') {
        if (penalty.status !== filters.status) {
          return false;
        }
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [penaltiesData, filters, sortBy, sortOrder]);

  // Paginação
  const paginatedPenalties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedPenalties.slice(startIndex, endIndex);
  }, [filteredAndSortedPenalties, currentPage, itemsPerPage]);

  // Opções para filtros
  const filterOptions = useMemo(() => {
    const seasonOptions = [
      { value: 'all', label: 'Todas as temporadas' },
      ...seasons.map(season => ({
        value: season.id,
        label: season.name
      }))
    ];

    const categoryOptions = [
      { value: 'all', label: 'Todas as categorias' },
      ...categories.map(category => ({
        value: category.id,
        label: category.name
      }))
    ];

    const stageOptions = [
      { value: 'all', label: 'Todas as etapas' },
      ...stages.map(stage => ({
        value: stage.id,
        label: stage.name
      }))
    ];

    return { seasonOptions, categoryOptions, stageOptions };
  }, [seasons, categories, stages]);

  const handleSort = (column: keyof Penalty) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => setItemsPerPage(items);

  const handlePenaltyAction = async (action: string, penaltyId: string) => {
    try {
      switch (action) {
        case 'apply':
          await applyPenalty(penaltyId);
          toast.success('Punição aplicada com sucesso');
          break;
        case 'cancel':
          await cancelPenalty(penaltyId);
          toast.success('Punição cancelada com sucesso');
          break;
        case 'delete':
          await deletePenalty(penaltyId);
          toast.success('Punição deletada com sucesso');
          break;
        case 'appeal':
          setSelectedPenalty(penaltiesData.find(p => p.id === penaltyId) || null);
          setShowAppealModal(true);
          break;
        default:
          console.warn('Ação não implementada:', action);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao executar ação');
    }
  };

  const handleAppealSubmit = async () => {
    if (!selectedPenalty || !appealReason.trim()) {
      toast.error('Motivo do recurso é obrigatório');
      return;
    }

    try {
      await appealPenalty(selectedPenalty.id, { appealReason });
      toast.success('Recurso enviado com sucesso');
      setShowAppealModal(false);
      setAppealReason("");
      setSelectedPenalty(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar recurso');
    }
  };

  const handleCreatePenalty = async (data: any) => {
    try {
      await createPenalty({
        ...data,
        championshipId
      });
      toast.success('Punição criada com sucesso');
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar punição');
    }
  };

  const handleEditPenalty = (penalty: Penalty) => {
    // Navegar para a página de edição com os dados da punição
    navigate(`/championship/${championshipId}/penalties/edit/${penalty.id}`, {
      state: { penalty }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Loading type="spinner" size="lg" />
      </div>
    );
  }

  // Error state
  if (error || penaltiesError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error || penaltiesError || "Erro ao carregar punições"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Punições</h2>
          <p className="text-muted-foreground">
            Gerencie as punições aplicadas no campeonato
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/championship/${championshipId}/penalties/new`)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Punição
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="text-lg font-semibold">Filtros</h3>
          </div>
        </CardHeader>
        <CardContent>
          <DynamicFilter
            fields={createFilterFields(
              filterOptions.seasonOptions,
              filterOptions.categoryOptions,
              filterOptions.stageOptions
            )}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Lista de punições */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Punições</h3>
            <Badge variant="outline">
              {filteredAndSortedPenalties.length} {filteredAndSortedPenalties.length === 1 ? 'punição' : 'punições'}
            </Badge>
          </div>
        </div>

        {penaltiesLoading ? (
          <div className="flex justify-center py-8">
            <Loading type="spinner" size="lg" />
          </div>
        ) : (
          <PenaltyList
            penalties={paginatedPenalties}
            loading={penaltiesLoading}
            onApplyPenalty={(id) => handlePenaltyAction('apply', id)}
            onCancelPenalty={(id) => handlePenaltyAction('cancel', id)}
            onAppealPenalty={(id) => handlePenaltyAction('appeal', id)}
            onEditPenalty={handleEditPenalty}
            onDeletePenalty={(id) => handlePenaltyAction('delete', id)}
            showActions={true}
          />
        )}

        {/* Paginação */}
        {filteredAndSortedPenalties.length > 0 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredAndSortedPenalties.length / itemsPerPage)}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalItems={filteredAndSortedPenalties.length}
              startIndex={(currentPage - 1) * itemsPerPage}
              endIndex={Math.min(currentPage * itemsPerPage, filteredAndSortedPenalties.length)}
              hasNextPage={currentPage < Math.ceil(filteredAndSortedPenalties.length / itemsPerPage)}
              hasPreviousPage={currentPage > 1}
            />
          </div>
        )}
      </div>

      {/* Modal de Recurso */}
      <Dialog open={showAppealModal} onOpenChange={setShowAppealModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recorrer Punição</DialogTitle>
            <DialogDescription>
              Descreva o motivo do recurso para esta punição.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo do Recurso</label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                rows={4}
                placeholder="Descreva o motivo do recurso..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppealModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAppealSubmit}>
              Enviar Recurso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação (placeholder) */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Punição</DialogTitle>
            <DialogDescription>
              Crie uma nova punição para um piloto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Formulário de criação de punição será implementado aqui.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 