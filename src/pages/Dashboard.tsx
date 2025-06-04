import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlusCircle,
  Trophy,
  Flag,
  User,
  MapPin,
  Calendar,
  Users,
  Settings,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigation } from "@/router";
import { useDashboardChampionships } from "@/hooks/use-dashboard-championships";
import { useChampionshipContext } from "@/contexts/ChampionshipContext";
import { formatDateToBrazilian } from "@/utils/date";

export const Dashboard = () => {
  const nav = useNavigation();
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [selectedRace, setSelectedRace] = useState<(typeof nextRaces)[0] | null>(null);
  
  // Use context for championships data and hook for loading/error states
  const { championshipsOrganized } = useChampionshipContext();
  const { 
    loadingChampionships, 
    championshipsError, 
    refreshChampionships 
  } = useDashboardChampionships();
  
  // Dados mockados para exemplo
  const championshipsParticipating = [];
  const userStats = {
    memberSince: "2023",
    totalRaces: 15,
    totalChampionship: 3,
    bestPosition: "2º",
    averagePosition: "5º",
  };

  const nextRaces = [
    {
      id: 1,
      championship: "Copa São Paulo de Kart",
      location: "Kartódromo Granja Viana",
      date: new Date("2024-02-15"),
      stage: 3,
      season: "2024",
      notification: {
        type: "warning" as const,
        message: "Inscrições abertas até 10/02",
      },
    },
    {
      id: 2,
      championship: "Campeonato Paulista",
      location: "Kartódromo Aldeia da Serra",
      date: new Date("2024-02-22"),
      stage: 1,
      season: "2024",
      notification: {
        type: "success" as const,
        message: "Você está inscrito",
      },
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {showProfileAlert && (
        <Alert
          hasCloseButton
          onClose={() => setShowProfileAlert(false)}
          variant="withAction"
          action={
            <Button
              variant="outline"
              onClick={() => nav.goToCompleteProfile()}
            >
              Completar Perfil
            </Button>
          }
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button 
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          onClick={() => nav.goToCreateChampionship()}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Campeonato
        </Button>
      </div>

      {/* Perfil e Estatísticas */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Olá Usuário,</h2>
              <p className="text-sm text-muted-foreground">
                Resumo da sua performance
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{userStats.memberSince}</p>
            <p className="text-sm text-muted-foreground">Membro desde</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{userStats.totalRaces}</p>
            <p className="text-sm text-muted-foreground">Corridas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{userStats.totalChampionship}</p>
            <p className="text-sm text-muted-foreground">
              Participação em Campeonatos
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">{userStats.bestPosition}</p>
            <p className="text-sm text-muted-foreground">Melhor Pos.</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{userStats.averagePosition}</p>
            <p className="text-sm text-muted-foreground">Média Pos.</p>
          </div>
        </div>
      </Card>

      {/* Grid principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Campeonatos Organizados */}
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
            <div className="text-center py-8">
              <p className="text-sm text-destructive mb-2">{championshipsError}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshChampionships}
              >
                Tentar novamente
              </Button>
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
                    <Badge variant="outline" className="text-xs">
                      Organizador
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Campeonatos Participando */}
        <Card className="p-6">
          <div>
            <h2 className="text-xl font-semibold">Participando</h2>
            <p className="text-sm text-muted-foreground">
              Você está Inscrito como Piloto
            </p>
          </div>
          {championshipsParticipating.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="Você ainda não participa de nenhum campeonato"
              action={{
                label: "Descobrir Campeonatos",
                onClick: () => {},
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Lista de campeonatos participando */}
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
          <div className="space-y-4">
            {nextRaces.map((race) => (
              <div
                key={race.id}
                className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedRace(race)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm">{race.championship}</h3>
                  <Badge variant="outline">
                    Etapa {race.stage} - {race.season}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {race.location}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDateToBrazilian(race.date.toISOString())}
                  </div>
                </div>
                {race.notification && (
                  <div className="mt-2">
                    <Badge
                      variant={
                        race.notification.type === "warning"
                          ? "destructive"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {race.notification.message}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal de detalhes da corrida */}
      <Dialog open={!!selectedRace} onOpenChange={() => setSelectedRace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRace?.championship}</DialogTitle>
            <DialogDescription>
              Etapa {selectedRace?.stage} - {selectedRace?.season}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{selectedRace?.location}</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDateToBrazilian(selectedRace?.date.toISOString() || "")}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>24 pilotos inscritos</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRace(null)}>
              Fechar
            </Button>
            <Button>Ver Detalhes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
