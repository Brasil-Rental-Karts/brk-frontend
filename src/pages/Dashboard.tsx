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

export const Dashboard = () => {
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [selectedRace, setSelectedRace] = useState<
    (typeof nextRaces)[0] | null
  >(null);
  // Dados mockados para exemplo
  const championshipsOrganized = [];
  const championshipsParticipating = [];
  const nextRaces = [
    {
      id: 1,
      date: new Date("2024-02-15"),
      location: "Kartódromo Granja Viana",
      championship: "Campeonato Paulista de Kart",
      season: "2024",
      stage: 3,
      notification: {
        type: "warning",
        message: "Confirmação pendente",
      },
    },
    {
      id: 2,
      date: new Date("2024-02-28"),
      location: "Kartódromo Internacional Nova Odessa",
      championship: "Copa São Paulo Light",
      season: "2024",
      stage: 2,
      notification: null,
    },
    {
      id: 3,
      date: new Date("2024-03-10"),
      location: "Kartódromo de Interlagos",
      championship: "Super Copa SP",
      season: "2024",
      stage: 1,
      notification: {
        type: "success",
        message: "Confirmado",
      },
    },
  ];
  const rankings = [];
  const userStats = {
    memberSince: "2023",
    totalRaces: 0,
    totalChampionship: 0,
    bestPosition: "-",
    averagePosition: "-",
  };

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
              onClick={() => (window.location.href = "/complete-profile")}
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Campeonato
        </Button>
      </div>

      {/* Perfil e Estatísticas */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
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
            onClick={() => (window.location.href = "/complete-profile")}
          >
            Editar Perfil
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-4 text-center">
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
          <div>
            <h2 className="text-xl font-semibold">Organizando</h2>
            <p className="text-sm text-muted-foreground">
              Você Organiza ou Gerencia
            </p>
          </div>
          {championshipsOrganized.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Você ainda não organizou nenhum campeonato"
              action={{
                label: "Criar Primeiro Campeonato",
                onClick: () => {},
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Lista de campeonatos organizados */}
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
          <h2 className="text-xl font-semibold">Calendário de Corridas</h2>
          <p className="text-sm text-muted-foreground">
            Próximas corridas que você participa
          </p>
          {nextRaces.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="Nenhuma corrida agendada"
              action={{
                label: "Explorar Campeonatos",
                onClick: () => {},
              }}
            />
          ) : (
            <div className="space-y-4 mt-4">
              {nextRaces.map((race) => (
                <div
                  key={race.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRace(race)}
                >
                  <div className="flex-shrink-0 text-center">
                    <span className="block text-2xl font-bold">
                      {race.date.getDate()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {race.date.toLocaleDateString("pt-BR", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{race.championship}</h3>
                    <p className="text-sm text-muted-foreground">
                      {race.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Etapa {race.stage} - {race.season}
                    </p>
                  </div>
                  {race.notification && (
                    <div className="flex-shrink-0">
                      <Badge
                        variant={
                          race.notification.type as
                            | "warning"
                            | "success"
                            | "default"
                            | "destructive"
                            | "outline"
                            | "secondary"
                        }
                      >
                        {race.notification.message}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => (window.location.href = "/calendar")}
              >
                Ver Calendário Completo
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!selectedRace} onOpenChange={() => setSelectedRace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              <h2>{selectedRace?.championship}</h2>
              {selectedRace?.notification && (
                <Badge
                  variant={
                    selectedRace.notification.type as
                      | "warning"
                      | "success"
                      | "default"
                      | "destructive"
                      | "outline"
                      | "secondary"
                  }
                  className="mt-2"
                >
                  {selectedRace.notification.message}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-base text-foreground">
            <div className="space-y-4 my-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span>
                  {selectedRace?.date.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{selectedRace?.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>
                  Etapa {selectedRace?.stage} - Temporada {selectedRace?.season}
                </span>
              </div>
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="default"
              className="w-full"
              onClick={() => setSelectedRace(null)}
            >
              Confirmar Presença
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
