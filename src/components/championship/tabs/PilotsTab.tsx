import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Users, Mail, Phone, Calendar, MoreVertical, CheckCircle, XCircle, Clock } from "lucide-react";
import { EmptyState } from "brk-design-system";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "brk-design-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "brk-design-system";
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "brk-design-system";

import { SeasonRegistrationService, SeasonRegistration } from "@/lib/services/season-registration.service";
import { SeasonService } from "@/lib/services/season.service";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { formatDateToBrazilian } from "@/utils/date";
import PaymentInfo from "../pilots/PaymentInfo";

interface PilotsTabProps {
  championshipId: string;
}

// Configuração inicial dos filtros
const createFilterFields = (seasonOptions: { value: string; label: string }[] = []): FilterField[] => [
  {
    key: 'seasonId',
    label: 'Temporada',
    type: 'combobox',
    placeholder: 'Todas as temporadas',
    options: seasonOptions
  },
  {
    key: 'status',
    label: 'Status da Inscrição',
    type: 'combobox',
    placeholder: 'Todos os status',
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'pending', label: 'Pendente' },
      { value: 'confirmed', label: 'Confirmado' },
      { value: 'cancelled', label: 'Cancelado' },
      { value: 'expired', label: 'Expirado' }
    ]
  }
];

/**
 * Tab de pilotos inscritos no campeonato
 * Exibe lista de todos os pilotos inscritos nas temporadas do campeonato
 */
