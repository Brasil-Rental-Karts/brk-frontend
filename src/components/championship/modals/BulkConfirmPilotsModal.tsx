import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "brk-design-system";
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Loader2,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Loading } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import {
  BulkCancelParticipationData,
  BulkConfirmParticipationData,
  StageParticipationService,
} from "@/lib/services/stage-participation.service";
import { formatName } from "@/utils/name";

interface BulkConfirmPilotsModalProps {
  stageId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PilotCard {
  userId: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  isConfirmed: boolean;
  isSelected: boolean;
  paymentStatus: string;
}

export const BulkConfirmPilotsModal: React.FC<BulkConfirmPilotsModalProps> = ({
  stageId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pilots, setPilots] = useState<PilotCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"confirm" | "cancel">("confirm");
  const [searchTerm, setSearchTerm] = useState("");

  // Usar o contexto de dados do campeonato
  const {
    getCategories,
    getRegistrations,
    getStages,
    getStageParticipations,
    refreshStageParticipations,
  } = useChampionshipData();

  const loadPilots = () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados do contexto
      const allCategories = getCategories();
      const allRegistrations = getRegistrations();
      const allStages = getStages();
      const stageParticipations = getStageParticipations(stageId);

      // Buscar a etapa selecionada
      const selectedStage = allStages.find(
        (stage: any) => stage.id === stageId,
      );
      if (!selectedStage) {
        setError("Etapa não encontrada");
        return;
      }

      // Filtrar categorias que estão disponíveis na etapa
      const stageCategories = allCategories.filter((category) =>
        selectedStage.categoryIds.includes(category.id),
      );

      // Filtrar registrations da temporada da etapa
      const stageRegistrations = allRegistrations.filter(
        (reg) => reg.season.id === selectedStage.seasonId,
      );

      const pilotCards: PilotCard[] = [];

      // Para cada categoria da etapa, buscar pilotos inscritos
      stageCategories.forEach((category) => {
        const categoryPilots = stageRegistrations.filter((reg) =>
          reg.categories.some((rc: any) => rc.category.id === category.id),
        );

        categoryPilots.forEach((registration) => {
          const isConfirmed = stageParticipations.some(
            (part) =>
              part.userId === registration.userId &&
              part.categoryId === category.id &&
              part.status === "confirmed",
          );

          pilotCards.push({
            userId: registration.userId,
            userName: registration.user?.name || registration.userId,
            categoryId: category.id,
            categoryName: category.name,
            isConfirmed,
            isSelected: false, // Não selecionar por padrão
            paymentStatus: registration.paymentStatus,
          });
        });
      });

      setPilots(pilotCards);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar pilotos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && stageId) {
      loadPilots();
    }
  }, [isOpen, stageId]);

  // Limpar campo de pesquisa quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setActiveTab("confirm");
    }
  }, [isOpen]);

  const togglePilotSelection = (userId: string, categoryId: string) => {
    setPilots((prev) =>
      prev.map((pilot) =>
        pilot.userId === userId && pilot.categoryId === categoryId
          ? { ...pilot, isSelected: !pilot.isSelected }
          : pilot,
      ),
    );
  };

  const selectAll = () => {
    const filteredPilots = getFilteredPilots();
    setPilots((prev) =>
      prev.map((pilot) => ({
        ...pilot,
        isSelected: filteredPilots.some(
          (fp) =>
            fp.userId === pilot.userId && fp.categoryId === pilot.categoryId,
        ),
      })),
    );
  };

  const deselectAll = () => {
    setPilots((prev) =>
      prev.map((pilot) => ({
        ...pilot,
        isSelected: false,
      })),
    );
  };

  const getSelectedPilots = () => {
    if (activeTab === "confirm") {
      return pilots.filter((pilot) => pilot.isSelected && !pilot.isConfirmed);
    } else {
      return pilots.filter((pilot) => pilot.isSelected && pilot.isConfirmed);
    }
  };

  const getFilteredPilots = () => {
    let filteredPilots;
    if (activeTab === "confirm") {
      filteredPilots = pilots.filter((pilot) => !pilot.isConfirmed);
    } else {
      filteredPilots = pilots.filter((pilot) => pilot.isConfirmed);
    }

    // Filtrar por termo de pesquisa
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredPilots = filteredPilots.filter(
        (pilot) =>
          formatName(pilot.userName).toLowerCase().includes(searchLower) ||
          pilot.categoryName.toLowerCase().includes(searchLower),
      );
    }

    // Ordenar por nome do piloto
    return filteredPilots.sort((a, b) =>
      formatName(a.userName).localeCompare(formatName(b.userName)),
    );
  };

  const handleSave = async () => {
    const selectedPilots = getSelectedPilots();

    if (selectedPilots.length === 0) {
      toast.error(
        `Selecione pelo menos um piloto para ${activeTab === "confirm" ? "confirmar" : "cancelar"}`,
      );
      return;
    }

    // Motivo é opcional para cancelamento

    try {
      setSaving(true);

      if (activeTab === "confirm") {
        const data: BulkConfirmParticipationData = {
          stageId,
          confirmations: selectedPilots.map((pilot) => ({
            userId: pilot.userId,
            categoryId: pilot.categoryId,
          })),
        };

        const response =
          await StageParticipationService.bulkConfirmParticipation(data);

        if (response.errors.length > 0) {
          toast.warning(
            `${response.data.length} pilotos confirmados com sucesso, ${response.errors.length} com erro`,
          );
        } else {
          toast.success(
            `${response.data.length} pilotos confirmados com sucesso!`,
          );
        }
      } else {
        const data: BulkCancelParticipationData = {
          stageId,
          cancellations: selectedPilots.map((pilot) => ({
            userId: pilot.userId,
            categoryId: pilot.categoryId,
            reason: "Cancelado pelo administrador",
          })),
        };

        const response =
          await StageParticipationService.bulkCancelParticipation(data);

        if (response.errors.length > 0) {
          toast.warning(
            `${response.data.length} pilotos cancelados com sucesso, ${response.errors.length} com erro`,
          );
        } else {
          toast.success(
            `${response.data.length} pilotos cancelados com sucesso!`,
          );
        }
      }

      // Atualizar dados no contexto
      await refreshStageParticipations(stageId);

      // Fechar modal e chamar callback de sucesso
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.message ||
          `Erro ao ${activeTab === "confirm" ? "confirmar" : "cancelar"} pilotos`,
      );
    } finally {
      setSaving(false);
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "failed":
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Estornado
          </Badge>
        );
      case "exempt":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Isento
          </Badge>
        );
      case "direct_payment":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pagamento Direto
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {paymentStatus}
          </Badge>
        );
    }
  };

  const selectedCount = getSelectedPilots().length;
  const filteredPilots = getFilteredPilots();
  const confirmedCount = pilots.filter((p) => p.isConfirmed).length;
  const totalCount = pilots.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
              <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Participações na Etapa
          </DialogTitle>
          <DialogDescription>
            Confirme ou cancele a participação dos pilotos nesta etapa
          </DialogDescription>
        </DialogHeader>

        {/* Loading Overlay - Cobre todo o modal */}
        {saving && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
            <Loading type="spinner" size="md" message="" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              !saving && setActiveTab(value as "confirm" | "cancel")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="confirm"
                className="flex items-center gap-2"
                disabled={saving}
              >
                <Check className="h-4 w-4" />
                Confirmar Participação
              </TabsTrigger>
              <TabsTrigger
                value="cancel"
                className="flex items-center gap-2"
                disabled={saving}
              >
                <X className="h-4 w-4" />
                Cancelar Participação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="confirm" className="space-y-4">
              {/* Campo de pesquisa */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por nome do piloto ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={saving}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {selectedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selecionados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {confirmedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confirmados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {filteredPilots.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {searchTerm ? "Filtrados" : "Não Confirmados"}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={saving}
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={saving}
                >
                  Desmarcar Todos
                </Button>
              </div>

              {/* Lista de pilotos */}
              {loading ? (
                <Loading
                  type="spinner"
                  size="md"
                  message="Carregando pilotos..."
                />
              ) : error ? (
                <div className="text-red-600 p-4 text-center">{error}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPilots.map((pilot) => (
                    <Card
                      key={`${pilot.userId}-${pilot.categoryId}`}
                      className={`cursor-pointer transition-all ${
                        pilot.isSelected
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        !saving &&
                        togglePilotSelection(pilot.userId, pilot.categoryId)
                      }
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">
                              {formatName(pilot.userName)}
                            </div>
                            {pilot.isSelected ? (
                              <Badge
                                variant="default"
                                className="bg-primary text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Selecionado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <UserX className="h-3 w-3 mr-1" />
                                Não Confirmado
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {pilot.categoryName}
                            </div>
                            {getPaymentStatusBadge(pilot.paymentStatus)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredPilots.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? "Nenhum piloto encontrado com essa pesquisa"
                    : "Nenhum piloto não confirmado encontrado"}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancel" className="space-y-4">
              {/* Campo de pesquisa */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por nome do piloto ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={saving}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selecionados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredPilots.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {searchTerm ? "Filtrados" : "Confirmados"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {totalCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={saving}
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={saving}
                >
                  Desmarcar Todos
                </Button>
              </div>

              {/* Lista de pilotos */}
              {loading ? (
                <Loading
                  type="spinner"
                  size="md"
                  message="Carregando pilotos..."
                />
              ) : error ? (
                <div className="text-red-600 p-4 text-center">{error}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPilots.map((pilot) => (
                    <Card
                      key={`${pilot.userId}-${pilot.categoryId}`}
                      className={`cursor-pointer transition-all ${
                        pilot.isSelected
                          ? "bg-red-50 border-red-200"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        !saving &&
                        togglePilotSelection(pilot.userId, pilot.categoryId)
                      }
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">
                              {formatName(pilot.userName)}
                            </div>
                            {pilot.isSelected ? (
                              <Badge
                                variant="default"
                                className="bg-red-500 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Selecionado
                              </Badge>
                            ) : (
                              <Badge
                                variant="default"
                                className="bg-green-500 text-xs"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Confirmado
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {pilot.categoryName}
                            </div>
                            {getPaymentStatusBadge(pilot.paymentStatus)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredPilots.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? "Nenhum piloto encontrado com essa pesquisa"
                    : "Nenhum piloto confirmado encontrado"}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedCount === 0}
            variant={activeTab === "cancel" ? "destructive" : "default"}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {activeTab === "confirm" ? "Confirmando..." : "Cancelando..."}
              </>
            ) : (
              <>
                {activeTab === "confirm" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar {selectedCount} Piloto
                    {selectedCount !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar {selectedCount} Piloto
                    {selectedCount !== 1 ? "s" : ""}
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
