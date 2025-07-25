import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "brk-design-system";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  MapPin,
  MoreVertical,
  Plus,
  RotateCcw,
  Trash2,
  UserX,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  DynamicFilter,
  FilterField,
  FilterValues,
} from "@/components/ui/dynamic-filter";
import { InlineLoader } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePenalties } from "@/hooks/use-penalties";
import { usePagination } from "@/hooks/usePagination";
import { ChampionshipClassificationService } from "@/lib/services/championship-classification.service";
import {
  Penalty,
  PenaltyService,
  PenaltyStatus,
  PenaltyType,
} from "@/lib/services/penalty.service";
import { formatName } from "@/utils/name";

interface PenaltiesTabProps {
  championshipId: string;
}

type PenaltyWithSeasonName = Penalty & {
  seasonName?: string;
  categoryName?: string;
  stageName?: string;
};

// Configuração dos filtros incluindo temporada, categoria e etapa
const createFilterFields = (
  seasonOptions: { value: string; label: string }[] = [],
  categoryOptions: { value: string; label: string }[] = [],
  stageOptions: { value: string; label: string }[] = [],
): FilterField[] => [
  {
    key: "seasonId",
    label: "Temporada",
    type: "combobox",
    placeholder: "Todas as temporadas",
    options: [{ value: "all", label: "Todas as temporadas" }, ...seasonOptions],
  },
  {
    key: "categoryId",
    label: "Categoria",
    type: "combobox",
    placeholder: "Todas as categorias",
    options: [
      { value: "all", label: "Todas as categorias" },
      ...categoryOptions,
    ],
  },
  {
    key: "stageId",
    label: "Etapa",
    type: "combobox",
    placeholder: "Todas as etapas",
    options: [{ value: "all", label: "Todas as etapas" }, ...stageOptions],
  },
  {
    key: "type",
    label: "Tipo de Punição",
    type: "combobox",
    placeholder: "Todos os tipos",
    options: [
      { value: "all", label: "Todos os tipos" },
      { value: PenaltyType.DISQUALIFICATION, label: "Desqualificação" },
      { value: PenaltyType.TIME_PENALTY, label: "Penalidade de Tempo" },
      { value: PenaltyType.POSITION_PENALTY, label: "Penalidade de Posição" },
      { value: PenaltyType.WARNING, label: "Advertência" },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "combobox",
    placeholder: "Todos os status",
    options: [
      { value: "all", label: "Todos os status" },

      { value: PenaltyStatus.APPLIED, label: "Aplicada" },
      { value: PenaltyStatus.NOT_APPLIED, label: "Não Aplicada" },
      { value: PenaltyStatus.APPEALED, label: "Recorrida" },
    ],
  },
];

const PenaltyCard = ({
  penalty,
  onAction,
  getPenaltyIcon,
  getStatusIcon,
  contextSeasons,
  contextCategories,
  contextStages,
}: {
  penalty: PenaltyWithSeasonName;
  onAction: (action: string, penaltyId: string) => void;
  getPenaltyIcon: (type: PenaltyType) => JSX.Element;
  getStatusIcon: (status: PenaltyStatus) => JSX.Element;
  contextSeasons: any[];
  contextCategories: any[];
  contextStages: any[];
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determinar quais ações mostrar baseado no status
  const getAvailableActions = () => {
    const actions = [];

    // Sempre permitir editar
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <Edit className="h-4 w-4 mr-2" />,
      onClick: () => onAction("edit", penalty.id),
    });

    // Mostrar "Aplicar" para status que não são APPLIED
    if (penalty.status !== PenaltyStatus.APPLIED) {
      actions.push({
        key: "apply",
        label: "Aplicar",
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
        onClick: () => onAction("apply", penalty.id),
      });
    }

    // Mostrar "Não Aplicar" para status que não são NOT_APPLIED
    if (penalty.status !== PenaltyStatus.NOT_APPLIED) {
      actions.push({
        key: "cancel",
        label: "Não Aplicar",
        icon: <XCircle className="h-4 w-4 mr-2" />,
        onClick: () => onAction("cancel", penalty.id),
      });
    }

    // Mostrar "Recorrer" para status que não são APPEALED
    if (penalty.status !== PenaltyStatus.APPEALED) {
      actions.push({
        key: "appeal",
        label: "Recorrer",
        icon: <RotateCcw className="h-4 w-4 mr-2" />,
        onClick: () => onAction("appeal", penalty.id),
      });
    }

    // Mostrar "Ver Motivo do Recurso" se tiver appealReason
    if (penalty.appealReason) {
      actions.push({
        key: "viewAppeal",
        label: "Ver Motivo do Recurso",
        icon: <FileText className="h-4 w-4 mr-2" />,
        onClick: () => onAction("viewAppeal", penalty.id),
      });
    }

    // Sempre permitir excluir
    actions.push({
      key: "delete",
      label: "Excluir",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => onAction("delete", penalty.id),
      className: "text-destructive",
    });

    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        {/* Header principal com título, ícone e ações */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {getPenaltyIcon(penalty.type)}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold tracking-tight break-words">
                {PenaltyService.getPenaltyTypeLabel(penalty.type)}
              </h3>
            </div>
          </div>

          {/* Botão de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableActions.map((action) => (
                <DropdownMenuItem
                  key={action.key}
                  onClick={action.onClick}
                  className={action.className}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags em linha separada para melhor organização */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className={PenaltyService.getPenaltyTypeColor(penalty.type)}>
            {PenaltyService.getPenaltyTypeLabel(penalty.type)}
          </Badge>
          <Badge
            className={PenaltyService.getPenaltyStatusColor(penalty.status)}
          >
            {getStatusIcon(penalty.status)}
            <span className="ml-1">
              {PenaltyService.getPenaltyStatusLabel(penalty.status)}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Motivo */}
        <div>
          <h4 className="font-semibold text-sm text-gray-600 mb-1">Motivo</h4>
          <p className="text-sm break-words">{penalty.reason}</p>
        </div>

        {/* Descrição (se existir) */}
        {penalty.description && (
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">
              Descrição
            </h4>
            <p className="text-sm break-words">{penalty.description}</p>
          </div>
        )}

        {/* Detalhes da punição */}
        <div className="space-y-3">
          {/* Informações de contexto */}
          {penalty.seasonId && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Temporada</span>
              <span className="text-sm font-medium break-words text-right">
                {contextSeasons.find((s) => s.id === penalty.seasonId)?.name ||
                  "N/A"}
              </span>
            </div>
          )}

          {penalty.categoryId && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Categoria</span>
              <span className="text-sm font-medium break-words text-right">
                {contextCategories.find((c) => c.id === penalty.categoryId)
                  ?.name || "N/A"}
              </span>
            </div>
          )}

          {penalty.stageId && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Etapa</span>
              <span className="text-sm font-medium break-words text-right">
                {contextStages.find((s) => s.id === penalty.stageId)?.name ||
                  "N/A"}
              </span>
            </div>
          )}

          {penalty.timePenaltySeconds && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Penalidade de Tempo</span>
              <span className="text-sm font-medium">
                {penalty.timePenaltySeconds} segundos
              </span>
            </div>
          )}

          {penalty.positionPenalty && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                Penalidade de Posição
              </span>
              <span className="text-sm font-medium">
                {penalty.positionPenalty} posições
              </span>
            </div>
          )}

          {penalty.batteryIndex !== undefined &&
            penalty.batteryIndex !== null && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Bateria</span>
                <span className="text-sm font-medium">
                  Bateria {penalty.batteryIndex + 1}
                </span>
              </div>
            )}

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Piloto</span>
            <span className="text-sm font-medium break-words text-right">
              {formatName(penalty.user?.name || "N/A")}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Aplicada por</span>
            <span className="text-sm font-medium break-words text-right">
              {formatName(penalty.appliedByUser?.name || "N/A")}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Data</span>
            <span className="text-sm font-medium">
              {formatDate(penalty.createdAt)}
            </span>
          </div>
        </div>

        {/* Motivo do recurso (se existir) */}
        {penalty.appealReason && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <h4 className="font-semibold text-sm text-gray-600 mb-1">
              Motivo do Recurso
            </h4>
            <p className="text-sm break-words">{penalty.appealReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Tab de punições do campeonato
 * Exibe lista de todas as punições aplicadas no campeonato
 */
export const PenaltiesTab = ({ championshipId }: PenaltiesTabProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Usar o contexto de dados do campeonato
  const {
    getSeasons,
    getCategories,
    getStages,
    getPenalties,
    addPenalty,
    updatePenalty,
    removePenalty,
    updateStage,
    refreshStageParticipations,
    loading: contextLoading,
    error: contextError,
  } = useChampionshipData();

  // Usar o hook de penalidades apenas para operações CRUD
  const {
    createPenalty,
    applyPenalty,
    cancelPenalty,
    appealPenalty,
    deletePenalty,
    clearError,
  } = usePenalties(addPenalty, updatePenalty, removePenalty);

  // Obter dados do contexto
  const contextSeasons = getSeasons();
  const contextCategories = getCategories();
  const contextStages = getStages();
  const contextPenalties = getPenalties();

  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Penalty>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState("");

  // Estados para modal de visualização do motivo do recurso
  const [showViewAppealModal, setShowViewAppealModal] = useState(false);
  const [penaltyToViewAppeal, setPenaltyToViewAppeal] =
    useState<Penalty | null>(null);

  // Estados para o modal de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [penaltyToDelete, setPenaltyToDelete] = useState<Penalty | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados para modais de confirmação
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [penaltyToApply, setPenaltyToApply] = useState<Penalty | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [penaltyToCancel, setPenaltyToCancel] = useState<Penalty | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Preparar opções dos filtros baseado nos dados do contexto
  const seasonOptions = useMemo(
    () =>
      contextSeasons.map((season) => ({
        value: season.id,
        label: season.name,
      })),
    [contextSeasons],
  );

  const categoryOptions = useMemo(
    () =>
      contextCategories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [contextCategories],
  );

  const stageOptions = useMemo(
    () =>
      contextStages.map((stage) => ({ value: stage.id, label: stage.name })),
    [contextStages],
  );

  // Filtros com opções dinâmicas
  const filterFields = useMemo(
    () => createFilterFields(seasonOptions, categoryOptions, stageOptions),
    [seasonOptions, categoryOptions, stageOptions],
  );

  // Filtrar e ordenar punições usando dados do contexto
  const filteredPenalties = useMemo(() => {
    const filtered = contextPenalties.filter((penalty) => {
      // Filtro por temporada
      if (filters.seasonId && filters.seasonId !== "all") {
        const penaltySeason = contextSeasons.find(
          (s) => s.id === penalty.seasonId,
        );
        if (!penaltySeason || penaltySeason.id !== filters.seasonId) {
          return false;
        }
      }

      // Filtro por categoria
      if (filters.categoryId && filters.categoryId !== "all") {
        const penaltyCategory = contextCategories.find(
          (c) => c.id === penalty.categoryId,
        );
        if (!penaltyCategory || penaltyCategory.id !== filters.categoryId) {
          return false;
        }
      }

      // Filtro por etapa
      if (filters.stageId && filters.stageId !== "all") {
        const penaltyStage = contextStages.find(
          (s) => s.id === penalty.stageId,
        );
        if (!penaltyStage || penaltyStage.id !== filters.stageId) {
          return false;
        }
      }

      // Filtro por tipo
      if (filters.type && filters.type !== "all") {
        if (penalty.type !== filters.type) {
          return false;
        }
      }

      // Filtro por status
      if (filters.status && filters.status !== "all") {
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
      if (aValue === undefined) return sortOrder === "asc" ? -1 : 1;
      if (bValue === undefined) return sortOrder === "asc" ? 1 : -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    contextPenalties,
    filters,
    sortBy,
    sortOrder,
    contextSeasons,
    contextCategories,
    contextStages,
  ]);

  // --- Lógica para Desktop (Paginação) ---
  const pagination = usePagination(filteredPenalties.length, 5, 1);
  const paginatedDesktopPenalties = useMemo(() => {
    if (isMobile) return [];
    return filteredPenalties.slice(
      pagination.info.startIndex,
      pagination.info.endIndex,
    );
  }, [
    isMobile,
    filteredPenalties,
    pagination.info.startIndex,
    pagination.info.endIndex,
  ]);

  // --- Lógica para Mobile (Scroll Infinito) ---
  const [visibleMobilePenalties, setVisibleMobilePenalties] = useState<
    PenaltyWithSeasonName[]
  >([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const itemsPerPage = 5;

  useEffect(() => {
    if (isMobile) {
      setVisibleMobilePenalties(filteredPenalties.slice(0, itemsPerPage));
      setMobilePage(2);
      setHasMore(filteredPenalties.length > itemsPerPage);
    }
  }, [isMobile, filteredPenalties]);

  const lastPenaltyElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoadingMore(true);
          setTimeout(() => {
            const newPenalties = filteredPenalties.slice(
              0,
              mobilePage * itemsPerPage,
            );
            setVisibleMobilePenalties(newPenalties);
            setHasMore(newPenalties.length < filteredPenalties.length);
            setMobilePage((prev) => prev + 1);
            setLoadingMore(false);
          }, 300);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, mobilePage, filteredPenalties],
  );

  const processedPenalties = isMobile
    ? visibleMobilePenalties
    : paginatedDesktopPenalties;

  const getPenaltyIcon = (type: PenaltyType) => {
    switch (type) {
      case PenaltyType.DISQUALIFICATION:
        return <UserX className="h-4 w-4" />;
      case PenaltyType.TIME_PENALTY:
        return <Clock className="h-4 w-4" />;
      case PenaltyType.POSITION_PENALTY:
        return <MapPin className="h-4 w-4" />;
      case PenaltyType.WARNING:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: PenaltyStatus) => {
    switch (status) {
      case PenaltyStatus.APPLIED:
        return <CheckCircle className="h-4 w-4" />;
      case PenaltyStatus.NOT_APPLIED:
        return <XCircle className="h-4 w-4" />;
      case PenaltyStatus.APPEALED:
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determinar quais ações mostrar na tabela baseado no status
  const getAvailableActionsForTable = (penalty: Penalty) => {
    const actions = [];

    // Sempre permitir editar
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <Edit className="h-4 w-4 mr-2" />,
      onClick: () => handlePenaltyAction("edit", penalty.id),
    });

    // Mostrar "Aplicar" para status que não são APPLIED
    if (penalty.status !== PenaltyStatus.APPLIED) {
      actions.push({
        key: "apply",
        label: "Aplicar",
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
        onClick: () => handlePenaltyAction("apply", penalty.id),
      });
    }

    // Mostrar "Não Aplicar" para status que não são NOT_APPLIED
    if (penalty.status !== PenaltyStatus.NOT_APPLIED) {
      actions.push({
        key: "cancel",
        label: "Não Aplicar",
        icon: <XCircle className="h-4 w-4 mr-2" />,
        onClick: () => handlePenaltyAction("cancel", penalty.id),
      });
    }

    // Mostrar "Recorrer" para status que não são APPEALED
    if (penalty.status !== PenaltyStatus.APPEALED) {
      actions.push({
        key: "appeal",
        label: "Recorrer",
        icon: <RotateCcw className="h-4 w-4 mr-2" />,
        onClick: () => handlePenaltyAction("appeal", penalty.id),
      });
    }

    // Mostrar "Ver Motivo do Recurso" se tiver appealReason
    if (penalty.appealReason) {
      actions.push({
        key: "viewAppeal",
        label: "Ver Motivo do Recurso",
        icon: <FileText className="h-4 w-4 mr-2" />,
        onClick: () => handlePenaltyAction("viewAppeal", penalty.id),
      });
    }

    // Sempre permitir excluir
    actions.push({
      key: "delete",
      label: "Excluir",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: () => handlePenaltyAction("delete", penalty.id),
      className: "text-destructive",
    });

    return actions;
  };

  const handleSort = (column: keyof Penalty) => {
    setSortBy((prevSortBy) => {
      if (prevSortBy === column) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
      } else {
        setSortOrder("asc");
      }
      return column;
    });
    if (!isMobile) {
      pagination.actions.goToFirstPage();
    }
  };

  const handleAddPenalty = () => {
    navigate(`/championship/${championshipId}/penalties/new`);
  };

  const handleEditPenalty = (penalty: Penalty) => {
    navigate(`/championship/${championshipId}/penalties/edit/${penalty.id}`, {
      state: { penalty },
    });
  };

  const handleDeletePenalty = (penalty: Penalty) => {
    setPenaltyToDelete(penalty);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const confirmDeletePenalty = async () => {
    if (!penaltyToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deletePenalty(penaltyToDelete.id);
      toast.success("Punição deletada com sucesso");

      // Se for punição de tempo aplicada, recalculcar posições
      if (
        penaltyToDelete.type === "time_penalty" &&
        penaltyToDelete.status === "applied" &&
        penaltyToDelete.stageId &&
        penaltyToDelete.categoryId &&
        penaltyToDelete.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após exclusão de punição...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToDelete.stageId,
            penaltyToDelete.categoryId,
            penaltyToDelete.batteryIndex!,
          );
          console.log("✅ Posições recalculadas após exclusão de punição");

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToDelete.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToDelete.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToDelete.stageId);
          console.log("✅ Participações da etapa atualizadas após exclusão");
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após exclusão:",
            recalcError,
          );
          // Não bloquear o sucesso da exclusão se o recálculo falhar
        }
      }

      // Se for punição de desclassificação aplicada, recalculcar posições
      if (
        penaltyToDelete.type === "disqualification" &&
        penaltyToDelete.status === "applied" &&
        penaltyToDelete.stageId &&
        penaltyToDelete.categoryId &&
        penaltyToDelete.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após exclusão de desclassificação...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToDelete.stageId,
            penaltyToDelete.categoryId,
            penaltyToDelete.batteryIndex!,
          );
          console.log(
            "✅ Posições recalculadas após exclusão de desclassificação",
          );

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToDelete.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToDelete.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToDelete.stageId);
          console.log(
            "✅ Participações da etapa atualizadas após exclusão de desclassificação",
          );
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após exclusão de desclassificação:",
            recalcError,
          );
          // Não bloquear o sucesso da exclusão se o recálculo falhar
        }
      }

      // Se for punição de posição aplicada, recalculcar posições
      if (
        penaltyToDelete.type === "position_penalty" &&
        penaltyToDelete.status === "applied" &&
        penaltyToDelete.stageId &&
        penaltyToDelete.categoryId &&
        penaltyToDelete.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após exclusão de penalidade de posição...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToDelete.stageId,
            penaltyToDelete.categoryId,
            penaltyToDelete.batteryIndex!,
          );
          console.log(
            "✅ Posições recalculadas após exclusão de penalidade de posição",
          );

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToDelete.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToDelete.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToDelete.stageId);
          console.log(
            "✅ Participações da etapa atualizadas após exclusão de penalidade de posição",
          );
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após exclusão de penalidade de posição:",
            recalcError,
          );
          // Não bloquear o sucesso da exclusão se o recálculo falhar
        }
      }

      setShowDeleteDialog(false);
      setPenaltyToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || "Erro ao deletar punição");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeletePenalty = () => {
    setShowDeleteDialog(false);
    setPenaltyToDelete(null);
    setDeleteError(null);
  };

  const handleApplyPenalty = (penalty: Penalty) => {
    setPenaltyToApply(penalty);
    setApplyError(null);
    setShowApplyDialog(true);
  };

  const confirmApplyPenalty = async () => {
    if (!penaltyToApply) return;

    setIsApplying(true);
    setApplyError(null);

    try {
      await applyPenalty(penaltyToApply.id);
      toast.success("Punição aplicada com sucesso");

      // Se for punição de tempo aplicada, recalculcar posições
      if (
        penaltyToApply.type === "time_penalty" &&
        penaltyToApply.stageId &&
        penaltyToApply.categoryId &&
        penaltyToApply.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após aplicação de punição...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToApply.stageId,
            penaltyToApply.categoryId,
            penaltyToApply.batteryIndex!,
          );
          console.log("✅ Posições recalculadas após aplicação de punição");

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToApply.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToApply.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToApply.stageId);
          console.log("✅ Participações da etapa atualizadas após aplicação");
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após aplicação:",
            recalcError,
          );
          // Não bloquear o sucesso da aplicação se o recálculo falhar
        }
      }

      // Se for punição de desclassificação aplicada, recalculcar posições
      if (
        penaltyToApply.type === "disqualification" &&
        penaltyToApply.stageId &&
        penaltyToApply.categoryId &&
        penaltyToApply.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após aplicação de desclassificação...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToApply.stageId,
            penaltyToApply.categoryId,
            penaltyToApply.batteryIndex!,
          );
          console.log(
            "✅ Posições recalculadas após aplicação de desclassificação",
          );

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToApply.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToApply.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToApply.stageId);
          console.log(
            "✅ Participações da etapa atualizadas após aplicação de desclassificação",
          );
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após aplicação de desclassificação:",
            recalcError,
          );
          // Não bloquear o sucesso da aplicação se o recálculo falhar
        }
      }

      // Se for punição de posição aplicada, recalculcar posições
      if (
        penaltyToApply.type === "position_penalty" &&
        penaltyToApply.stageId &&
        penaltyToApply.categoryId &&
        penaltyToApply.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após aplicação de penalidade de posição...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToApply.stageId,
            penaltyToApply.categoryId,
            penaltyToApply.batteryIndex!,
          );
          console.log(
            "✅ Posições recalculadas após aplicação de penalidade de posição",
          );

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToApply.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToApply.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToApply.stageId);
          console.log(
            "✅ Participações da etapa atualizadas após aplicação de penalidade de posição",
          );
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após aplicação de penalidade de posição:",
            recalcError,
          );
          // Não bloquear o sucesso da aplicação se o recálculo falhar
        }
      }

      setShowApplyDialog(false);
      setPenaltyToApply(null);
    } catch (err: any) {
      setApplyError(err.message || "Erro ao aplicar punição");
    } finally {
      setIsApplying(false);
    }
  };

  const cancelApplyPenalty = () => {
    setShowApplyDialog(false);
    setPenaltyToApply(null);
    setApplyError(null);
  };

  const handleCancelPenalty = (penalty: Penalty) => {
    setPenaltyToCancel(penalty);
    setCancelError(null);
    setShowCancelDialog(true);
  };

  const confirmCancelPenalty = async () => {
    if (!penaltyToCancel) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelPenalty(penaltyToCancel.id);
      toast.success("Punição cancelada com sucesso");

      // Se for punição de tempo aplicada, recalculcar posições
      if (
        penaltyToCancel.type === "time_penalty" &&
        penaltyToCancel.status === "applied" &&
        penaltyToCancel.stageId &&
        penaltyToCancel.categoryId &&
        penaltyToCancel.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após cancelamento de punição...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToCancel.stageId,
            penaltyToCancel.categoryId,
            penaltyToCancel.batteryIndex!,
          );
          console.log("✅ Posições recalculadas após cancelamento de punição");

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToCancel.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToCancel.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToCancel.stageId);
          console.log(
            "✅ Participações da etapa atualizadas após cancelamento",
          );
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após cancelamento:",
            recalcError,
          );
          // Não bloquear o sucesso do cancelamento se o recálculo falhar
        }
      }

      // Se for punição de desclassificação aplicada, recalculcar posições
      if (
        penaltyToCancel.type === "disqualification" &&
        penaltyToCancel.status === "applied" &&
        penaltyToCancel.stageId &&
        penaltyToCancel.categoryId &&
        penaltyToCancel.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após cancelamento de desclassificação...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToCancel.stageId,
            penaltyToCancel.categoryId,
            penaltyToCancel.batteryIndex!,
          );
          console.log(
            "✅ Posições recalculadas após cancelamento de desclassificação",
          );

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToCancel.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToCancel.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToCancel.stageId);
          console.log(
            "✅ Participações da etapa atualizadas após cancelamento de desclassificação",
          );
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após cancelamento de desclassificação:",
            recalcError,
          );
          // Não bloquear o sucesso do cancelamento se o recálculo falhar
        }
      }

      // Se for punição de posição aplicada, recalculcar posições
      if (
        penaltyToCancel.type === "position_penalty" &&
        penaltyToCancel.status === "applied" &&
        penaltyToCancel.stageId &&
        penaltyToCancel.categoryId &&
        penaltyToCancel.batteryIndex !== null
      ) {
        try {
          console.log(
            "🔄 [PENALTIES TAB] Recalculando posições após cancelamento de penalidade de posição...",
          );
          await ChampionshipClassificationService.recalculateStagePositions(
            penaltyToCancel.stageId,
            penaltyToCancel.categoryId,
            penaltyToCancel.batteryIndex!,
          );
          console.log(
            "✅ Posições recalculadas após cancelamento de penalidade de posição",
          );

          // Buscar dados atualizados da etapa do backend
          console.log(
            "🔄 [PENALTIES TAB] Buscando dados atualizados da etapa...",
          );
          const { StageService } = await import("@/lib/services/stage.service");
          const updatedStage = await StageService.getById(
            penaltyToCancel.stageId,
          );
          if (updatedStage) {
            // Atualizar etapa no contexto com dados mais recentes
            await updateStage(penaltyToCancel.stageId, updatedStage);
            console.log(
              "✅ Etapa atualizada no contexto com dados mais recentes",
            );
          }

          // Atualizar participações da etapa no contexto
          await refreshStageParticipations(penaltyToCancel.stageId);
          console.log(
            "✅ Participações da etapa atualizadas após cancelamento de penalidade de posição",
          );
        } catch (recalcError) {
          console.error(
            "❌ Erro ao recalcular posições após cancelamento de penalidade de posição:",
            recalcError,
          );
          // Não bloquear o sucesso do cancelamento se o recálculo falhar
        }
      }

      setShowCancelDialog(false);
      setPenaltyToCancel(null);
    } catch (err: any) {
      setCancelError(err.message || "Erro ao não aplicar punição");
    } finally {
      setIsCancelling(false);
    }
  };

  const cancelCancelPenalty = () => {
    setShowCancelDialog(false);
    setPenaltyToCancel(null);
    setCancelError(null);
  };

  const handlePenaltyAction = (action: string, penaltyId: string) => {
    const penalty = contextPenalties.find((p) => p.id === penaltyId);
    if (!penalty) return;

    switch (action) {
      case "apply":
        handleApplyPenalty(penalty);
        break;
      case "cancel":
        handleCancelPenalty(penalty);
        break;
      case "delete":
        handleDeletePenalty(penalty);
        break;
      case "appeal":
        setSelectedPenalty(penalty);
        setShowAppealModal(true);
        break;
      case "viewAppeal":
        setPenaltyToViewAppeal(penalty);
        setShowViewAppealModal(true);
        break;
      case "edit":
        handleEditPenalty(penalty);
        break;
      default:
        console.warn("Ação não implementada:", action);
    }
  };

  const handleAppealSubmit = async () => {
    if (!selectedPenalty || !appealReason.trim()) {
      toast.error("Motivo do recurso é obrigatório");
      return;
    }

    try {
      await appealPenalty(selectedPenalty.id, { appealReason });
      toast.success("Recurso enviado com sucesso");
      setShowAppealModal(false);
      setAppealReason("");
      setSelectedPenalty(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar recurso",
      );
    }
  };

  const handleFiltersChange = useCallback(
    (newFilters: FilterValues) => {
      setFilters(newFilters);
      if (!isMobile) {
        pagination.actions.goToFirstPage();
      }
    },
    [isMobile, pagination.actions],
  );

  const handlePageChange = (page: number) =>
    pagination.actions.setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) =>
    pagination.actions.setItemsPerPage(items);

  // Determinar loading e error incluindo contexto
  const isDataLoading =
    contextLoading.penalties ||
    contextLoading.seasons ||
    contextLoading.categories ||
    contextLoading.stages;
  const dataError =
    contextError.penalties ||
    contextError.seasons ||
    contextError.categories ||
    contextError.stages;

  // Mostrar loading primeiro, antes de qualquer outra verificação
  if (filteredPenalties.length === 0 && Object.keys(filters).length === 0) {
    return (
      <div className="space-y-6">
        {/* Título da aba */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Punições</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie as punições aplicadas no campeonato
          </p>
        </div>

        <EmptyState
          icon={AlertTriangle}
          title="Nenhuma punição criada"
          description="Crie a primeira punição para começar a gerenciar as penalidades do campeonato."
          action={{
            label: "Nova Punição",
            onClick: handleAddPenalty,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da aba */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Punições</h2>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie as punições aplicadas no campeonato
        </p>
      </div>

      {/* Header com filtros e ação */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <DynamicFilter
            fields={filterFields}
            onFiltersChange={handleFiltersChange}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Button onClick={handleAddPenalty} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Nova Punição
          </Button>
        </div>
      </div>

      {isMobile ? (
        <>
          <div className="space-y-4">
            {processedPenalties.map((penalty, index) => (
              <div
                key={penalty.id}
                ref={
                  processedPenalties.length === index + 1
                    ? lastPenaltyElementRef
                    : null
                }
              >
                <PenaltyCard
                  penalty={penalty as PenaltyWithSeasonName}
                  onAction={handlePenaltyAction}
                  getPenaltyIcon={getPenaltyIcon}
                  getStatusIcon={getStatusIcon}
                  contextSeasons={contextSeasons}
                  contextCategories={contextCategories}
                  contextStages={contextStages}
                />
              </div>
            ))}
          </div>
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <InlineLoader size="sm" />
            </div>
          )}
          {!loadingMore && !hasMore && processedPenalties.length > 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Fim dos resultados.
            </div>
          )}
        </>
      ) : (
        <Card className="w-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 w-[120px]"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Tipo
                      {sortBy === "type" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 w-[180px]"
                    onClick={() => handleSort("reason")}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Motivo
                      {sortBy === "reason" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[90px]">
                    <div className="flex items-center justify-center gap-2">
                      <UserX className="h-4 w-4" />
                      Piloto
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[80px]">Status</TableHead>
                  <TableHead className="text-center w-[70px]">
                    Bateria
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-center w-[100px]"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      Data
                      {sortBy === "createdAt" && (
                        <span className="text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedPenalties.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhuma punição encontrada com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  processedPenalties.map((penalty) => (
                    <TableRow key={penalty.id} className="hover:bg-muted/50">
                      <TableCell className="py-4 w-[120px]">
                        <div className="flex items-center gap-2">
                          {getPenaltyIcon(penalty.type)}
                          <div>
                            <div className="font-medium text-xs">
                              {PenaltyService.getPenaltyTypeLabel(penalty.type)}
                            </div>
                            {penalty.timePenaltySeconds && (
                              <div className="text-xs text-muted-foreground">
                                {penalty.timePenaltySeconds}s
                              </div>
                            )}
                            {penalty.positionPenalty && (
                              <div className="text-xs text-muted-foreground">
                                {penalty.positionPenalty} pos
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 w-[180px]">
                        <div className="space-y-1">
                          <div
                            className="max-w-[180px] truncate"
                            title={penalty.reason}
                          >
                            {penalty.reason}
                          </div>
                          {/* Informações de contexto em tooltip */}
                          <div className="text-xs text-muted-foreground">
                            {penalty.seasonId && (
                              <span
                                title={
                                  contextSeasons.find(
                                    (s) => s.id === penalty.seasonId,
                                  )?.name || "N/A"
                                }
                              >
                                {contextSeasons.find(
                                  (s) => s.id === penalty.seasonId,
                                )?.name || "N/A"}
                              </span>
                            )}
                            {penalty.categoryId && (
                              <span
                                title={
                                  contextCategories.find(
                                    (c) => c.id === penalty.categoryId,
                                  )?.name || "N/A"
                                }
                              >
                                •{" "}
                                {contextCategories.find(
                                  (c) => c.id === penalty.categoryId,
                                )?.name || "N/A"}
                              </span>
                            )}
                            {penalty.stageId && (
                              <span
                                title={
                                  contextStages.find(
                                    (s) => s.id === penalty.stageId,
                                  )?.name || "N/A"
                                }
                              >
                                •{" "}
                                {contextStages.find(
                                  (s) => s.id === penalty.stageId,
                                )?.name || "N/A"}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4 w-[90px]">
                        <div
                          className="font-medium truncate text-sm"
                          title={formatName(penalty.user?.name || "N/A")}
                        >
                          {formatName(penalty.user?.name || "N/A")}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4 w-[80px]">
                        <Badge
                          className={PenaltyService.getPenaltyStatusColor(
                            penalty.status,
                          )}
                        >
                          {getStatusIcon(penalty.status)}
                          <span className="ml-1 text-xs">
                            {PenaltyService.getPenaltyStatusLabel(
                              penalty.status,
                            )}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4 w-[70px]">
                        <div className="text-xs">
                          {penalty.batteryIndex !== undefined &&
                          penalty.batteryIndex !== null
                            ? `B${penalty.batteryIndex + 1}`
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4 w-[100px]">
                        <div className="text-xs">
                          {formatDate(penalty.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4 w-[60px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {getAvailableActionsForTable(penalty).map(
                              (action) => (
                                <DropdownMenuItem
                                  key={action.key}
                                  onClick={action.onClick}
                                  className={action.className}
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenuItem>
                              ),
                            )}
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

      {/* Modal de confirmação para aplicar punição */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar aplicação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aplicar esta punição?
              <br />
              <strong>Piloto:</strong>{" "}
              {formatName(penaltyToApply?.user?.name || "N/A")}
              <br />
              <strong>Tipo:</strong>{" "}
              {penaltyToApply
                ? PenaltyService.getPenaltyTypeLabel(penaltyToApply.type)
                : "N/A"}
              <br />
              <strong>Motivo:</strong> {penaltyToApply?.reason || "N/A"}
            </DialogDescription>
          </DialogHeader>

          {applyError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao aplicar</AlertTitle>
              <AlertDescription>{applyError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelApplyPenalty}
              disabled={isApplying}
            >
              Cancelar
            </Button>
            <Button onClick={confirmApplyPenalty} disabled={isApplying}>
              {isApplying ? "Aplicando..." : "Aplicar Punição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para não aplicar punição */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar não aplicação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar esta punição como não aplicada?
              <br />
              <strong>Piloto:</strong>{" "}
              {formatName(penaltyToCancel?.user?.name || "N/A")}
              <br />
              <strong>Tipo:</strong>{" "}
              {penaltyToCancel
                ? PenaltyService.getPenaltyTypeLabel(penaltyToCancel.type)
                : "N/A"}
              <br />
              <strong>Motivo:</strong> {penaltyToCancel?.reason || "N/A"}
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao não aplicar</AlertTitle>
              <AlertDescription>{cancelError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelCancelPenalty}
              disabled={isCancelling}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelPenalty}
              disabled={isCancelling}
            >
              {isCancelling ? "Não Aplicando..." : "Não Aplicar Punição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button onClick={handleAppealSubmit}>Enviar Recurso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta punição?
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
              onClick={cancelDeletePenalty}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePenalty}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir Punição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de visualização do motivo do recurso */}
      <Dialog open={showViewAppealModal} onOpenChange={setShowViewAppealModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo do Recurso</DialogTitle>
            <DialogDescription>
              Detalhes do recurso enviado para esta punição.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Piloto</label>
              <p className="text-sm text-muted-foreground">
                {penaltyToViewAppeal?.user?.name || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Punição</label>
              <p className="text-sm text-muted-foreground">
                {penaltyToViewAppeal
                  ? PenaltyService.getPenaltyTypeLabel(penaltyToViewAppeal.type)
                  : "N/A"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Motivo Original</label>
              <p className="text-sm text-muted-foreground">
                {penaltyToViewAppeal?.reason || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Motivo do Recurso</label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {penaltyToViewAppeal?.appealReason || "N/A"}
              </p>
            </div>

            {penaltyToViewAppeal?.appealedByUser && (
              <div>
                <label className="text-sm font-medium">Recorrido por</label>
                <p className="text-sm text-muted-foreground">
                  {penaltyToViewAppeal.appealedByUser.name}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowViewAppealModal(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