export const PilotsTab = ({ championshipId }: PilotsTabProps) => {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<keyof SeasonRegistration>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonOptions, setSeasonOptions] = useState<{ value: string; label: string }[]>([]);
  const [, setSeasons] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Memoizar a configuração dos filtros para evitar re-renders
  const filterFields = useMemo(() => createFilterFields(seasonOptions), [seasonOptions]);

  // Buscar temporadas do campeonato
  const fetchSeasons = useCallback(async () => {
    try {
      const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
      
      // Atualizar opções do filtro
      const newSeasonOptions = [
        { value: 'all', label: 'Todas as temporadas' },
        ...seasonsData.data.map((season: any) => ({
          value: season.id,
          label: season.name
        }))
      ];
      setSeasonOptions(newSeasonOptions);
      setSeasons(seasonsData.data);
      return seasonsData.data;
    } catch (err: any) {
      console.error('Error loading seasons:', err);
      return [];
    }
  }, [championshipId]);

  // Buscar registrações de todas as temporadas ou de uma específica
  const fetchRegistrations = useCallback(async (_seasons: any[] = []) => {
    try {
      setLoading(true);
      setError(null);

      let allRegistrations: SeasonRegistration[] = [];
      
      if (filters.seasonId && filters.seasonId !== 'all') {
        // Se filtro por temporada específica
        allRegistrations = await SeasonRegistrationService.getBySeasonId(filters.seasonId as string);
      } else {
        // Buscar todas as inscrições do campeonato diretamente
        allRegistrations = await SeasonRegistrationService.getByChampionshipId(championshipId);
      }

      setRegistrations(allRegistrations);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar inscrições');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [filters.seasonId, championshipId]);

  // Carregar dados iniciais
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      try {
        const seasons = await fetchSeasons();
        if (mounted) {
          await fetchRegistrations(seasons);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
    
    return () => {
      mounted = false;
    };
  }, [championshipId]);



  // Aplicar filtros e ordenação aos dados
  const processedRegistrations = useMemo(() => {
    let result = [...registrations];

    // Aplicar filtros
    result = result.filter(registration => {
      // Filtro por temporada
      if (filters.seasonId && filters.seasonId !== 'all' && registration.season.id !== filters.seasonId) {
        return false;
      }

      // Filtro por status
      if (filters.status && filters.status !== 'all' && registration.status !== filters.status) {
        return false;
      }

      return true;
    });

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Tratamento especial para diferentes tipos de dados
      if (sortBy === 'createdAt' || sortBy === 'paymentDate' || sortBy === 'confirmedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
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
  }, [registrations, filters, sortBy, sortOrder]);

  // Paginação dos dados processados
  const paginatedRegistrations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedRegistrations.slice(startIndex, endIndex);
  }, [processedRegistrations, currentPage, itemsPerPage]);

  // Informações de paginação
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(processedRegistrations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, processedRegistrations.length);
    
    return {
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [processedRegistrations.length, currentPage, itemsPerPage]);

  const handleSort = (column: keyof SeasonRegistration) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleFiltersChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    // Reset para primeira página quando filtros mudam
    setCurrentPage(1);
  }, []);

  // Handlers para paginação
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset para primeira página
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Pendente',
        icon: Clock,
      },
      confirmed: {
        color: 'bg-green-100 text-green-800',
        label: 'Confirmado',
        icon: CheckCircle,
      },
      cancelled: {
        color: 'bg-gray-200 text-gray-800',
        label: 'Cancelado',
        icon: XCircle,
      },
      expired: {
        color: 'bg-red-200 text-red-800',
        label: 'Expirado',
        icon: XCircle,
      },
    };

    const statusInfo =
      statusMap[status as keyof typeof statusMap] ||
      ({
        color: 'bg-gray-100 text-gray-800',
        label: status,
        icon: Users,
      } as const);

    const Icon = statusInfo.icon;

    return (
      <Badge className={`${statusInfo.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        <span>{statusInfo.label}</span>
      </Badge>
    );
  };

  const handleRegistrationAction = (action: string, registrationId: string) => {
    // Ações como "ver detalhes", "cancelar", "confirmar pagamento"
    console.log(`Ação: ${action} para Inscrição: ${registrationId}`);
  };

  const isPilotConfirmed = (registration: SeasonRegistration) => {
    return registration.status === 'confirmed';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar pilotos</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => fetchRegistrations()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (processedRegistrations.length === 0 && Object.keys(filters).length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum piloto inscrito"
        description="Ainda não há pilotos inscritos nas temporadas deste campeonato"
        action={{
          label: "Ver Temporadas",
          onClick: () => {
            // TODO: Navegar para aba de temporadas
            console.log("Navegar para temporadas");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <DynamicFilter
            fields={filterFields}
            onFiltersChange={handleFiltersChange}
            className="w-full"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {processedRegistrations.length} piloto{processedRegistrations.length !== 1 ? 's' : ''} encontrado{processedRegistrations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {registrations.filter(r => isPilotConfirmed(r)).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Confirmados
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {registrations.filter(r => r.status === 'payment_pending').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Pagamento Pendente
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {registrations.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Inscritos
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de pilotos */}
      <Card className="w-full flex flex-col min-h-[600px]">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Piloto
                  </div>
                </TableHead>
                <TableHead className="text-center">Temporada</TableHead>
                <TableHead className="text-center">Categorias</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    {sortBy === "status" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Pagamento</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data Inscrição
                    {sortBy === "createdAt" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum piloto encontrado com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRegistrations.map((registration) => (
                  <TableRow key={registration.id} className="hover:bg-muted/50">
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-medium">{registration.user.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {registration.user.email}
                        </div>
                        {registration.user.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {registration.user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="text-sm font-medium">
                        {registration.season.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {registration.categories && registration.categories.length > 0 ? (
                          registration.categories.map((regCategory) => (
                            <Badge key={regCategory.id} variant="outline" className="text-xs">
                              {regCategory.category.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem categorias</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {getStatusBadge(registration.status)}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <PaymentInfo registration={registration} />
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="text-sm">
                        {formatDateToBrazilian(registration.createdAt)}
                      </div>
                      {registration.confirmedAt && (
                        <div className="text-xs text-muted-foreground">
                          Confirmado em {formatDateToBrazilian(registration.confirmedAt)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleRegistrationAction("view", registration.id)}
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRegistrationAction("contact", registration.id)}
                          >
                            Entrar em contato
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRegistrationAction("payment", registration.id)}
                          >
                            Ver pagamento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação sempre fixada na parte inferior */}
        {processedRegistrations.length > 0 && (
          <div className="flex-shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={paginationInfo.totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={processedRegistrations.length}
              startIndex={paginationInfo.startIndex}
              endIndex={paginationInfo.endIndex}
              hasNextPage={paginationInfo.hasNextPage}
              hasPreviousPage={paginationInfo.hasPreviousPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </Card>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Inscrições com Pagamento Pendente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations
            .filter((r) => {
              if (!r.payments || r.payments.length === 0) return false;
              const paidCount = r.payments.filter(
                (p) =>
                  p.status === 'CONFIRMED' || p.status === 'RECEIVED',
              ).length;
              return paidCount < r.payments.length;
            })
            .map((registration) => (
              <Card key={registration.id}>
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold">{registration.user.name}</h4>
                    <PaymentInfo registration={registration} />
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    <p>Temporada: {registration.season.name}</p>
                    <p>Inscrito em: {formatDateToBrazilian(registration.createdAt)}</p>
                  </div>
                  <Button 
                    variant="link" 
                    className="mt-4"
                    onClick={() => handleRegistrationAction('view', registration.id)}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </Card>
            ))
          }
        </div>
      </div>
    </div>
  );
}; 