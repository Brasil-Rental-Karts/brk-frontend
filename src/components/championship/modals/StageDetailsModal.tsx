import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import {
  Calendar,
  Check,
  Clock,
  Link as LinkIcon,
  MapPin,
  Navigation,
  Trophy,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Loading } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { StageService } from "@/lib/services/stage.service";
import { Stage } from "@/lib/types/stage";
import { formatName } from "@/utils/name";

interface StageDetailsModalProps {
  stage: Stage | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PilotInfo {
  id: string;
  userId: string;
  user: any;
  categoryId: string;
  status: "confirmed" | "not_confirmed";
  confirmedAt?: string | null;
}

interface CategoryWithParticipants {
  id: string;
  name: string;
  ballast: number;
  participants: PilotInfo[];
  totalRegistered: number;
}

export const StageDetailsModal = ({
  stage,
  isOpen,
  onClose,
}: StageDetailsModalProps) => {
  const [categories, setCategories] = useState<CategoryWithParticipants[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raceTrack, setRaceTrack] = useState<any>(null);

  // Estado para controlar o modal de link de confirmação
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkModalData, setLinkModalData] = useState<{
    pilotName: string;
    stageName: string;
    link: string;
  } | null>(null);

  // Usar o contexto de dados do campeonato
  const {
    getCategories,
    getRaceTracks,
    getRegistrations,
    getStageParticipations,
    getChampionshipInfo,
  } = useChampionshipData();

