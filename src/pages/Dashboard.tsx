import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  EmptyState,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "brk-design-system";
import { Calendar, Clock, Flag, MapPin, Navigation, PlusCircle, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";

import { CompleteProfileModal } from "@/components/profile/CompleteProfileModal";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { useProfileCompletion } from "@/hooks/use-profile-completion";
import { useNavigation } from "@/router";
import { formatDateToBrazilian } from "@/utils/date";
import { SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { StageService } from "@/lib/services/stage.service";
import { SeasonService } from "@/lib/services/season.service";
import { StageParticipationService } from "@/lib/services/stage-participation.service";

export const Dashboard = () => {
  const nav = useNavigation();
  const { user } = useAuth();
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const [showCompleteProfileModal, setShowCompleteProfileModal] =
    useState(false);
  const [buttonLoading, setButtonLoading] = useState<Record<string, boolean>>({});
  const [confirmedOverrides, setConfirmedOverrides] = useState<Record<string, boolean | undefined>>({});
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState<boolean>(false);
  const [orgPage, setOrgPage] = useState<number>(1);
  const [partPage, setPartPage] = useState<number>(1);
  const [racesPage, setRacesPage] = useState<number>(1);
  const ORG_PER_PAGE = 3;
  const PART_PER_PAGE = 3;
  const RACES_PER_PAGE = 3;

  // Check if user is manager or administrator
  const isManager = user?.role === "Manager" || user?.role === "Administrator";

  // Use Dashboard context
  const {
    championshipsOrganized,
    championshipsParticipating,
    upcomingRaces,
    userStats,
    raceTracks,
    loading,
    errors,
    refreshChampionships,
  } = useUser();

  const {
    isProfileCompleted,
    loading: loadingProfile,
    shouldShowModal,
    markAsSkipped,
  } = useProfileCompletion();

  useEffect(() => {
    const redirectUrl = localStorage.getItem("redirectUrl");
    if (redirectUrl) {
      window.location.href = redirectUrl;
      localStorage.removeItem("redirectUrl");
    } else {
      setIsCheckingRedirect(false);
    }
  }, []);

  // Show complete profile modal when profile is not completed and not loading
  useEffect(() => {
    if (!loadingProfile && shouldShowModal && !showCompleteProfileModal) {
      setShowCompleteProfileModal(true);
    }
  }, [shouldShowModal, loadingProfile, showCompleteProfileModal]);

  // Removido: lógica de confirmação/cancelamento de participação

  // Utilitário: localizar entrada da etapa em inscrições "por_etapa"
  const findStageEntry = (regObj: any, stageId: string): any | null => {
    const candidates: any[] = [];
    if (Array.isArray(regObj?.stages)) candidates.push(...regObj.stages);
    if (Array.isArray(regObj?.seasonRegistrationStages))
      candidates.push(...regObj.seasonRegistrationStages);
    if (Array.isArray(regObj?.seasonRegistrationStage))
      candidates.push(...regObj.seasonRegistrationStage);
    if (Array.isArray(regObj?.stageRegistrations))
      candidates.push(...regObj.stageRegistrations);
    const entry = candidates.find((s: any) => {
      const sId = typeof s === "string" ? s : s?.stageId || s?.id || s?.stage?.id;
      return sId === stageId;
    });
    return entry || null;
  };

  const paidFlags = ["paid", "direct_payment", "exempt"] as const;

  const setLoadingKey = (key: string, value: boolean) =>
    setButtonLoading((prev) => ({ ...prev, [key]: value }));

  const markConfirmedLocal = (key: string, isConfirmed: boolean) =>
    setConfirmedOverrides((prev) => ({ ...prev, [key]: isConfirmed }));

  const redirectToSeasonRegistration = async (
    seasonId: string,
    stageId: string,
    categoryId: string,
  ) => {
    try {
      const season = await SeasonService.getById(seasonId);
      if (season?.slug) {
        window.location.href = `/registration/${season.slug}?stageId=${stageId}&categoryId=${categoryId}`;
      } else {
        window.location.href = `/season/${seasonId}/register?stageId=${stageId}&categoryId=${categoryId}`;
      }
    } catch {
      window.location.href = `/season/${seasonId}/register?stageId=${stageId}&categoryId=${categoryId}`;
    }
  };

  const redirectToStageRegistrationPorEtapa = async (
    seasonId: string,
    stageId: string,
    categoryId?: string,
  ) => {
    try {
      const season = await SeasonService.getById(seasonId);
      if (season?.slug) {
        const params = new URLSearchParams({ stageId });
        if (categoryId) params.set("categoryId", categoryId);
        window.location.href = `/registration/${season.slug}/por_etapa?${params.toString()}`;
      } else {
        const params = new URLSearchParams({ stageId });
        if (categoryId) params.set("categoryId", categoryId);
        window.location.href = `/season/${seasonId}/register?${params.toString()}`;
      }
    } catch {
      const params = new URLSearchParams({ stageId });
      if (categoryId) params.set("categoryId", categoryId);
      window.location.href = `/season/${seasonId}/register?${params.toString()}`;
    }
  };

  const handleConfirmParticipation = async (
    stageId: string,
    categoryId: string,
    seasonId?: string,
  ) => {
    const key = `${stageId}:${categoryId}`;
    setLoadingKey(key, true);
    try {
      // Garantir seasonId
      const stage = seasonId ? null : await StageService.getById(stageId);
      const realSeasonId = seasonId || stage?.seasonId;
      if (!realSeasonId) throw new Error("SeasonId não encontrado para a etapa");

      // Buscar inscrições do usuário
      const myRegistrations = await SeasonRegistrationService.getMyRegistrations();
      const registration = myRegistrations.find((r: any) => r.season?.id === realSeasonId);

      // Sem inscrição -> redirecionar para página de inscrição da temporada
      if (!registration) {
        await redirectToSeasonRegistration(realSeasonId, stageId, categoryId);
        return;
      }

      // Regras específicas para inscrição por_etapa
      if (registration.inscriptionType === "por_etapa") {
        const stageEntry = findStageEntry(registration, stageId);

        // Não inclui esta etapa -> redirecionar para inscrição por_etapa
        if (!stageEntry) {
          await redirectToStageRegistrationPorEtapa(realSeasonId, stageId, categoryId);
          return;
        }

        // Determinar status efetivo de pagamento
        let effectivePaymentStatus: string = registration.paymentStatus;
        const stageStatus: any = stageEntry?.paymentStatus || stageEntry?.status;
        const stagePaidBool: any = stageEntry?.paid || stageEntry?.isPaid;
        if (typeof stageStatus === "string") {
          effectivePaymentStatus = stageStatus;
        }
        if (stagePaidBool === true && !stageStatus) {
          effectivePaymentStatus = "paid";
        }

        // Regra: isento por etapa: tratar como pago
        if (stageEntry?.paymentStatus === "exempt") {
          effectivePaymentStatus = "exempt" as any;
        }

        if (!paidFlags.includes(effectivePaymentStatus as any)) {
          // Redireciona para pagamento da inscrição
          window.location.href = `/registration/${registration.id}/payment?stageId=${stageId}&categoryId=${categoryId}`;
          return;
        }
      }

      // Confirma participação
      await StageParticipationService.confirmParticipation({ stageId, categoryId });
      markConfirmedLocal(key, true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;
      if (msg === "Sua participação já foi confirmada para esta etapa") {
        markConfirmedLocal(key, true);
      } else if (msg) {
        // Feedback simples
        console.error(msg);
      }
    } finally {
      setLoadingKey(key, false);
    }
  };

  const handleCancelParticipation = async (
    stageId: string,
    categoryId: string,
  ) => {
    const key = `${stageId}:${categoryId}`;
    setLoadingKey(key, true);
    try {
      await StageParticipationService.cancelParticipation({ stageId, categoryId });
      markConfirmedLocal(key, false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;
      if (msg) console.error(msg);
    } finally {
      setLoadingKey(key, false);
    }
  };

  // Carregar inscrições do usuário para rotulagem dos botões
  useEffect(() => {
    const loadRegs = async () => {
      if (!user) return;
      setLoadingRegistrations(true);
      try {
        const regs = await SeasonRegistrationService.getMyRegistrations();
        setMyRegistrations(regs || []);
      } catch (e) {
        console.warn(e);
        setMyRegistrations([]);
      } finally {
        setLoadingRegistrations(false);
      }
    };
    loadRegs();
  }, [user]);

  // Ajusta página quando a quantidade de corridas futuras muda
  useEffect(() => {
    const total = Math.max(1, Math.ceil(upcomingRaces.length / RACES_PER_PAGE));
    if (racesPage > total) setRacesPage(1);
  }, [upcomingRaces.length]);

  // Ajusta página quando a quantidade de campeonatos organizados muda
  useEffect(() => {
    const total = Math.max(1, Math.ceil(championshipsOrganized.length / ORG_PER_PAGE));
    if (orgPage > total) setOrgPage(1);
  }, [championshipsOrganized.length]);

  // Ajusta página quando a quantidade de campeonatos participando muda
  useEffect(() => {
    const total = Math.max(1, Math.ceil(championshipsParticipating.length / PART_PER_PAGE));
    if (partPage > total) setPartPage(1);
  }, [championshipsParticipating.length]);

  type CategoryActionType =
    | "register_season"
    | "register_stage"
    | "pay"
    | "confirm"
    | "cancel"
    | "checking";

  const getCategoryAction = (
    race: any,
    cat: any,
  ): { type: CategoryActionType; label: string } => {
    const key = `${race.stage.id}:${cat.id}`;
    const isConfirmed = (confirmedOverrides[key] ?? cat.isConfirmed) === true;
    if (isConfirmed) return { type: "cancel", label: "Cancelar Participação" };

    const seasonId = race?.season?.id;
    if (!seasonId) return { type: "confirm", label: "Confirmar Participação" };

    if (loadingRegistrations) return { type: "checking", label: "Verificando..." };

    const registration = myRegistrations.find((r: any) => r.season?.id === seasonId);
    if (!registration) {
      return { type: "register_season", label: "Inscrever-se na Temporada" };
    }

    // Regra: Isento da temporada -> sempre Confirmar/Cancelar
    if (registration.paymentStatus === "exempt" && registration.inscriptionType !== "por_etapa") {
      return { type: "confirm", label: "Confirmar Participação" };
    }

    if (registration.inscriptionType === "por_etapa") {
      const stageEntry = findStageEntry(registration, race.stage.id);
      if (!stageEntry) {
        return { type: "register_stage", label: "Inscrever-se na Etapa" };
      }
      let effectivePaymentStatus: string = registration.paymentStatus;
      const stageStatus: any = stageEntry?.paymentStatus || stageEntry?.status;
      const stagePaidBool: any = stageEntry?.paid || stageEntry?.isPaid;
      if (typeof stageStatus === "string") effectivePaymentStatus = stageStatus;
      if (stagePaidBool === true && !stageStatus) effectivePaymentStatus = "paid";
      // Regra: isento por etapa: tratar como pago
      if (stageEntry?.paymentStatus === "exempt") {
        effectivePaymentStatus = "exempt" as any;
      }
      if (!(paidFlags as readonly string[]).includes(effectivePaymentStatus as any)) {
        return { type: "pay", label: "Pagar Inscrição" };
      }
      return { type: "confirm", label: "Confirmar Participação" };
    }

    return { type: "confirm", label: "Confirmar Participação" };
  };

  // Função utilitária para buscar karts sorteados do piloto para uma etapa
  const getSortedKartsForUser = (
    stage: any,
    availableCategories: any[] = [],
  ) => {
    if (!stage?.kart_draw_assignments || !user?.id) return null;

    // NOVO: Se vier como array
    if (Array.isArray(stage.kart_draw_assignments)) {
      const confirmedCategories = Array.isArray(availableCategories)
        ? availableCategories.filter((cat: any) => cat && cat.isConfirmed)
        : [];
      if (confirmedCategories.length === 0) return null;
      return confirmedCategories
        .map((cat: any) => {
          if (!cat || !cat.id) return null;
          // Filtra todos os sorteios desse user e categoria
          const draws = stage.kart_draw_assignments.filter(
            (draw: any) =>
              draw.userId === user.id && draw.categoryId === cat.id,
          );
          if (!draws.length) return null;
          // Agrupa por bateria
          const batteries = draws.map((draw: any) => ({
            battery: (draw.batteryIndex ?? 0) + 1,
            kart: draw.kart,
          }));
          return {
            categoryName: cat.name,
            batteries,
          };
        })
        .filter(Boolean);
    }

    // ANTIGO: objeto aninhado
    const results = stage.kart_draw_assignments.results;
    if (!results) return null;
    const confirmedCategories = Array.isArray(availableCategories)
      ? availableCategories.filter((cat: any) => cat && cat.isConfirmed)
      : [];
    if (confirmedCategories.length === 0) return null;
    return confirmedCategories
      .map((cat: any) => {
        if (
          !cat ||
          typeof cat.id !== "string" ||
          typeof results !== "object" ||
          typeof user.id !== "string"
        )
          return null;
        const catResults = results[cat.id];
        if (!catResults || !catResults[user.id]) return null;
        const pilotKarts = catResults[user.id];
        if (!pilotKarts) return null;
        const batteries = Object.entries(pilotKarts).map(
          ([batteryIdx, obj]: any) => ({
            battery: Number(batteryIdx) + 1,
            kart: obj.kart,
          }),
        );
        return {
          categoryName: cat.name,
          batteries,
        };
      })
      .filter((cat: any) => !!cat);
  };

  // Paginação de Próximas Corridas
  const totalRacesPages = Math.max(1, Math.ceil(upcomingRaces.length / RACES_PER_PAGE));
  const startRaceIndex = (racesPage - 1) * RACES_PER_PAGE;
  const pagedUpcomingRaces = upcomingRaces.slice(
    startRaceIndex,
    startRaceIndex + RACES_PER_PAGE,
  );

  // Paginação de Organizando
  const totalOrgPages = Math.max(1, Math.ceil(championshipsOrganized.length / ORG_PER_PAGE));
  const startOrgIndex = (orgPage - 1) * ORG_PER_PAGE;
  const pagedOrganized = championshipsOrganized.slice(
    startOrgIndex,
    startOrgIndex + ORG_PER_PAGE,
  );

  // Paginação de Participando
  const totalPartPages = Math.max(
    1,
    Math.ceil(championshipsParticipating.length / PART_PER_PAGE),
  );
  const startPartIndex = (partPage - 1) * PART_PER_PAGE;
  const pagedParticipations = championshipsParticipating.slice(
    startPartIndex,
    startPartIndex + PART_PER_PAGE,
  );

  // Show loading while checking for redirect
  if (isCheckingRedirect) {
    return <></>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {showProfileAlert && (
        <Alert
          variant="info"
          dismissible
          onClose={() => setShowProfileAlert(false)}
        >
          <AlertTitle>
            Complete seu perfil para liberar todas as funcionalidades da
            plataforma!
          </AlertTitle>
          <AlertDescription>
            Personalize sua experiência e tenha acesso a recursos exclusivos.
          </AlertDescription>
        </Alert>
      )}
      {/* Cabeçalho com CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <h1 className="text-3xl font-bold">Minha Página</h1>
        {isManager && (
          <Button
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            onClick={() => nav.goToCreateChampionship()}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Campeonato
          </Button>
        )}
      </div>

      {/* Perfil e Estatísticas */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Olá {user?.name || "Usuário"},
              </h2>
              <p className="text-sm text-muted-foreground">
                Bem vindo de volta!
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => nav.goToEditProfile()}
            className="w-full sm:w-auto"
          >
            Editar Perfil
          </Button>
        </div>
        {loading.championships ? (
          <div className="flex items-center justify-center py-8">
            <Loading
              type="spinner"
              size="sm"
              message="Carregando estatísticas..."
            />
          </div>
        ) : errors.championships ? (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar estatísticas</AlertTitle>
              <AlertDescription>{errors.championships}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {userStats?.memberSince || "2024"}
              </p>
              <p className="text-sm text-muted-foreground">Membro desde</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {userStats?.totalRegistrations || 0}
              </p>
              <p className="text-sm text-muted-foreground">Inscrições</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {userStats?.totalChampionships || 0}
              </p>
              <p className="text-sm text-muted-foreground">Campeonatos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {userStats?.confirmedRegistrations || 0}
              </p>
              <p className="text-sm text-muted-foreground">Confirmadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {userStats?.totalSeasons || 0}
              </p>
              <p className="text-sm text-muted-foreground">Temporadas</p>
            </div>
          </div>
        )}
      </Card>

      {/* Grid principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Campeonatos Organizados - Mostra para managers ou para quem tem campeonatos como staff */}
        {championshipsOrganized.length > 0 && (
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Organizando</h2>
              <p className="text-sm text-muted-foreground">
                Você Organiza ou Gerencia
              </p>
            </div>

            {loading.championships ? (
              <div className="flex items-center justify-center py-8">
                <Loading
                  type="spinner"
                  size="sm"
                  message="Carregando campeonatos..."
                />
              </div>
            ) : errors.championships ? (
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar campeonatos</AlertTitle>
                  <AlertDescription>{errors.championships}</AlertDescription>
                </Alert>
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshChampionships}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : championshipsOrganized.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="Você ainda não organizou nenhum campeonato"
                action={{
                  label: "Criar Primeiro Campeonato",
                  onClick: () => nav.goToCreateChampionship(),
                }}
              />
            ) : (
              <div className="space-y-4">
                {pagedOrganized.map((championship) => {
                  // Gerar iniciais do nome do campeonato para o avatar
                  const getInitials = (name: string) => {
                    return name
                      .split(" ")
                      .filter(Boolean)
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                  };
                  // Corrige tipagem para aceitar championshipImage
                  const champ = championship as typeof championship & {
                    championshipImage?: string;
                  };
                  return (
                    <Card
                      key={champ.id}
                      className="overflow-hidden shadow-md border-2 border-muted/40 hover:border-primary/60 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4 p-6">
                        {/* Bloco avatar, nome e badge */}
                        <div className="flex flex-col items-center md:items-start md:flex-row md:items-center gap-2 md:gap-4 w-full md:flex-1 min-w-0">
                          <Avatar className="h-14 w-14 bg-muted text-primary-foreground text-xl font-bold">
                            {champ.championshipImage ? (
                              <AvatarImage
                                src={champ.championshipImage}
                                alt={`Avatar ${champ.name}`}
                              />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(champ.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-center md:items-start min-w-0">
                            <h3
                              className="text-lg font-semibold leading-tight whitespace-normal break-words w-full"
                              title={champ.name}
                            >
                              {champ.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {champ.isOwner ? "Proprietário" : "Staff"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {/* NÃO exibir descrição ou temporadas aqui para organizador */}
                      </div>
                      <div className="bg-muted/40 px-6 py-4 flex flex-col gap-2 border-t min-w-0">
                        <Button
                          className="w-full text-base py-3 font-semibold shadow-sm text-center"
                          variant="default"
                          onClick={() => nav.goToChampionship(champ.id)}
                        >
                          Ir para o Campeonato
                        </Button>
                      </div>
                    </Card>
                  );
                })}
                {totalOrgPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrgPage((p) => Math.max(1, p - 1))}
                      disabled={orgPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {orgPage} / {totalOrgPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrgPage((p) => Math.min(totalOrgPages, p + 1))}
                      disabled={orgPage >= totalOrgPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Campeonatos Participando - Ocupa mais espaço quando não há seção "Organizando" */}
        <Card className={`p-6 ${!isManager ? "lg:col-span-2" : ""}`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Participando</h2>
            <p className="text-sm text-muted-foreground">
              Você está Inscrito como Piloto
            </p>
          </div>

          {loading.championships ? (
            <div className="flex items-center justify-center py-8">
              <Loading
                type="spinner"
                size="sm"
                message="Carregando inscrições..."
              />
            </div>
          ) : errors.championships ? (
            <div className="py-4">
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar inscrições</AlertTitle>
                <AlertDescription>{errors.championships}</AlertDescription>
              </Alert>
            </div>
          ) : championshipsParticipating.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="Você ainda não participa de nenhum campeonato"
              action={{
                label: "Descobrir Campeonatos",
                onClick: () => {
                  const siteUrl = import.meta.env.VITE_SITE_URL;
                  window.location.href = `${siteUrl}/campeonatos`;
                },
              }}
            />
          ) : (
            <div className="space-y-4">
              {pagedParticipations.map((participation) => {
                // Gerar iniciais do nome do campeonato para o avatar
                const getInitials = (name: string) => {
                  return name
                    .split(" ")
                    .filter(Boolean)
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                };
                // Corrige tipagem para aceitar championshipImage
                const championship =
                  participation.championship as typeof participation.championship & {
                    championshipImage?: string;
                  };
                // Verifica se pode acessar o gráfico: pelo menos uma temporada confirmada ou com parcela paga
                const canAccessChart = participation.seasons.some(
                  (season) =>
                    season.registrationStatus === "confirmed" ||
                    season.paidInstallments > 0,
                );
                return (
                  <Card
                    key={championship.id}
                    className="overflow-hidden shadow-md border-2 border-muted/40 hover:border-primary/60 transition-all"
                  >
                      <div className="flex flex-col gap-4 p-6">
                      {/* Bloco avatar, nome e badge */}
                        <div className="flex flex-col items-center gap-2 w-full min-w-0">
                        <Avatar className="h-14 w-14 bg-muted text-primary-foreground text-xl font-bold">
                          {championship.championshipImage ? (
                            <AvatarImage
                              src={championship.championshipImage}
                              alt={`Avatar ${championship.name}`}
                            />
                          ) : null}
                          <AvatarFallback>
                            {getInitials(championship.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-center">
                          <h3
                            className="text-lg font-semibold leading-tight whitespace-normal break-words w-full"
                            title={championship.name}
                          >
                            {championship.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Piloto
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {/* Descrição e temporadas sempre abaixo do bloco acima */}
                        <div className="flex-1 flex flex-col gap-2 w-full mt-3 min-w-0">
                        {championship.shortDescription && (
                          <p
                            className="text-xs text-muted-foreground mb-1 overflow-hidden"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {championship.shortDescription}
                          </p>
                        )}
                        <div className="space-y-1">
                          {participation.seasons.map((season) => (
                            <div
                              key={season.id}
                              className="flex justify-between items-center text-xs"
                            >
                              <span className="text-muted-foreground font-medium">
                                {season.name}
                              </span>
                              <div className="flex items-center gap-2">
                                {season.totalInstallments > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    {season.paidInstallments}/
                                    {season.totalInstallments} parcelas
                                  </span>
                                )}
                                <Badge
                                  variant={
                                    season.registrationStatus === "confirmed"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {season.registrationStatus === "confirmed"
                                    ? "Confirmado"
                                    : season.registrationStatus ===
                                        "payment_pending"
                                      ? "Pag. Pendente"
                                      : season.registrationStatus}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/40 px-6 py-4 flex flex-col gap-2 border-t min-w-0">
                      {/* Botão de Análise Volta a Volta (laranja, sem ícone, texto customizado) */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                className="w-full text-base py-3 font-semibold shadow-sm text-center bg-primary border-none hover:bg-primary/90"
                                style={{
                                  backgroundColor: "#ff8800",
                                  color: "#000",
                                  border: "none",
                                }}
                                variant="default"
                                onClick={() => {
                                  window.location.href = `/championship/${championship.id}/lap-times-chart`;
                                }}
                                disabled={!canAccessChart}
                              >
                                Análise Volta a Volta
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canAccessChart && (
                            <TooltipContent side="top">
                              Disponível apenas após confirmação do pagamento.
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {/* Botão Ir para o Campeonato (outline branco e preto) */}
                      <Button
                        className="w-full text-base py-3 font-semibold shadow-sm text-center border-black text-black bg-white hover:bg-gray-100"
                        variant="outline"
                        style={{
                          borderColor: "#000",
                          color: "#000",
                          backgroundColor: "#fff",
                        }}
                        onClick={() => {
                          const siteUrl = import.meta.env.VITE_SITE_URL;
                          window.location.href = `${siteUrl}/campeonato/${championship.slug}`;
                        }}
                      >
                        Ir para o Campeonato
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {totalPartPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartPage((p) => Math.max(1, p - 1))}
                    disabled={partPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {partPage} / {totalPartPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPartPage((p) => Math.min(totalPartPages, p + 1))}
                    disabled={partPage >= totalPartPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Próximas Corridas */}
        <Card className="p-6">
          <div>
            <h2 className="text-xl font-semibold">Próximas Corridas</h2>
            <p className="text-sm text-muted-foreground">
              Suas próximas corridas agendadas
            </p>
          </div>

          {loading.races ? (
            <div className="flex items-center justify-center py-8">
              <Loading
                type="spinner"
                size="sm"
                message="Carregando corridas..."
              />
            </div>
          ) : errors.races ? (
            <div className="py-4">
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar corridas</AlertTitle>
                <AlertDescription>{errors.races}</AlertDescription>
              </Alert>
            </div>
          ) : upcomingRaces.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="Nenhuma corrida agendada"
              description="Você não tem corridas próximas"
            />
          ) : (
            <div className="space-y-4">
              {pagedUpcomingRaces.map((race) => {
                const sortedKarts = getSortedKartsForUser(
                  race.stage,
                  race.availableCategories,
                );
                return (
                  <Card
                    key={race.stage.id}
                    className="overflow-hidden shadow-md border-2 border-muted/40 hover:border-primary/60 transition-all group"
                  >
                    <div className="flex flex-col gap-4 p-5 relative">
                      {/* Header com título e status principal */}
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {race.stage.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {race.season.name}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          {race.stage.doublePoints && (
                            <Badge
                              variant="secondary"
                              className="text-xs whitespace-nowrap"
                            >
                              2x Pontos
                            </Badge>
                          )}
                          {race.stage.doubleRound && (
                            <Badge
                              variant="secondary"
                              className="text-xs whitespace-nowrap"
                            >
                              Rodada Dupla
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* Informações essenciais */}
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-4 mb-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className="whitespace-nowrap">
                              {formatDateToBrazilian(race.stage.date)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="whitespace-nowrap">
                              {race.stage.time}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {(() => {
                              const raceTrackId = race.stage.raceTrackId;
                              const raceTrack = raceTracks[raceTrackId];
                              return raceTrackId && raceTrack
                                ? raceTrack.name
                                : "Carregando...";
                            })()}
                          </span>
                        </div>
                        {race.stage.trackLayoutId &&
                          race.stage.trackLayoutId !== "undefined" && (
                            <div className="flex items-center gap-1 mb-1">
                              <Navigation className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">
                                Traçado: {race.stage.trackLayoutId}
                              </span>
                            </div>
                          )}
                      </div>
                      {/* Substituir bloco de karts sorteados por uma linha minimalista */}
                      {sortedKarts && sortedKarts.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-black">
                              Karts sorteados
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sortedKarts
                              .map((cat: any) =>
                                cat && cat.batteries && cat.batteries.length > 0
                                  ? cat.batteries.map(
                                      (batt: any, idx: number) => (
                                        <span
                                          key={cat.categoryName + "-" + idx}
                                          className="inline-block bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-semibold text-black shadow-sm"
                                        >
                                          B{idx + 1}: {batt.kart}
                                        </span>
                                      ),
                                    )
                                  : null,
                              )
                              .flat()
                              .filter(Boolean)}
                          </div>
                        </div>
                      )}
                      {/* Ações de participação por categoria */}
                      {(() => {
                        const hasCats = Array.isArray(race.availableCategories) && race.availableCategories.length > 0;
                        const seasonId = race?.season?.id;
                        const registration = myRegistrations.find((r: any) => r.season?.id === seasonId);
                        const isPorEtapa = registration && registration.inscriptionType === "por_etapa";
                        const stageEntry = registration && findStageEntry(registration, race.stage.id);
                        const shouldShowRegisterStageFallback = isPorEtapa && !stageEntry;
                        if (!hasCats && !shouldShowRegisterStageFallback) return null;
                        return (
                          <div className="flex flex-col gap-3 mt-3">
                            <div className="text-sm font-semibold text-black">Participação</div>
                            <div className="flex flex-col gap-3 w-full">
                              {shouldShowRegisterStageFallback
                                ? (
                                  <Button
                                    className="w-full text-base py-3 font-semibold shadow-sm text-center"
                                    variant="default"
                                    size="lg"
                                    onClick={(e: any) => {
                                      e.stopPropagation();
                                      redirectToStageRegistrationPorEtapa(race.season.id, race.stage.id);
                                    }}
                                  >
                                    Inscrever-se na Etapa
                                  </Button>
                                )
                                : hasCats && (race.availableCategories ?? []).map((cat: any) => {
                              if (!cat || !cat.id) return null;
                              const key = `${race.stage.id}:${cat.id}`;
                              const isLoading = buttonLoading[key] === true;
                              const action = getCategoryAction(race, cat);
                              const onClick = (e: any) => {
                                e.stopPropagation();
                                if (action.type === "register_season") {
                                  redirectToSeasonRegistration(race.season.id, race.stage.id, cat.id);
                                } else if (action.type === "register_stage") {
                                  redirectToStageRegistrationPorEtapa(race.season.id, race.stage.id, cat.id);
                                } else if (action.type === "pay") {
                                  const registration = myRegistrations.find((r: any) => r.season?.id === race.season.id);
                                  if (registration) {
                                    window.location.href = `/registration/${registration.id}/payment?stageId=${race.stage.id}&categoryId=${cat.id}`;
                                  }
                                } else if (action.type === "confirm") {
                                  handleConfirmParticipation(race.stage.id, cat.id, race.season?.id);
                                } else if (action.type === "cancel") {
                                  handleCancelParticipation(race.stage.id, cat.id);
                                }
                              };
                              const variant = action.type === "cancel" ? "destructive" : "default";
                                 return (
                                <div key={cat.id} className="w-full">
                                  <Badge variant="outline" className="text-xs mb-2">{cat.name}</Badge>
                                  <Button
                                    className="w-full text-base py-3 font-semibold shadow-sm text-center"
                                    variant={variant as any}
                                    size="lg"
                                    onClick={onClick}
                                    disabled={isLoading || action.type === "checking"}
                                  >
                                    {isLoading
                                      ? action.type === "cancel"
                                        ? "Cancelando..."
                                        : action.type === "confirm"
                                          ? "Confirmando..."
                                          : action.type === "pay"
                                            ? "Redirecionando..."
                                            : "Aguarde..."
                                      : action.label}
                                  </Button>
                                   </div>
                                 );
                                })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </Card>
                );
              })}
              {totalRacesPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRacesPage((p) => Math.max(1, p - 1))}
                    disabled={racesPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {racesPage} / {totalRacesPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRacesPage((p) => Math.min(totalRacesPages, p + 1))
                    }
                    disabled={racesPage >= totalRacesPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Removido: modal de detalhes da corrida */}

      {/* Removidos: modais de confirmação/cancelamento de participação */}

      {/* Modal de perfil incompleto */}
      <CompleteProfileModal
        isOpen={showCompleteProfileModal}
        onClose={() => setShowCompleteProfileModal(false)}
        onSkip={markAsSkipped}
      />
    </div>
  );
};

export default Dashboard;
