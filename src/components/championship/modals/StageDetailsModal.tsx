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
import { ShortioService } from "@/lib/services/shortio.service";
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
  inscriptionType: "por_temporada" | "por_etapa";
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
  const [shortenedLinks, setShortenedLinks] = useState<{[key: string]: string}>({});
  const [isShorteningLinks, setIsShorteningLinks] = useState(false);

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
          // Filtrar inscrições que incluem esta categoria
          let categoryPilots = seasonRegistrations.filter((reg) =>
            reg.categories.some((rc: any) => rc.category.id === category.id),
          );

          // Filtrar por tipo de inscrição:
          // - Para inscrições por_temporada: incluir todos os pilotos inscritos na temporada
          // - Para inscrições por_etapa: incluir apenas pilotos inscritos especificamente nesta etapa
          categoryPilots = categoryPilots.filter((reg) => {
            if (reg.inscriptionType === "por_temporada") {
              // Inscrição por temporada: incluir todos os pilotos
              return true;
            } else if (reg.inscriptionType === "por_etapa") {
              // Inscrição por etapa: verificar se o piloto está inscrito nesta etapa específica
              return reg.stages && reg.stages.some((stage: any) => stage.stageId === stageId);
            }
            return false;
          });

          // Filtrar participações confirmadas desta categoria
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
              inscriptionType: registration.inscriptionType,
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

  useEffect(() => {
    if (categories.length > 0 && stage) {
      generateShortenedLinks(stage.id, categories);
    }
  }, [categories, stage]);

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

  const shortenUrl = async (originalUrl: string, title: string): Promise<string> => {
    try {
      const result = await ShortioService.shortenUrlWithDuplicateCheck({
        url: originalUrl,
        title: title,
        tags: ['brk', 'confirmation', 'stage']
      });
      return result.shortURL;
    } catch (error) {
      console.error('Error shortening URL:', error);
      // Fallback para URL original se falhar
      return originalUrl;
    }
  };

  const generateShortenedLinks = async (stageId: string, categories: CategoryWithParticipants[]) => {
    setIsShorteningLinks(true);
    try {
      const siteUrl = window.location.origin;
      const links: {[key: string]: string} = {};
      
      // Encurtar links para cada categoria individual
      for (const category of categories) {
        const categoryUrl = `${siteUrl}/confirm-participation/stage/${stageId}/category/${category.id}`;
        links[category.id] = await shortenUrl(categoryUrl, `BRK - Confirmação ${category.name}`);
      }
      
      setShortenedLinks(links);
    } catch (error) {
      console.error('Error generating shortened links:', error);
      toast.error('Erro ao encurtar links. Usando URLs originais.');
    } finally {
      setIsShorteningLinks(false);
    }
  };

  if (!stage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(stage.date, stage.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{raceTrack?.name || "Carregando..."}</span>
              </div>
              {raceTrack?.address && (
                <div className="flex items-start gap-2 lg:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    {raceTrack.address}
                  </span>
                </div>
              )}
              {stage.trackLayoutId && stage.trackLayoutId !== "undefined" && (
                <div className="flex items-center gap-2 lg:col-span-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participações por Categoria
              </h3>
                                                    <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isShorteningLinks}
                onClick={() => {
                  setLinkModalData({
                    pilotName: "Todas as Categorias",
                    stageName: stage.name,
                    link: "", // Não precisamos de link único, usaremos os links individuais
                  });
                  setShowLinkModal(true);
                }}
              >
                {isShorteningLinks ? "Gerando..." : "Mensagem de Confirmação para Todas as Categorias"}
              </Button>
            </div>

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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h4 className="font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
                        <span>{category.name}</span>
                        <Badge variant="outline" className="text-xs w-fit">
                          Lastro: {category.ballast}kg
                        </Badge>
                      </h4>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Badge variant="secondary" className="text-xs w-fit">
                          {category.totalRegistered}{" "}
                          {category.totalRegistered === 1 ? "piloto" : "pilotos"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                          disabled={isShorteningLinks}
                          onClick={() => {
                            const link = shortenedLinks[category.id] || `${window.location.origin}/confirm-participation/stage/${stage.id}/category/${category.id}`;
                            setLinkModalData({
                              pilotName: `${category.name} - Todos os pilotos`,
                              stageName: stage.name,
                              link,
                            });
                            setShowLinkModal(true);
                          }}
                        >
                          {isShorteningLinks ? "Gerando..." : "Mensagem de Confirmação"}
                        </Button>
                      </div>
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
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex flex-col gap-2">
                              <div>
                                <p className="font-medium">
                                  {formatName(pilot.user.name)}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    {pilot.user.email}
                                  </p>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs w-fit"
                                  >
                                    {pilot.inscriptionType === "por_temporada" ? "Por Temporada" : "Por Etapa"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              {pilot.status === "confirmed" ? (
                                getStatusBadge(pilot)
                              ) : (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Não Confirmado
                                </Badge>
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
        <DialogContent className="max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Convite para confirmação de participação - Categoria</DialogTitle>
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
                      
                      if (linkModalData.pilotName === "Todas as Categorias") {
                        const categoryLinks = categories.map(category => {
                          const link = shortenedLinks[category.id] || `${window.location.origin}/confirm-participation/stage/${stage.id}/category/${category.id}`;
                          return `Piloto da ${category.name} - Confirmo minha presença:\n👉 ${link}`;
                        }).join('\n\n');
                        
                        return `🏁 CONVOCAÇÃO GERAL PILOTOS DE TODAS AS CATEGORIAS - ${championshipName.toUpperCase()} 🏁\n\n🔥 A PRÓXIMA ETAPA ESTÁ CHEGANDO 🔥\n\n📅 Etapa: ${linkModalData.stageName} no dia ${formatDateTime(stage.date, stage.time)}\n\n🎯 Confirmem suas presenças no grid:\n\n${categoryLinks}\n\n💪 A COMPETIÇÃO ESTÁ ACIRRADA! QUEM VAI DOMINAR ESTA ETAPA?\n\n#BRK #Kart #Corrida #${championshipHashtag}`;
                      } else {
                        const categoryName = linkModalData.pilotName.replace(" - Todos os pilotos", "");
                        // Encontrar a categoria correspondente para obter o link encurtado
                        const category = categories.find(cat => cat.name === categoryName);
                        const shortenedLink = category ? shortenedLinks[category.id] : linkModalData.link;
                        return `🏎️ PILOTOS DA ${categoryName.toUpperCase()} 🏎️\n\n🏁 É HORA DE ACELERAR! 🏁\n\nVocês estão convocados para a próxima etapa do ${championshipName}!\n\n📅 Etapa: ${linkModalData.stageName} no dia ${formatDateTime(stage.date, stage.time)}\n\n⚡ Confirmem suas presenças no grid:\n${shortenedLink}\n\n🚀 Preparem-se para a disputa! 🚀\n\n#BRK #Kart #Corrida #${championshipHashtag} #${categoryName.replace(/\s+/g, "")}`;
                      }
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
                  
                  let msg = "";
                  if (linkModalData.pilotName === "Todas as Categorias") {
                    const categoryLinks = categories.map(category => {
                      const link = shortenedLinks[category.id] || `${window.location.origin}/confirm-participation/stage/${stage.id}/category/${category.id}`;
                      return `Piloto da ${category.name} - Confirmo minha presença:\n👉 ${link}`;
                    }).join('\n\n');
                    
                    msg = `🏁 CONVOCAÇÃO GERAL PILOTOS DE TODAS AS CATEGORIAS - ${championshipName.toUpperCase()} 🏁\n\n🔥 A PRÓXIMA ETAPA ESTÁ CHEGANDO 🔥\n\n📅 Etapa: ${linkModalData.stageName} no dia ${formatDateTime(stage.date, stage.time)}\n\n🎯 Confirmem suas presenças no grid:\n\n${categoryLinks}\n\n💪 A COMPETIÇÃO ESTÁ ACIRRADA! QUEM VAI DOMINAR ESTA ETAPA?\n\n#BRK #Kart #Corrida #${championshipHashtag}`;
                  } else {
                    const categoryName = linkModalData.pilotName.replace(" - Todos os pilotos", "");
                    // Encontrar a categoria correspondente para obter o link encurtado
                    const category = categories.find(cat => cat.name === categoryName);
                    const shortenedLink = category ? shortenedLinks[category.id] : linkModalData.link;
                    msg = `🏎️ PILOTOS DA ${categoryName.toUpperCase()} 🏎️\n\n🏁 É HORA DE ACELERAR! 🏁\n\nVocês estão convocados para a próxima etapa do ${championshipName}!\n\n📅 Etapa: ${linkModalData.stageName} no dia ${formatDateTime(stage.date, stage.time)}\n\n⚡ Confirmem suas presenças no grid:\n${shortenedLink}\n\n🚀 Preparem-se para a disputa! 🚀\n\n#BRK #Kart #Corrida #${championshipHashtag} #${categoryName.replace(/\s+/g, "")}`;
                  }
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
