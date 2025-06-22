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
} from "lucide-react";
import { useState } from "react";
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
} from "brk-design-system";
import { useNavigation } from "@/router";
import { useDashboardChampionships } from "@/hooks/use-dashboard-championships";
import { useChampionshipContext } from "@/contexts/ChampionshipContext";
import { formatDateToBrazilian } from "@/utils/date";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRegistrations } from "@/hooks/use-user-registrations";
import { useUserUpcomingRaces } from "@/hooks/use-user-upcoming-races";
import { useUserStats } from "@/hooks/use-user-stats";
import { StageParticipationService } from "@/lib/services/stage-participation.service";
import { toast } from "sonner";

export const Dashboard = () => {
  const nav = useNavigation();
  const { user } = useAuth();
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [confirmingParticipation, setConfirmingParticipation] = useState<string | null>(null);
  
  // Check if user is manager or administrator
  const isManager = user?.role === 'Manager' || user?.role === 'Administrator';
  
  // Use context for championships data and hook for loading/error states
  const { championshipsOrganized } = useChampionshipContext();
  const { 
    loadingChampionships, 
    championshipsError, 
    refreshChampionships 
  } = useDashboardChampionships();
  
  // Hooks para dados do usuário
  const { 
    championshipsParticipating, 
    loading: loadingRegistrations, 
    error: registrationsError 
  } = useUserRegistrations();
  
  const { 
    upcomingRaces, 
    loading: loadingRaces, 
    error: racesError 
  } = useUserUpcomingRaces();
  
  const {
    stats: userStats,
    loading: loadingStats,
    error: statsError
  } = useUserStats();

  // Função para confirmar participação
  const handleConfirmParticipation = async (stageId: string, categoryId: string) => {
    try {
      setConfirmingParticipation(stageId);
      await StageParticipationService.confirmParticipation({ stageId, categoryId });
      toast.success('Participação confirmada com sucesso!');
      // Refresh upcoming races to update the UI
      window.location.reload(); // Temporary solution - ideally we'd refresh just the data
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar participação');
    } finally {
      setConfirmingParticipation(null);
    }
  };

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
        {loadingStats ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Carregando estatísticas...</div>
          </div>
        ) : statsError ? (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar estatísticas</AlertTitle>
              <AlertDescription>{statsError}</AlertDescription>
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
        {(isManager || championshipsOrganized.length > 0) && (
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Organizando</h2>
              <p className="text-sm text-muted-foreground">
                Você Organiza ou Gerencia
              </p>
            </div>
            
            {loadingChampionships ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Carregando campeonatos...</div>
              </div>
            ) : championshipsError ? (
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar campeonatos</AlertTitle>
                  <AlertDescription>{championshipsError}</AlertDescription>
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
              <div className="space-y-3">
                {championshipsOrganized.map((championship) => (
                  <div
                    key={championship.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => nav.goToChampionship(championship.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm truncate flex-1 mr-2" title={championship.name}>
                        {championship.name}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="Ver campeonato"
                          onClick={(e) => {
                            e.stopPropagation();
                            nav.goToChampionship(championship.id);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="Gerenciar campeonato"
                          onClick={(e) => {
                            e.stopPropagation();
                            nav.goToChampionship(championship.id);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
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
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Criado em {formatDateToBrazilian(championship.createdAt)}</span>
                      <Badge 
                        variant={championship.isOwner !== false ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {championship.isOwner !== false ? "Organizador" : "Equipe"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Campeonatos Participando - Ocupa mais espaço quando não há seção "Organizando" */}
        <Card className={`p-6 ${!(isManager || championshipsOrganized.length > 0) ? 'lg:col-span-2' : ''}`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Participando</h2>
            <p className="text-sm text-muted-foreground">
              Você está Inscrito como Piloto
            </p>
          </div>
          
          {loadingRegistrations ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Carregando inscrições...</div>
            </div>
          ) : registrationsError ? (
            <div className="py-4">
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar inscrições</AlertTitle>
                <AlertDescription>{registrationsError}</AlertDescription>
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
                  window.open(`${siteUrl}/campeonatos`, '_blank', 'noopener,noreferrer');
                },
              }}
            />
          ) : (
            <div className="space-y-4">
              {championshipsParticipating.map((participation) => (
                <div
                  key={participation.championship.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => nav.goToChampionship(participation.championship.id)}
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
                        <Badge 
                          variant={season.registrationStatus === 'confirmed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {season.registrationStatus === 'confirmed' ? 'Confirmado' : 
                           season.registrationStatus === 'payment_pending' ? 'Pag. Pendente' : 
                           season.registrationStatus}
                        </Badge>
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
          
          {loadingRaces ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Carregando corridas...</div>
            </div>
          ) : racesError ? (
            <div className="py-4">
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar corridas</AlertTitle>
                <AlertDescription>{racesError}</AlertDescription>
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
                      <span className="truncate">{race.stage.kartodrome}</span>
                    </div>
                  </div>
                  
                  {/* Botão de ação principal - ocupa toda a largura */}
                  {race.availableCategories && race.availableCategories.length > 0 && !race.hasConfirmedParticipation && (
                    <Button
                      size="default"
                      variant="default"
                      disabled={confirmingParticipation === race.stage.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (race.availableCategories!.length === 1) {
                          handleConfirmParticipation(race.stage.id, race.availableCategories![0].id);
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
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de detalhes da corrida */}
      <Dialog open={!!selectedRace} onOpenChange={() => setSelectedRace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRace?.stage?.name}</DialogTitle>
            <DialogDescription>
              {selectedRace?.season?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{selectedRace?.stage?.kartodrome}</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDateToBrazilian(selectedRace?.stage?.date || "")} às {selectedRace?.stage?.time}</span>
              </div>
            </div>
            {selectedRace?.stage?.kartodromeAddress && (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">{selectedRace.stage.kartodromeAddress}</span>
              </div>
            )}
            {selectedRace?.stage?.doublePoints && (
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>Pontuação em dobro</span>
              </div>
            )}
          </div>
          
          {/* Seção de confirmação de participação */}
          {selectedRace && selectedRace.availableCategories && selectedRace.availableCategories.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">
                Confirmar Participação
                {selectedRace.isOrganizer && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Organizador & Piloto
                  </Badge>
                )}
              </h4>
              {selectedRace.hasConfirmedParticipation ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Participação confirmada</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Selecione uma categoria para confirmar sua participação:
                  </p>
                  <div className="grid gap-2">
                    {selectedRace.availableCategories.map((category: any) => (
                      <Button
                        key={category.id}
                        variant="outline"
                        size="sm"
                        disabled={confirmingParticipation === selectedRace.stage.id || category.isConfirmed}
                        onClick={() => {
                          handleConfirmParticipation(selectedRace.stage.id, category.id);
                          setSelectedRace(null);
                        }}
                        className="justify-start"
                      >
                        {category.isConfirmed ? (
                          <Check className="h-3 w-3 mr-2 text-green-500" />
                        ) : confirmingParticipation === selectedRace.stage.id ? (
                          <Clock className="h-3 w-3 mr-2" />
                        ) : (
                          <div className="h-3 w-3 mr-2" />
                        )}
                        {category.name} - {category.ballast}
                        {category.isConfirmed && (
                          <Badge variant="default" className="ml-auto text-xs bg-green-500">
                            Confirmado
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRace(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

