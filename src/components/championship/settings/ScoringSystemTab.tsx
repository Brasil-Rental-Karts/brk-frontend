import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "brk-design-system";
import { Edit, Star, Trash2, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Loading } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ScoringSystem,
  ScoringSystemService,
} from "@/lib/services/scoring-system.service";

interface ScoringSystemTabProps {
  championshipId: string;
}

const SCORING_TEMPLATES = [
  {
    label: "Kart Brasileiro",
    positions: [
      { position: 1, points: 20 },
      { position: 2, points: 17 },
      { position: 3, points: 15 },
      { position: 4, points: 13 },
      { position: 5, points: 11 },
      { position: 6, points: 10 },
      { position: 7, points: 9 },
      { position: 8, points: 8 },
      { position: 9, points: 7 },
      { position: 10, points: 6 },
      { position: 11, points: 5 },
      { position: 12, points: 4 },
      { position: 13, points: 3 },
      { position: 14, points: 2 },
      { position: 15, points: 1 },
    ],
  },
  {
    label: "Top 5",
    positions: [
      { position: 1, points: 5 },
      { position: 2, points: 4 },
      { position: 3, points: 3 },
      { position: 4, points: 2 },
      { position: 5, points: 1 },
    ],
  },
];

/**
 * Aba de gerenciamento de sistemas de pontuação do campeonato
 */
