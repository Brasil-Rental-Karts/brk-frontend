import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Users, Mail, Phone, Calendar, MoreVertical, Eye, Loader2 } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

import { SeasonRegistrationService, SeasonRegistration } from "@/lib/services/season-registration.service";
import { SeasonService } from "@/lib/services/season.service";
import { CategoryService, Category } from "@/lib/services/category.service";

import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { formatDateToBrazilian } from "@/utils/date";
import PaymentInfo from "../pilots/PaymentInfo";
import { PilotDetailsModal } from "../pilots/PilotDetailsModal";
import { InlineLoader } from '@/components/ui/loading';
import { Loading } from '@/components/ui/loading';

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
      { value: 'refunded', label: 'Reembolsado' },
      { value: 'exempt', label: 'Isento' },
      { value: 'direct_payment', label: 'Pagamento Direto' }
    ]
  }
];

const PilotCard = ({ registration, onAction, getStatusBadge }: { 
  registration: SeasonRegistration, 
  onAction: (action: string, registrationId: string) => void,
  getStatusBadge: (registration: SeasonRegistration) => JSX.Element 
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-semibold tracking-tight">{registration.user.name}</h3>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {getStatusBadge(registration)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onAction("viewDetails", registration.id)}
              >
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAction("changeCategories", registration.id)}
              >
                Trocar categorias
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {registration.user.email}
            </span>
          </div>
          {registration.user.phone && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-medium flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {registration.user.phone}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-muted-foreground">Temporada</span>
            <Badge variant="outline" className="w-fit mt-1">{registration.season.name}</Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-medium">R$ {Number(registration.amount).toFixed(2).replace('.', ',')}</span>
          </div>
          {registration.paymentMethod && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Método de Pagamento</span>
              <span className="font-medium">
                {registration.paymentStatus === 'exempt' ? 'Inscrição Administrativa - Isento' :
                 registration.paymentStatus === 'direct_payment' ? 'Inscrição Administrativa - Pagamento Direto' :
                 registration.paymentMethod === 'pix' ? 'PIX' : 
                 registration.paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' : 
                 registration.paymentMethod}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-muted-foreground">Data de Inscrição</span>
            <span className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateToBrazilian(registration.createdAt)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Categorias</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {registration.categories && registration.categories.length > 0 ? (
                registration.categories.map((regCategory) => (
                  <Badge key={regCategory.id} variant="outline" className="text-xs">
                    <div className="flex flex-col items-center">
                      <span>{regCategory.category.name}</span>
                      <span className="text-xs opacity-75">
                        Lastro: {regCategory.category.ballast}kg
                      </span>
                    </div>
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Sem categorias</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Status do Pagamento</span>
            <div className="mt-1">
              <PaymentInfo registration={registration} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Tab de pilotos inscritos no campeonato
 * Exibe lista de todos os pilotos inscritos nas temporadas do campeonato
 */
export const PilotsTab = ({ championshipId }: PilotsTabProps) => {
  const isMobile = useIsMobile();
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

  // --- Lógica para Mobile (Scroll Infinito) ---
  const [visibleMobileRegistrations, setVisibleMobileRegistrations] = useState<SeasonRegistration[]>([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const mobileItemsPerPage = 5;

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

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [registrations, filters, sortBy, sortOrder]);

  // --- Lógica para Desktop (Paginação) ---
  const paginationInfo = useMemo(() => {
    const totalItems = processedRegistrations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      totalPages,
      startIndex,
      endIndex,
      hasNextPage,
      hasPreviousPage
    };
  }, [processedRegistrations.length, currentPage, itemsPerPage]);

  const paginatedDesktopRegistrations = useMemo(() => {
    if (isMobile) return [];
    return processedRegistrations.slice(paginationInfo.startIndex, paginationInfo.endIndex);
  }, [isMobile, processedRegistrations, paginationInfo.startIndex, paginationInfo.endIndex]);

  // --- Lógica para Mobile (Scroll Infinito) ---
  useEffect(() => {
    if (isMobile) {
      setVisibleMobileRegistrations(processedRegistrations.slice(0, mobileItemsPerPage));
      setMobilePage(2);
      setHasMore(processedRegistrations.length > mobileItemsPerPage);
    }
  }, [isMobile, processedRegistrations]);

  const lastRegistrationElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoadingMore(true);
        setTimeout(() => {
          const newRegistrations = processedRegistrations.slice(0, mobilePage * mobileItemsPerPage);
          setVisibleMobileRegistrations(newRegistrations);
          setHasMore(newRegistrations.length < processedRegistrations.length);
          setMobilePage(prev => prev + 1);
          setLoadingMore(false);
        }, 300);
      }
    });

    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, mobilePage, processedRegistrations]);

  const processedRegistrationsForDisplay = isMobile ? visibleMobileRegistrations : paginatedDesktopRegistrations;

  const handleSort = (column: keyof SeasonRegistration) => {
    setSortBy(prevSortBy => {
      if (prevSortBy === column) {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortOrder('asc');
      }
      return column;
    });
    if (!isMobile) {
      setCurrentPage(1);
    }
  };

  const handleFiltersChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    if (!isMobile) {
      setCurrentPage(1);
    }
  }, [isMobile]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => setItemsPerPage(items);

  const handleRegistrationAction = async (action: string, registrationId: string) => {
    const registration = registrations.find(r => r.id === registrationId);
    if (!registration) return;

    switch (action) {
      case "changeCategories":
        try {
          const categories = await CategoryService.getBySeasonId(registration.season.id);
          setAvailableCategories(categories);
          setSelectedCategoryIds(registration.categories?.map(rc => rc.category.id) || []);
          setSelectedRegistration(registration);
          setCategoryError(null);
          setShowCategoryModal(true);
        } catch (err: any) {
          console.error('Error loading categories:', err);
        }
        break;
      case "viewDetails":
        setSelectedPilotRegistrationId(registrationId);
        setShowPilotDetailsModal(true);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  const getStatusBadge = (registration: SeasonRegistration) => {
    // Se for inscrição administrativa (isenta ou pagamento direto), considerar como confirmada
    if (registration.paymentStatus === 'exempt' || registration.paymentStatus === 'direct_payment') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
          Confirmado
        </Badge>
      );
    }

    return (
      <Badge 
        className={
          registration.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200 text-xs' :
          registration.status === 'pending' || registration.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 text-xs' :
          registration.status === 'cancelled' || registration.status === 'expired' ? 'bg-red-100 text-red-800 border-red-200 text-xs' :
          registration.status === 'exempt' ? 'bg-green-100 text-green-800 border-green-200 text-xs' :
          registration.status === 'direct_payment' ? 'bg-green-100 text-green-800 border-green-200 text-xs' :
          'bg-gray-100 text-gray-800 border-gray-200 text-xs'
        }
      >
        {registration.status === 'confirmed' ? 'Confirmado' : 
         registration.status === 'payment_pending' ? 'Aguardando pagamento' :
         registration.status === 'pending' ? 'Pendente' :
         registration.status === 'cancelled' ? 'Cancelado' :
         registration.status === 'expired' ? 'Expirado' : 
         registration.status === 'exempt' ? 'Isento' :
         registration.status === 'direct_payment' ? 'Pagamento Direto' :
         registration.status}
      </Badge>
    );
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
    return registration.status === 'confirmed' || 
           registration.paymentStatus === 'exempt' || 
           registration.paymentStatus === 'direct_payment';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <InlineLoader size="lg" />
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

      {isMobile ? (
        <>
          <div className="space-y-4">
            {processedRegistrationsForDisplay.map((registration, index) => (
              <div key={registration.id} ref={processedRegistrationsForDisplay.length === index + 1 ? lastRegistrationElementRef : null}>
                <PilotCard 
                  registration={registration} 
                  onAction={handleRegistrationAction}
                  getStatusBadge={getStatusBadge}
                />
              </div>
            ))}
          </div>
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <InlineLoader size="sm" />
            </div>
          )}
          {!loadingMore && !hasMore && processedRegistrationsForDisplay.length > 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Fim dos resultados.
            </div>
          )}
        </>
      ) : (
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
                {processedRegistrationsForDisplay.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum piloto encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  processedRegistrationsForDisplay.map((registration) => (
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
                                registration.paymentStatus === 'exempt' ? 'Inscrição Administrativa - Isento' :
                                registration.paymentStatus === 'direct_payment' ? 'Inscrição Administrativa - Pagamento Direto' :
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
                                      Lastro: {regCategory.category.ballast}kg
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
                        {getStatusBadge(registration)}
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
                              onClick={() => handleRegistrationAction("viewDetails", registration.id)}
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
      )}

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