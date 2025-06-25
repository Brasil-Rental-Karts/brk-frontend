import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Users, Mail, Phone, Calendar, MoreVertical, Eye } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import { DynamicFilter, FilterField, FilterValues } from "@/components/ui/dynamic-filter";
import { Pagination } from "brk-design-system";

import { SeasonRegistrationService, SeasonRegistration } from "@/lib/services/season-registration.service";
import { SeasonService } from "@/lib/services/season.service";
import { CategoryService, Category } from "@/lib/services/category.service";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { formatDateToBrazilian } from "@/utils/date";
import PaymentInfo from "../pilots/PaymentInfo";
import { PilotDetailsModal } from "../pilots/PilotDetailsModal";

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
      { value: 'payment_pending', label: 'Aguardando pagamento' },
      { value: 'confirmed', label: 'Confirmado' },
      { value: 'cancelled', label: 'Cancelado' },
      { value: 'expired', label: 'Expirado' }
    ]
  },
  {
    key: 'paymentStatus',
    label: 'Status do Pagamento',
    type: 'combobox',
    placeholder: 'Todos os status de pagamento',
    options: [
      { value: 'all', label: 'Todos os status de pagamento' },
      { value: 'pending', label: 'Pendente' },
      { value: 'processing', label: 'Processando' },
      { value: 'paid', label: 'Pago' },
      { value: 'failed', label: 'Falhou' },
      { value: 'cancelled', label: 'Cancelado' },
      { value: 'refunded', label: 'Reembolsado' }
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

  // Estados para o modal de edição de categorias
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<SeasonRegistration | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [updatingCategories, setUpdatingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Estados para o modal de detalhes do piloto
  const [showPilotDetailsModal, setShowPilotDetailsModal] = useState(false);
  const [selectedPilotRegistrationId, setSelectedPilotRegistrationId] = useState<string | null>(null);

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

      // Filtro por status da inscrição
      if (filters.status && filters.status !== 'all' && registration.status !== filters.status) {
        return false;
      }

      // Filtro por status do pagamento
      if (filters.paymentStatus && filters.paymentStatus !== 'all' && registration.paymentStatus !== filters.paymentStatus) {
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

  const handleRegistrationAction = async (action: string, registrationId: string) => {
    if (action === "changeCategories") {
      try {
        // Buscar a inscrição completa
        const registration = await SeasonRegistrationService.getById(registrationId);
        setSelectedRegistration(registration);
        
        // Buscar categorias disponíveis da temporada
        const categories = await CategoryService.getBySeasonId(registration.seasonId);
        setAvailableCategories(categories);
        
        // Definir categorias atuais como selecionadas
        const currentCategoryIds = registration.categories?.map(cat => cat.category.id) || [];
        setSelectedCategoryIds(currentCategoryIds);
        
        setCategoryError(null);
        setShowCategoryModal(true);
      } catch (error: any) {
        console.error('Error opening category modal:', error);
        setCategoryError(error.message || 'Erro ao abrir modal de categorias');
      }
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleUpdateCategories = async () => {
    if (!selectedRegistration) return;

    try {
      setUpdatingCategories(true);
      setCategoryError(null);

      await SeasonRegistrationService.updateCategories(selectedRegistration.id, {
        categoryIds: selectedCategoryIds
      });

      // Atualizar a lista de inscrições
      await fetchRegistrations();
      
      // Fechar modal
      setShowCategoryModal(false);
      setSelectedRegistration(null);
      setSelectedCategoryIds([]);
      setAvailableCategories([]);
    } catch (error: any) {
      console.error('Error updating categories:', error);
      setCategoryError(error.message || 'Erro ao atualizar categorias');
    } finally {
      setUpdatingCategories(false);
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedRegistration(null);
    setSelectedCategoryIds([]);
    setAvailableCategories([]);
    setCategoryError(null);
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
                  onClick={() => handleSort("paymentStatus")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Status</span>
                    {sortBy === "paymentStatus" && (
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
                      <div className="space-y-2">
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
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Valor:</span> R$ {Number(registration.amount).toFixed(2).replace('.', ',')}
                        </div>
                        {registration.paymentMethod && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Método:</span> {
                              registration.paymentMethod === 'pix' ? 'PIX' : 
                              registration.paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' : 
                              registration.paymentMethod
                            }
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
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {registration.categories?.length || 0} categoria{(registration.categories?.length || 0) !== 1 ? 's' : ''}
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {registration.categories && registration.categories.length > 0 ? (
                            registration.categories.map((regCategory) => (
                              <Badge key={regCategory.id} variant="outline" className="text-xs">
                                <div className="flex flex-col items-center">
                                  <span>{regCategory.category.name}</span>
                                  <span className="text-xs opacity-75">
                                    {regCategory.category.ballast}kg
                                  </span>
                                </div>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem categorias</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge 
                        variant={
                          registration.status === 'confirmed' ? 'success' :
                          registration.status === 'pending' || registration.status === 'payment_pending' ? 'warning' :
                          registration.status === 'cancelled' || registration.status === 'expired' ? 'destructive' :
                          'default'
                        }
                        className="text-xs"
                      >
                        {registration.status === 'confirmed' ? 'Confirmado' : 
                         registration.status === 'payment_pending' ? 'Aguardando pagamento' :
                         registration.status === 'pending' ? 'Pendente' :
                         registration.status === 'cancelled' ? 'Cancelado' :
                         registration.status === 'expired' ? 'Expirado' : registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <PaymentInfo registration={registration} />
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="text-sm font-medium">
                        {formatDateToBrazilian(registration.createdAt)}
                      </div>
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
                            onClick={() => {
                              setSelectedPilotRegistrationId(registration.id);
                              setShowPilotDetailsModal(true);
                            }}
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRegistrationAction("changeCategories", registration.id)}
                          >
                            Trocar categorias
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

      {/* Modal de Edição de Categorias */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar Categorias</DialogTitle>
            <DialogDescription>
              Selecione as novas categorias para {selectedRegistration?.user.name}. 
              A quantidade deve ser a mesma da inscrição original ({selectedRegistration?.categories?.length || 0} categoria{selectedRegistration?.categories?.length !== 1 ? 's' : ''}).
            </DialogDescription>
          </DialogHeader>

          {categoryError && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{categoryError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="text-sm font-medium">
              Categorias selecionadas: {selectedCategoryIds.length} de {selectedRegistration?.categories?.length || 0}
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableCategories.map((category) => (
                <label key={category.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Lastro: {category.ballast}kg | Max. Pilotos: {category.maxPilots} | Idade mín.: {category.minimumAge} anos
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCategoryModal} disabled={updatingCategories}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateCategories} 
              disabled={updatingCategories || selectedCategoryIds.length !== (selectedRegistration?.categories?.length || 0)}
            >
              {updatingCategories ? 'Atualizando...' : 'Atualizar Categorias'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Piloto */}
      {selectedPilotRegistrationId && (
        <PilotDetailsModal
          isOpen={showPilotDetailsModal}
          onClose={() => {
            setShowPilotDetailsModal(false);
            setSelectedPilotRegistrationId(null);
          }}
          registrationId={selectedPilotRegistrationId}
        />
      )}
    </div>
  );
}; 