  const fetchStageDetails = async (stageId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Usar kartódromos do contexto em vez de buscar novamente
      const allRaceTracks = getRaceTracks();
      if (stage?.raceTrackId && allRaceTracks[stage.raceTrackId]) {
        setRaceTrack(allRaceTracks[stage.raceTrackId]);
      }

      // Usar categorias do contexto em vez de buscar novamente
      const allCategories = getCategories();

      // Filtrar apenas as categorias que estão na etapa
      const stageCategories = allCategories.filter((category) =>
        stage?.categoryIds.includes(category.id),
      );

      // Usar inscrições do contexto em vez de buscar do backend
      const allRegistrations = getRegistrations();
      const seasonRegistrations = allRegistrations.filter(
        (reg) => reg.seasonId === stage!.seasonId,
      );

      // Usar participações do contexto em vez de buscar do backend
      const stageParticipations = getStageParticipations(stageId);

      // Organizar pilotos por categoria usando a mesma lógica do RaceDayTab
      const categoriesWithParticipants: CategoryWithParticipants[] =
        stageCategories.map((category) => {
          // Filtrar inscrições que incluem esta categoria (mesma lógica do RaceDayTab)
          const categoryPilots = seasonRegistrations.filter((reg) =>
            reg.categories.some((rc: any) => rc.category.id === category.id),
          );

          // Filtrar participações confirmadas desta categoria (mesma lógica do RaceDayTab)
          const confirmedParticipations = stageParticipations.filter(
            (participation) => participation.categoryId === category.id,
          );

          // Criar lista de todos os pilotos (confirmados e não confirmados)
          const allPilots: PilotInfo[] = categoryPilots.map((registration) => {
            const isConfirmed = confirmedParticipations.some(
              (participation) => participation.userId === registration.userId,
            );

            return {
              id: registration.id,
              userId: registration.userId,
              user: registration.user,
              categoryId: category.id,
              status: isConfirmed ? "confirmed" : "not_confirmed",
              confirmedAt: isConfirmed
                ? confirmedParticipations.find(
                    (p) => p.userId === registration.userId,
                  )?.confirmedAt
                : null,
            };
          });

          return {
            id: category.id,
            name: category.name,
            ballast: category.ballast,
            participants: allPilots,
            totalRegistered: allPilots.length,
          };
        });

      setCategories(categoriesWithParticipants);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar detalhes da etapa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage && isOpen) {
      fetchStageDetails(stage.id);
    }
  }, [stage, isOpen]);

  const getStatusBadge = (pilot: PilotInfo) => {
    if (pilot.status === "confirmed") {
      return (
        <Badge variant="default" className="bg-green-500 text-xs">
          <Check className="h-3 w-3 mr-1" />
          Confirmado
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Não Confirmado
        </Badge>
      );
    }
  };

  const formatDateTime = (date: string, time: string) => {
    return `${StageService.formatDate(date)} às ${StageService.formatTime(time)}`;
  };

  if (!stage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {stage.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes da etapa e participações por categoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da etapa */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Informações da Etapa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(stage.date, stage.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{raceTrack?.name || "Carregando..."}</span>
              </div>
              {raceTrack?.address && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    {raceTrack.address}
                  </span>
                </div>
              )}
              {stage.trackLayoutId && stage.trackLayoutId !== "undefined" && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Traçado: {stage.trackLayoutId}
                  </span>
                </div>
              )}
              {stage.doublePoints && (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Pontuação em Dobro</Badge>
                </div>
              )}
              {stage.streamLink && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={stage.streamLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Link da Transmissão
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Participações por categoria */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participações por Categoria
            </h3>

            {loading ? (
              <div className="space-y-4">
                <Loading type="spinner" size="md" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar participações</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : categories.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">
                  Nenhuma categoria encontrada
                </h4>
                <p className="text-sm text-muted-foreground">
                  Esta etapa não possui categorias configuradas.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        {category.name}
                        <Badge variant="outline" className="text-xs">
                          Lastro: {category.ballast}kg
                        </Badge>
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {category.totalRegistered}{" "}
                        {category.totalRegistered === 1 ? "piloto" : "pilotos"}
                      </Badge>
                    </div>

                    {category.participants.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Nenhum piloto registrado nesta categoria
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {category.participants.map((pilot) => (
                          <div
                            key={pilot.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">
                                  {formatName(pilot.user.name)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {pilot.user.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {pilot.status === "confirmed" ? (
                                getStatusBadge(pilot)
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const siteUrl = window.location.origin;
                                    const link = `${siteUrl}/confirm-participation/stage/${stage.id}/category/${category.id}`;
                                    setLinkModalData({
                                      pilotName: pilot.user.name,
                                      stageName: stage.name,
                                      link,
                                    });
                                    setShowLinkModal(true);
                                  }}
                                >
                                  Gerar Link de Confirmação
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Modal de link de confirmação */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convite para confirmação de participação</DialogTitle>
            {/* DialogDescription removido conforme solicitado */}
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* Mensagem personalizada para WhatsApp */}
            <label className="text-sm font-medium">
              Mensagem para WhatsApp:
            </label>
            <textarea
              className="w-full p-2 rounded border bg-muted/50 font-sans text-sm resize-none"
              rows={5}
              value={
                linkModalData
                  ? (() => {
                      const championshipName =
                        getChampionshipInfo()?.name || "";
                      const championshipHashtag = championshipName.replace(
                        /\s+/g,
                        "",
                      );
                      return `Olá ${formatName(linkModalData.pilotName)} 🏎️\n\n🏁 Você está convocado(a) para acelerar na etapa "${linkModalData.stageName}" do campeonato ${championshipName}!\n\n⏱️ Confirme sua presença no grid pelo link abaixo:\n${linkModalData.link}\n\nNos vemos na pista! 🏆\n\n#BRK #Kart #Corrida #${championshipHashtag}`;
                    })()
                  : ""
              }
              readOnly
              id="whatsapp-message-textarea"
              onFocus={(e) => e.target.select()}
            />
          </div>
          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button onClick={() => setShowLinkModal(false)} variant="outline">
              Fechar
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                if (linkModalData) {
                  const championshipName = getChampionshipInfo()?.name || "";
                  const championshipHashtag = championshipName.replace(
                    /\s+/g,
                    "",
                  );
                  const msg = `Olá ${formatName(linkModalData.pilotName)} 🏎️\n\n🏁 Você está convocado(a) para acelerar na etapa \"${linkModalData.stageName}\" do campeonato ${championshipName}!\n\n⏱️ Confirme sua presença no grid pelo link abaixo:\n${linkModalData.link}\n\nNos vemos na pista! 🏆\n\n#BRK #Kart #Corrida #${championshipHashtag}`;
                  navigator.clipboard.writeText(msg);
                  toast.success("Mensagem copiada!");
                }
              }}
            >
              Copiar mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