export const ScoringSystemTab = ({ championshipId }: ScoringSystemTabProps) => {
  // Usar o contexto de dados do campeonato
  const {
    getScoringSystems,
    updateScoringSystem,
    removeScoringSystem,
    refreshScoringSystems,
    loading: contextLoading,
    error: contextError,
  } = useChampionshipData();

  const [scoringSystems, setScoringSystems] = useState<ScoringSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Estados para modal de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSystem, setDeletingSystem] = useState<ScoringSystem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Ref para o container de posições
  const positionsContainerRef = useRef<HTMLDivElement>(null);
  const [previousPositionsCount, setPreviousPositionsCount] = useState(0);

  // Carregar sistemas de pontuação do contexto
  const loadScoringSystems = useCallback(() => {
    try {
      setError(null);
      const data = getScoringSystems();
      setScoringSystems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getScoringSystems]);

  // Atualizar scoring systems quando o contexto mudar
  useEffect(() => {
    const data = getScoringSystems();
    setScoringSystems(data);
    setLoading(false);
  }, [getScoringSystems]);

  // Alternar status ativo
  const toggleActive = async (system: ScoringSystem) => {
    // Verificar se está tentando desativar o último sistema ativo
    const activeSystems = scoringSystems.filter((s) => s.isActive);
    if (system.isActive && activeSystems.length <= 1) {
      setError(
        "Não é possível desativar o último sistema de pontuação ativo. Pelo menos um sistema deve permanecer ativo.",
      );
      return;
    }

    try {
      setError(null);
      const updatedSystem = await ScoringSystemService.toggleActive(
        system.id,
        championshipId,
      );
      // Atualizar o contexto com o sistema atualizado
      updateScoringSystem(system.id, updatedSystem);
      refreshScoringSystems(); // Refresh the list to reflect the change
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Definir como padrão
  const setDefault = async (system: ScoringSystem) => {
    try {
      setError(null);
      const updatedSystem = await ScoringSystemService.setDefault(
        system.id,
        championshipId,
      );
      // Atualizar o contexto com o sistema atualizado
      updateScoringSystem(system.id, updatedSystem);
      refreshScoringSystems(); // Refresh the list to reflect the change
      toast.success("Sistema de pontuação definido como padrão.", {
        description:
          "O sistema de pontuação foi definido como padrão com sucesso.",
      });
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao definir sistema de pontuação como padrão.", {
        description: err.message,
      });
    }
  };

  // Excluir sistema de pontuação
  const deleteSystem = async () => {
    if (!deletingSystem) return;

    try {
      setIsDeleting(true);
      setError(null);
      await ScoringSystemService.delete(deletingSystem.id, championshipId);
      // Remover o sistema do contexto
      removeScoringSystem(deletingSystem.id);
      setShowDeleteDialog(false);
      setDeletingSystem(null);
      toast.success("Sistema de pontuação excluído com sucesso!");
      refreshScoringSystems(); // Refresh the list to reflect the change
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao excluir sistema de pontuação.", {
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handlers do formulário
  const handleCreateNew = () => {
    navigate(`/championship/${championshipId}/scoring-system/create`);
  };

  const handleEdit = (system: ScoringSystem) => {
    navigate(
      `/championship/${championshipId}/scoring-system/${system.id}/edit`,
    );
  };

  const handleDeleteClick = (system: ScoringSystem) => {
    setDeletingSystem(system);
    setShowDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingSystem(null);
  };

  // Buscar dados ao montar
  useEffect(() => {
    loadScoringSystems();
  }, [loadScoringSystems]);

  // Renderizar o resumo de pontos
  const renderPointsSummary = (system: ScoringSystem) => {
    const positions = system.positions.slice(0, 5);
    return positions
      .map((pos) => `${pos.position}º: ${pos.points}pts`)
      .join(", ");
  };

  // Usar loading do contexto se disponível
  const isLoading = contextLoading.scoringSystems || loading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading
          type="spinner"
          size="sm"
          message="Carregando sistemas de pontuação..."
        />
      </div>
    );
  }

  if (error || contextError.scoringSystems) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error || contextError.scoringSystems}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-auto p-1 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (scoringSystems.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Trophy}
          title="Nenhum sistema de pontuação configurado"
          description="Crie seu primeiro sistema de pontuação para definir como os pontos serão distribuídos nas corridas."
          action={{
            label: "Criar Sistema Personalizado",
            onClick: handleCreateNew,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div
        className={isMobile ? "space-y-4" : "flex items-center justify-between"}
      >
        <div>
          <h2 className="text-2xl font-bold">Sistemas de Pontuação</h2>
          <p className="text-muted-foreground">
            Configure como os pontos serão distribuídos nas corridas do
            campeonato
          </p>
        </div>
        <div className={isMobile ? "w-full" : "flex gap-2"}>
          <Button
            onClick={handleCreateNew}
            className={isMobile ? "w-full" : ""}
          >
            Adicionar Sistema de Pontuação
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de sistemas */}
      <div className="grid gap-4">
        {scoringSystems.map((system) => (
          <Card
            key={system.id}
            className={`${!system.isActive ? "opacity-60" : ""}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{system.name}</CardTitle>
                    {!system.isActive && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(system)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar sistema</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(system)}
                          disabled={scoringSystems.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {scoringSystems.length <= 1
                          ? "Não é possível excluir o último sistema"
                          : "Excluir sistema"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pontuação por posição */}
                <div>
                  <h4 className="font-medium mb-2">Pontuação por posição:</h4>
                  <div className="text-sm text-muted-foreground">
                    {renderPointsSummary(system)}
                    {system.positions.length > 5 &&
                      ` ... (${system.positions.length} posições)`}
                  </div>
                </div>

                {/* Pontos extras */}
                <div
                  className={`${isMobile ? "space-y-2" : "grid grid-cols-2 gap-4"} text-sm`}
                >
                  <div>
                    <span className="font-medium">Pole Position: </span>
                    <span className="text-muted-foreground">
                      {system.polePositionPoints} pts
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Volta Mais Rápida: </span>
                    <span className="text-muted-foreground">
                      {system.fastestLapPoints} pts
                    </span>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={system.isActive}
                        onCheckedChange={() => toggleActive(system)}
                        disabled={
                          system.isActive &&
                          scoringSystems.filter((s) => s.isActive).length <= 1
                        }
                      />
                      Sistema ativo
                    </label>
                  </div>
                  <div className="flex gap-2">
                    {system.isDefault ? (
                      <Badge variant="default">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    ) : (
                      system.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefault(system)}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Definir como Padrão
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Excluir "{deletingSystem?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSystem}
              disabled={isDeleting}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
