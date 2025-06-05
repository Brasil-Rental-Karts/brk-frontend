import { useState, useMemo, useCallback } from "react";
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
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/usePagination";
import { formatDateToBrazilian, compareDates } from "@/utils/date";

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

// Configuração dos filtros
const filterFields: FilterField[] = [
  {
    key: 'type',
    label: 'Tipo',
    type: 'combobox',
    placeholder: 'Selecionar tipo',
    options: [
      { value: 'Corrida Especial', label: 'Corrida Especial' },
      { value: 'Cerimônia', label: 'Cerimônia' },
      { value: 'Treinamento', label: 'Treinamento' },
      { value: 'Reunião', label: 'Reunião' },
      { value: 'Confraternização', label: 'Confraternização' },
    ]
  },
  {
    key: 'status',
    label: 'Status',
    type: 'combobox',
    placeholder: 'Selecionar status',
    options: [
      { value: 'Agendado', label: 'Agendado' },
      { value: 'Em andamento', label: 'Em andamento' },
      { value: 'Concluído', label: 'Concluído' },
      { value: 'Cancelado', label: 'Cancelado' },
    ]
  },
  {
    key: 'title',
    label: 'Título',
    type: 'text',
    placeholder: 'Buscar por título',
  }
];

/**
 * Componente da aba Evento
 * Exibe lista de eventos especiais do campeonato com opções de gerenciamento
 */
export const EventTab = ({ championshipId: _championshipId }: EventTabProps) => {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof Event>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data expandido para testar paginação
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
    {
      id: "6",
      title: "Workshop de Mecânica",
      description: "Workshop técnico sobre mecânica de kart",
      type: "Treinamento",
      date: "2025-05-15",
      time: "10:00",
      location: "Oficina Central",
      maxParticipants: 30,
      registeredParticipants: 18,
      status: "Agendado",
      isPublic: true,
    },
    {
      id: "7",
      title: "Corrida Noturna",
      description: "Corrida especial com iluminação artificial",
      type: "Corrida Especial",
      date: "2025-06-10",
      time: "20:00",
      location: "Kartódromo Speed Park",
      maxParticipants: 40,
      registeredParticipants: 12,
      status: "Agendado",
      isPublic: true,
    },
    {
      id: "8",
      title: "Reunião Mensal",
      description: "Reunião mensal da diretoria do campeonato",
      type: "Reunião",
      date: "2025-01-15",
      time: "19:30",
      location: "Sede do Clube",
      registeredParticipants: 15,
      status: "Concluído",
      isPublic: false,
    },
    {
      id: "9",
      title: "Festa de Encerramento",
      description: "Festa para celebrar o fim da temporada",
      type: "Confraternização",
      date: "2025-11-30",
      time: "19:00",
      location: "Salão de Festas",
      maxParticipants: 200,
      registeredParticipants: 0,
      status: "Agendado",
      isPublic: true,
    },
    {
      id: "10",
      title: "Cerimônia de Premiação",
      description: "Cerimônia oficial de premiação dos campeões",
      type: "Cerimônia",
      date: "2025-12-05",
      time: "18:00",
      location: "Teatro Municipal",
      maxParticipants: 300,
      registeredParticipants: 0,
      status: "Agendado",
      isPublic: true,
    },
  ]);

  // Aplicar filtros e ordenação aos dados
  const processedEvents = useMemo(() => {
    let result = [...events];

    // Aplicar filtros
    result = result.filter(event => {
      // Filtro por tipo
      if (filters.type && event.type !== filters.type) {
        return false;
      }

      // Filtro por status
      if (filters.status && event.status !== filters.status) {
        return false;
      }

      // Filtro por título
      if (filters.title && !event.title.toLowerCase().includes(filters.title.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Tratamento especial para diferentes tipos de dados
      if (sortBy === 'date') {
        // Usar função utilitária para comparar datas
        const comparison = compareDates(aValue, bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [events, filters, sortBy, sortOrder]);

  // Configuração da paginação
  const pagination = usePagination(processedEvents.length, 5, 1);
  
  // Dados da página atual
  const currentPageEvents = useMemo(() => {
    const { startIndex, endIndex } = pagination.info;
    return processedEvents.slice(startIndex, endIndex);
  }, [processedEvents, pagination.info]);

  const handleSort = (column: keyof Event) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddEvent = () => {
    
    // TODO: Implementar modal ou navegação para criação de evento
  };

  const handleEventAction = (_action: string, _eventId: string) => {
    
    // TODO: Implementar ações específicas
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

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getParticipantsInfo = (registered: number, max?: number) => {
    if (max) {
      const percentage = (registered / max) * 100;
      const color = percentage >= 80 ? "text-red-600" : 
                   percentage >= 60 ? "text-yellow-600" : "text-green-600";
      return { text: `${registered}/${max}`, color };
    }
    return { text: `${registered}`, color: "text-muted-foreground" };
  };

  const handleFiltersChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    // Reset para primeira página quando filtros mudam
    pagination.actions.goToFirstPage();
  }, [pagination.actions.goToFirstPage]);

  // Handlers diretos para paginação
  const handlePageChange = useCallback((page: number) => {
    pagination.actions.setCurrentPage(page);
  }, [pagination.actions.setCurrentPage]);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    pagination.actions.setItemsPerPage(itemsPerPage);
  }, [pagination.actions.setItemsPerPage]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'agendado': { color: 'bg-blue-100 text-blue-800', label: 'Agendado' },
      'em_andamento': { color: 'bg-green-100 text-green-800', label: 'Em andamento' },
      'cancelado': { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
      'finalizado': { color: 'bg-gray-100 text-gray-800', label: 'Finalizado' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (processedEvents.length === 0 && Object.keys(filters).length === 0) {
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
    <div className="space-y-6 h-full flex flex-col">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
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

      {/* Filtros dinâmicos */}
      <div className="flex-shrink-0">
        <DynamicFilter
          fields={filterFields}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Tabela de eventos com altura adaptável */}
      <Card className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("title")}
                >
                  Título
                  {sortBy === "title" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("type")}
                >
                  Tipo
                  {sortBy === "type" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("date")}
                >
                  Data e Hora
                  {sortBy === "date" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("location")}
                >
                  Local
                  {sortBy === "location" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("registeredParticipants")}
                >
                  Participantes
                  {sortBy === "registeredParticipants" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 py-3"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortBy === "status" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="w-10 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum evento encontrado com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                currentPageEvents.map((event) => {
                  const participantsInfo = getParticipantsInfo(event.registeredParticipants, event.maxParticipants);
                  
                  return (
                    <TableRow key={event.id} className="hover:bg-muted/50">
                      <TableCell className="py-2">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {event.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={getTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDateToBrazilian(event.date)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.time)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-xs">{event.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm font-medium ${participantsInfo.color}`}>
                            {participantsInfo.text}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {getStatusBadge(event.status.toLowerCase())}
                      </TableCell>
                      <TableCell className="py-2">
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
                              Gerenciar participantes
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação sempre fixada na parte inferior */}
        <div className="flex-shrink-0">
          <Pagination
            currentPage={pagination.state.currentPage}
            totalPages={pagination.info.totalPages}
            itemsPerPage={pagination.state.itemsPerPage}
            totalItems={pagination.state.totalItems}
            startIndex={pagination.info.startIndex}
            endIndex={pagination.info.endIndex}
            hasNextPage={pagination.info.hasNextPage}
            hasPreviousPage={pagination.info.hasPreviousPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      </Card>
    </div>
  );
}; 