import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import {
  PlusCircle,
  Trophy,
  Flag,
  User,
  MapPin,
  Calendar,
  Settings,
  Eye,
  Check,
  Clock,
  X,
  Users,
  Navigation,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "brk-design-system";
import { EmptyState } from "brk-design-system";
import { Badge } from "brk-design-system";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigation } from "@/router";
import { formatDateToBrazilian } from "@/utils/date";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCompletion } from "@/hooks/use-profile-completion";
import { StageParticipationService } from "@/lib/services/stage-participation.service";
import { CompleteProfileModal } from "@/components/profile/CompleteProfileModal";
import { toast } from "sonner";
import { Loading } from '@/components/ui/loading';
import { useUser } from '@/contexts/UserContext';

export const Dashboard = () => {
  const nav = useNavigation();
  const { user } = useAuth();
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [confirmingParticipation, setConfirmingParticipation] = useState<string | null>(null);
  const [cancellingParticipation, setCancellingParticipation] = useState<string | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState<{stageId: string, categoryId: string, categoryName: string} | null>(null);
  const [showConfirmConfirmation, setShowConfirmConfirmation] = useState<{stageId: string, categoryId: string, categoryName: string} | null>(null);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  
  // Check if user is manager or administrator
  const isManager = user?.role === 'Manager' || user?.role === 'Administrator';
  
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
    refreshUserStats,
    refreshAll,
    updateRaceParticipation
  } = useUser();

  const { isProfileCompleted, loading: loadingProfile, shouldShowModal, markAsSkipped } = useProfileCompletion();

  useEffect(() => {
    const redirectUrl = localStorage.getItem('redirectUrl');
    if (redirectUrl) {
      window.location.href = redirectUrl;
      localStorage.removeItem('redirectUrl');
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

  // Função para confirmar participação
  const handleConfirmParticipation = async (stageId: string, categoryId: string) => {
    try {
      setConfirmingParticipation(stageId);
      await StageParticipationService.confirmParticipation({ stageId, categoryId });
      toast.success('Participação confirmada com sucesso!');
      // Atualizar apenas a corrida específica
      await updateRaceParticipation(stageId);
      setShowConfirmConfirmation(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar participação');
    } finally {
      setConfirmingParticipation(null);
    }
  };

  // Função para cancelar participação
  const handleCancelParticipation = async (stageId: string, categoryId: string) => {
    try {
      setCancellingParticipation(stageId);
      await StageParticipationService.cancelParticipation({ stageId, categoryId });
      toast.success('Participação cancelada com sucesso!');
      // Atualizar apenas a corrida específica
      await updateRaceParticipation(stageId);
      setShowCancelConfirmation(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cancelar participação');
    } finally {
      setCancellingParticipation(null);
    }
  };

  // Função utilitária para saber se está no prazo de confirmação/cancelamento
  const isParticipationAllowed = (stage: any) => {
    if (!stage?.date || !stage?.time) return false;
    try {
      let datePart = stage.date;
      // Se vier com T e Z, extrai só a parte da data
      if (datePart.includes('T')) {
        datePart = datePart.split('T')[0];
      }
      // Monta string ISO correta
      const dateTimeStr = `${datePart}T${stage.time}`;
      const eventDate = new Date(dateTimeStr);
      const now = new Date();
      if (isNaN(eventDate.getTime())) {
        console.error('Invalid event date:', stage.date, stage.time);
        return false;
      }
      const timeDifference = eventDate.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      return hoursDifference > 24;
    } catch (error) {
      console.error('Error calculating participation deadline:', error);
      return false;
    }
  };

  // Show loading while checking for redirect
  if (isCheckingRedirect) {
    return (
      <></>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {showProfileAlert && (
        <Alert variant="info" dismissible onClose={() => setShowProfileAlert(false)}>
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
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
              <h2 className="text-xl font-semibold">Olá {user?.name || 'Usuário'},</h2>
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
            <Loading type="spinner" size="sm" message="Carregando estatísticas..." />
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
              <p className="text-2xl font-bold">{userStats?.memberSince || '2024'}</p>
              <p className="text-sm text-muted-foreground">Membro desde</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats?.totalRegistrations || 0}</p>
              <p className="text-sm text-muted-foreground">Inscrições</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats?.totalChampionships || 0}</p>
              <p className="text-sm text-muted-foreground">
                Campeonatos
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats?.confirmedRegistrations || 0}</p>
              <p className="text-sm text-muted-foreground">Confirmadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats?.totalSeasons || 0}</p>
              <p className="text-sm text-muted-foreground">Temporadas</p>
            </div>
          </div>
        )}
      </Card>

      {/* Grid principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Campeonatos Organizados - Mostra para managers ou para quem tem campeonatos como staff */}
        {isManager && (
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Organizando</h2>
              <p className="text-sm text-muted-foreground">
                Você Organiza ou Gerencia
              </p>
            </div>
            
            {loading.championships ? (
              <div className="flex items-center justify-center py-8">
                <Loading type="spinner" size="sm" message="Carregando campeonatos..." />
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
                {championshipsOrganized.map((championship) => (
                  <div
                    key={championship.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      nav.goToChampionship(championship.id);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm truncate flex-1 mr-2" title={championship.name}>
                        {championship.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {championship.isOwner ? 'Proprietário' : 'Staff'}
                      </Badge>
                    </div>
                    
                    {championship.shortDescription && (
                      <p className="text-xs text-muted-foreground mb-2 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {championship.shortDescription}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {championship.createdAt ? formatDateToBrazilian(championship.createdAt) : 'Data não disponível'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Campeonatos Participando - Ocupa mais espaço quando não há seção "Organizando" */}
        <Card className={`p-6 ${!isManager ? 'lg:col-span-2' : ''}`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Participando</h2>
            <p className="text-sm text-muted-foreground">
              Você está Inscrito como Piloto
            </p>
          </div>
          
          {loading.championships ? (
            <div className="flex items-center justify-center py-8">
              <Loading type="spinner" size="sm" message="Carregando inscrições..." />
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
              {championshipsParticipating.map((participation) => (
                <div
                  key={participation.championship.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    // Se for staff ou owner, usar navigate interno
                    if (participation.championship.isOwner || participation.championship.isStaff) {
                      nav.goToChampionship(participation.championship.id);
                    } else {
                      // Se for apenas piloto, ir para a página pública
                      const siteUrl = import.meta.env.VITE_SITE_URL;
                      window.location.href = `${siteUrl}/campeonato/${participation.championship.slug}`;
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm truncate flex-1 mr-2" title={participation.championship.name}>
                      {participation.championship.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Piloto
                    </Badge>
                  </div>
                  
                  {participation.championship.shortDescription && (
                    <p className="text-xs text-muted-foreground mb-2 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {participation.championship.shortDescription}
                    </p>
                  )}
                  
                  <div className="space-y-1">
                    {participation.seasons.map((season) => (
                      <div key={season.id} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{season.name}</span>
                        <div className="flex items-center gap-2">
                          {season.totalInstallments > 1 && (
                            <span className="text-xs text-muted-foreground">
                              {season.paidInstallments}/{season.totalInstallments} parcelas
                            </span>
                          )}
                          <Badge 
                            variant={season.registrationStatus === 'confirmed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {season.registrationStatus === 'confirmed' ? 'Confirmado' : 
                             season.registrationStatus === 'payment_pending' ? 'Pag. Pendente' : 
                             season.registrationStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
              <Loading type="spinner" size="sm" message="Carregando corridas..." />
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
              {upcomingRaces.map((race) => (
                <div
                  key={race.stage.id}
                  className="border rounded-lg p-5 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRace(race)}
                >
                  {/* Header com título e status principal */}
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {race.stage.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {race.season.name}
                      </p>
                    </div>
                    
                    {/* Status badges - apenas os mais importantes */}
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      {race.isOrganizer && (
                        <Badge variant="default" className="bg-orange-500 text-xs whitespace-nowrap">
                          Organizador
                        </Badge>
                      )}
                      {race.hasConfirmedParticipation && (
                        <Badge variant="default" className="bg-green-500 text-xs whitespace-nowrap">
                          <Check className="h-3 w-3 mr-1" />
                          Confirmado
                        </Badge>
                      )}
                      {race.stage.doublePoints && (
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          2x Pontos
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Informações essenciais */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="whitespace-nowrap">{formatDateToBrazilian(race.stage.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="whitespace-nowrap">{race.stage.time}</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {(() => {
                          const raceTrackId = race.stage.raceTrackId;
                          const raceTrack = raceTracks[raceTrackId];
                          const trackName = raceTrackId && raceTrack 
                            ? raceTrack.name 
                            : 'Carregando...';
                          return race.stage.trackLayoutId && race.stage.trackLayoutId !== 'undefined'
                            ? `${trackName} - ${race.stage.trackLayoutId}`
                            : trackName;
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
                  {race.availableCategories && race.availableCategories.length > 0 && (
                    <div className="space-y-2">
                      {!race.hasConfirmedParticipation ? (
                        <Button
                          size="default"
                          variant="default"
                          disabled={confirmingParticipation === race.stage.id || !isParticipationAllowed(race.stage)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (race.availableCategories!.length === 1) {
                              setShowConfirmConfirmation({
                                stageId: race.stage.id,
                                categoryId: race.availableCategories![0].id,
                                categoryName: race.availableCategories![0].name
                              });
                            } else {
                              setSelectedRace(race);
                            }
                          }}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          {confirmingParticipation === race.stage.id ? (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Confirmando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Confirmar Participação
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="default"
                          variant="outline"
                          disabled={cancellingParticipation === race.stage.id || !isParticipationAllowed(race.stage)}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Log extra para debug
                            const allowed = isParticipationAllowed(race.stage);
                            if (!allowed) return;
                            // Encontrar a categoria confirmada
                            const confirmedCategory = race.availableCategories!.find(cat => cat.isConfirmed);
                            if (confirmedCategory) {
                              setShowCancelConfirmation({
                                stageId: race.stage.id,
                                categoryId: confirmedCategory.id,
                                categoryName: confirmedCategory.name
                              });
                            }
                          }}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          {cancellingParticipation === race.stage.id ? (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Cancelando...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Cancelar Participação
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de detalhes da corrida */}
      <Dialog open={!!selectedRace} onOpenChange={() => setSelectedRace(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-primary" />
              <DialogTitle className="text-2xl font-bold">{selectedRace?.stage?.name}</DialogTitle>
            </div>
            <DialogDescription className="text-lg font-medium text-primary/80">
              {selectedRace?.season?.name}
            </DialogDescription>
          </DialogHeader>
          
          {/* Informações principais em cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Card de localização */}
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary rounded-lg">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Local</h3>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const raceTrackId = selectedRace?.stage?.raceTrackId;
                      const raceTrack = raceTracks[raceTrackId];
                      return raceTrackId && raceTrack 
                        ? raceTrack.name 
                        : 'Carregando...';
                    })()}
                  </p>
                </div>
              </div>
              {(() => {
                const raceTrackId = selectedRace?.stage?.raceTrackId;
                const raceTrack = raceTracks[raceTrackId];
                return raceTrackId && raceTrack?.address ? (
                  <p className="text-xs text-muted-foreground pl-11">
                    {raceTrack.address}
                  </p>
                ) : null;
              })()}
              {selectedRace?.stage?.trackLayoutId && selectedRace.stage.trackLayoutId !== 'undefined' && (
                <div className="flex items-center gap-2 mt-3 pl-11">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Traçado: {selectedRace.stage.trackLayoutId}</span>
                </div>
              )}
            </div>

            {/* Card de data e hora */}
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Calendar className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Data & Hora</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDateToBrazilian(selectedRace?.stage?.date || "")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    às {selectedRace?.stage?.time}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges de status */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedRace?.stage?.doublePoints && (
              <Badge variant="secondary" className="px-3 py-1">
                <Trophy className="h-3 w-3 mr-1" />
                Pontuação em Dobro
              </Badge>
            )}
            {selectedRace?.isOrganizer && (
              <Badge variant="default" className="px-3 py-1">
                <Settings className="h-3 w-3 mr-1" />
                Organizador
              </Badge>
            )}
            {selectedRace?.hasConfirmedParticipation && (
              <Badge variant="default" className="px-3 py-1">
                <Check className="h-3 w-3 mr-1" />
                Participação Confirmada
              </Badge>
            )}
          </div>
          
          {/* Seção de gerenciamento de participação */}
          {selectedRace && selectedRace.availableCategories && selectedRace.availableCategories.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Gerenciar Participação</h4>
                  {selectedRace.isOrganizer && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {selectedRace.hasConfirmedParticipation ? 'Organizador & Piloto' : 'Organizador'}
                    </Badge>
                  )}
                </div>
              </div>
              
              {selectedRace.hasConfirmedParticipation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                    <div className="p-2 bg-primary rounded-lg">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-card-foreground">Participação Confirmada</h5>
                      <p className="text-sm text-muted-foreground">Sua inscrição está ativa para esta etapa</p>
                    </div>
                  </div>
                  {!isParticipationAllowed(selectedRace.stage) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100 text-sm">
                      O prazo para cancelar participação expirou. Entre em contato com o organizador do campeonato para alterações.
                    </div>
                  )}
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-700 dark:text-gray-300">Categoria confirmada:</h6>
                    {selectedRace.availableCategories
                      .filter((category: any) => category.isConfirmed)
                      .map((category: any) => (
                        <div key={category.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-lg">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <span className="font-semibold text-card-foreground">{category.name}</span>
                              <p className="text-sm text-muted-foreground">Lastro: {category.ballast}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancellingParticipation === selectedRace.stage.id || !isParticipationAllowed(selectedRace.stage)}
                            onClick={() => {
                              setShowCancelConfirmation({
                                stageId: selectedRace.stage.id,
                                categoryId: category.id,
                                categoryName: category.name
                              });
                              setSelectedRace(null);
                            }}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            {cancellingParticipation === selectedRace.stage.id ? (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Cancelando...
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Cancelar
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
                              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                    <div className="p-2 bg-primary rounded-lg">
                      <Users className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-card-foreground">Confirmar Participação</h5>
                      <p className="text-sm text-muted-foreground">Selecione uma categoria para participar</p>
                    </div>
                  </div>
                  {!isParticipationAllowed(selectedRace.stage) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100 text-sm">
                      O prazo para confirmar participação expirou. Entre em contato com o organizador do campeonato para alterações.
                    </div>
                  )}
                  <div className="grid gap-3">
                    {selectedRace.availableCategories.map((category: any) => (
                      <Button
                        key={category.id}
                        variant="outline"
                        size="lg"
                        disabled={confirmingParticipation === selectedRace.stage.id || category.isConfirmed || !isParticipationAllowed(selectedRace.stage)}
                        onClick={() => {
                          setShowConfirmConfirmation({
                            stageId: selectedRace.stage.id,
                            categoryId: category.id,
                            categoryName: category.name
                          });
                          setSelectedRace(null);
                        }}
                        className="justify-start h-auto p-4 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                      >
                        <div className="flex items-center w-full">
                          {category.isConfirmed ? (
                            <div className="p-2 bg-primary rounded-lg mr-3">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          ) : confirmingParticipation === selectedRace.stage.id ? (
                            <div className="p-2 bg-primary rounded-lg mr-3">
                              <Clock className="h-4 w-4 text-primary-foreground" />
                            </div>
                          ) : (
                            <div className="p-2 bg-muted rounded-lg mr-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="text-left flex-1">
                            <div className="font-semibold">{category.name}</div>
                            <div className="text-sm text-muted-foreground">Lastro: {category.ballast}</div>
                          </div>
                          {category.isConfirmed && (
                            <Badge variant="default">
                              Confirmado
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedRace(null)}
              className="px-6 py-2"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de cancelamento */}
      <Dialog open={!!showCancelConfirmation} onOpenChange={() => setShowCancelConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Participação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua participação?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-red-50">
              <div className="flex items-center gap-2 text-red-700">
                <X className="h-4 w-4" />
                <span className="font-medium">Categoria: {showCancelConfirmation?.categoryName}</span>
              </div>
              <p className="text-sm text-red-600 mt-2">
                Sua participação será cancelada, mas você poderá confirmá-la novamente se desejar.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelConfirmation(null)}
              disabled={cancellingParticipation === showCancelConfirmation?.stageId}
            >
              Manter Participação
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (showCancelConfirmation) {
                  handleCancelParticipation(showCancelConfirmation.stageId, showCancelConfirmation.categoryId);
                }
              }}
              disabled={cancellingParticipation === showCancelConfirmation?.stageId}
            >
              {cancellingParticipation === showCancelConfirmation?.stageId ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Cancelando...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Confirmar Cancelamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de participação */}
      <Dialog open={!!showConfirmConfirmation} onOpenChange={() => setShowConfirmConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Participação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja confirmar sua participação nesta etapa?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">Categoria: {showConfirmConfirmation?.categoryName}</span>
              </div>
              <p className="text-sm text-green-600 mt-2">
                Sua participação será confirmada e você estará oficialmente inscrito nesta etapa.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmConfirmation(null)}
              disabled={confirmingParticipation === showConfirmConfirmation?.stageId}
            >
              Cancelar
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                if (showConfirmConfirmation) {
                  handleConfirmParticipation(showConfirmConfirmation.stageId, showConfirmConfirmation.categoryId);
                }
              }}
              disabled={confirmingParticipation === showConfirmConfirmation?.stageId}
            >
              {confirmingParticipation === showConfirmConfirmation?.stageId ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Participação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

