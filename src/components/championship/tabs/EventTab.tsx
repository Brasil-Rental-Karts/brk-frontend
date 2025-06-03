import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, MapPin, Clock, Users, MoreVertical } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Event {
  id: string;
  title: string;
  description: string;
  type: "Corrida Especial" | "Cerimônia" | "Treinamento" | "Reunião" | "Confraternização";
  date: string;
  time: string;
  location: string;
  maxParticipants?: number;
  registeredParticipants: number;
  status: "Agendado" | "Em andamento" | "Concluído" | "Cancelado";
  isPublic: boolean;
}

interface EventTabProps {
  championshipId: string;
}

/**
 * Componente da aba Evento
 * Exibe lista de eventos especiais do campeonato com opções de gerenciamento
 */
export const EventTab = ({ championshipId: _championshipId }: EventTabProps) => {
  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data - substituir por dados reais da API
  const [events] = useState<Event[]>([
    {
      id: "1",
      title: "Cerimônia de Abertura",
      description: "Cerimônia oficial de abertura da temporada 2025",
      type: "Cerimônia",
      date: "2025-02-15",
      time: "19:00",
      location: "Kartódromo Granja Viana",
      maxParticipants: 200,
      registeredParticipants: 156,
      status: "Agendado",
      isPublic: true,
    },
    {
      id: "2",
      title: "Corrida das Estrelas",
      description: "Corrida especial com pilotos convidados",
      type: "Corrida Especial",
      date: "2025-04-20",
      time: "14:00",
      location: "Kartódromo Aldeia da Serra",
      maxParticipants: 50,
      registeredParticipants: 32,
      status: "Agendado",
      isPublic: true,
    },
    {
      id: "3",
      title: "Treinamento Técnico",
      description: "Sessão de treinamento para aperfeiçoamento técnico",
      type: "Treinamento",
      date: "2025-03-10",
      time: "09:00",
      location: "Kartódromo Granja Viana",
      registeredParticipants: 25,
      status: "Agendado",
      isPublic: false,
    },
    {
      id: "4",
      title: "Reunião de Pilotos",
      description: "Reunião para discussão das regras da temporada",
      type: "Reunião",
      date: "2025-02-01",
      time: "20:00",
      location: "Online",
      registeredParticipants: 78,
      status: "Concluído",
      isPublic: false,
    },
    {
      id: "5",
      title: "Confraternização de Final de Ano",
      description: "Evento de confraternização e premiação",
      type: "Confraternização",
      date: "2024-12-15",
      time: "18:00",
      location: "Clube Recreativo",
      maxParticipants: 150,
      registeredParticipants: 142,
      status: "Concluído",
      isPublic: true,
    },
  ]);

  const [sortBy, setSortBy] = useState<keyof Event>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (column: keyof Event) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddEvent = () => {
    console.log("Adicionar novo evento");
    // TODO: Implementar modal ou navegação para criação de evento
  };

  const handleEventAction = (action: string, eventId: string) => {
    console.log(`Ação: ${action} para evento: ${eventId}`);
    // TODO: Implementar ações específicas
  };

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "Agendado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Em andamento":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Concluído":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "Corrida Especial":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Cerimônia":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Treinamento":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Reunião":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Confraternização":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nenhum evento criado"
        description="Crie eventos especiais para engajar os participantes do campeonato"
        action={{
          label: "Adicionar Evento",
          onClick: handleAddEvent,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Eventos</h2>
          <p className="text-muted-foreground">
            Gerencie eventos especiais e atividades do campeonato
          </p>
        </div>
        <Button onClick={handleAddEvent} className="sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Evento
        </Button>
      </div>

      {/* Tabela de eventos */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("title")}
              >
                Evento
                {sortBy === "title" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("type")}
              >
                Tipo
                {sortBy === "type" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("date")}
              >
                Data/Hora
                {sortBy === "date" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-center">Participantes</TableHead>
              <TableHead>Visibilidade</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                Status
                {sortBy === "status" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getTypeColor(event.type)}
                  >
                    {event.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {formatTime(event.time)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{event.registeredParticipants}</span>
                    {event.maxParticipants && (
                      <span className="text-muted-foreground">/{event.maxParticipants}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={event.isPublic ? "default" : "secondary"}>
                    {event.isPublic ? "Público" : "Privado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(event.status)}
                  >
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEventAction("view", event.id)}
                      >
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEventAction("edit", event.id)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEventAction("participants", event.id)}
                      >
                        Ver participantes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEventAction("duplicate", event.id)}
                      >
                        Duplicar evento
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEventAction("delete", event.id)}
                        className="text-destructive"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}; 