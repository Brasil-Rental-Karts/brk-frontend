import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'brk-design-system';
import { Button, Badge, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, Textarea } from 'brk-design-system';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, UserCheck, UserX, AlertCircle, CheckCircle, XCircle, Clock, DollarSign, Users, Flag, Settings, ChevronDown, ChevronRight, ChevronUp, ChevronLeft, RefreshCw, RotateCcw, Play, Pause, SkipBack, SkipForward, FastForward, Rewind, Volume2, VolumeX, Mic, MicOff, Camera, CameraOff, Video, VideoOff, Image, File, Folder, FolderOpen, FolderPlus, FolderMinus, FolderX, FilePlus, FileMinus, FileX, FileCheck, FileEdit, FileSearch, FileImage, FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet, FileJson } from 'lucide-react';
import { UserService, User as UserType } from '@/lib/services/user.service';
import { SeasonRegistrationService, SeasonRegistration } from '@/lib/services/season-registration.service';
import { CategoryService, Category as CategoryType } from '@/lib/services/category.service';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';
import { formatName } from '@/utils/name';
import { SeasonService, Season as SeasonType, PaymentCondition } from "@/lib/services/season.service";
import { StageService } from "@/lib/services/stage.service";
import { formatCurrency } from "@/utils/currency";
import { X, User, Trophy, Calendar, CreditCard, Tag, MapPin, FileText } from "lucide-react";
import { ChampionshipService } from "@/lib/services/championship.service";
import { useChampionshipData } from "@/contexts/ChampionshipContext";

// Função para formatar valor monetário no input
const formatCurrencyInput = (value: string | number): string => {
  // Se for número, formata diretamente
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Se for string, remove tudo que não é número
  const numericValue = value.replace(/\D/g, '');
  
  // Converte para número e divide por 100 para ter centavos (apenas para input manual)
  const floatValue = parseFloat(numericValue) / 100;
  
  // Formata como moeda brasileira
  return floatValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para extrair valor numérico do input formatado
const extractNumericValue = (formattedValue: string): number => {
  // Remove símbolos de moeda e espaços, mantém apenas números e vírgula/ponto
  const cleanValue = formattedValue.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface ChampionshipData {
  id: string;
  name: string;
}

interface SeasonData {
  id: string;
  name: string;
  championshipId: string;
  inscriptionValue: number;
  inscriptionType: 'por_temporada' | 'por_etapa';
  paymentConditions?: any[];
}

interface CategoryData {
  id: string;
  name: string;
}

interface StageData {
  id: string;
  name: string;
}

export const AdminPilotRegistration = () => {
  // Usar o contexto de dados do campeonato
  const { getSeasons, getCategories, getStages } = useChampionshipData();

  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [championships, setChampionships] = useState<ChampionshipData[]>([]);
  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [stages, setStages] = useState<StageData[]>([]);
  const [availableStages, setAvailableStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<SeasonData | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'exempt' | 'direct_payment'>('exempt');
  const [selectedPaymentCondition, setSelectedPaymentCondition] = useState<PaymentCondition | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [amountDisplay, setAmountDisplay] = useState<string>("R$ 0,00");
  const [notes, setNotes] = useState<string>("");

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userInputRef = useRef<HTMLInputElement>(null);
  const [selectedUserText, setSelectedUserText] = useState("");

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load seasons when championship changes
  useEffect(() => {
    if (selectedChampionshipId) {
      loadSeasons(selectedChampionshipId);
      setSelectedSeasonId("");
      setSelectedSeason(null);
      setCategories([]);
      setStages([]);
      // Zerar valor e seleções quando trocar campeonato
      setAmount(0);
      setAmountDisplay("R$ 0,00");
      setSelectedCategoryIds([]);
      setSelectedStageIds([]);
    }
  }, [selectedChampionshipId]);

  // Load categories when season changes
  useEffect(() => {
    if (selectedSeasonId) {
      // Encontrar a temporada selecionada
      const season = seasons.find(s => s.id === selectedSeasonId);
      setSelectedSeason(season || null);
      
      loadCategories(selectedSeasonId);
      loadStages(selectedSeasonId);
      // Zerar valor e seleções quando trocar temporada
      setAmount(0);
      setAmountDisplay("R$ 0,00");
      setSelectedCategoryIds([]);
      setSelectedStageIds([]);
      setSelectedPaymentCondition(null);
    } else {
      setSelectedSeason(null);
    }
  }, [selectedSeasonId, seasons]);

  // Calculate amount when categories or stages change
  useEffect(() => {
    if (selectedSeasonId && selectedCategoryIds.length > 0) {
      calculateAmount();
    } else if (selectedSeasonId && selectedCategoryIds.length === 0) {
      // Reset amount when no categories are selected
      setAmount(0);
      setAmountDisplay("R$ 0,00");
    }
  }, [selectedSeasonId, selectedCategoryIds, selectedStageIds, selectedPaymentCondition]);

  // Set amount to 0 when payment status is exempt
  useEffect(() => {
    if (paymentStatus === 'exempt') {
      setAmount(0);
      setAmountDisplay("R$ 0,00");
      setSelectedPaymentCondition(null);
    } else if (paymentStatus === 'direct_payment' && selectedSeasonId && selectedCategoryIds.length > 0) {
      calculateAmount();
    }
  }, [paymentStatus]);

  // Filter users when search term changes
  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered.slice().sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [userSearchTerm, users]);

  // Filter available stages when user and stages are loaded
  useEffect(() => {
    if (selectedUserId && selectedSeasonId && stages.length > 0) {
      filterAvailableStages();
    } else {
      setAvailableStages(stages);
    }
  }, [selectedUserId, selectedSeasonId, stages]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userInputRef.current &&
        !userInputRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    }
    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      const usersData = await UserService.getAll(1, 100);
      // Ordena os usuários por nome
      const sortedUsers = (usersData.data || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);

      // Load championships
      const championshipsData = await ChampionshipService.getAll();
      setChampionships((championshipsData || []).slice().sort((a, b) => a.name.localeCompare(b.name)));

      // Load seasons (will be filtered by championship later)
      const seasonsData = await SeasonService.getAll(1, 100);
      const processedSeasons = (seasonsData.data || []).map(season => {
        let inscriptionValue = season.inscriptionValue;
        if (typeof inscriptionValue === 'string') {
          // Remove símbolos de moeda e espaços, converte vírgula para ponto
          inscriptionValue = parseFloat(inscriptionValue.replace(/[^\d,.-]/g, '').replace(',', '.'));
        }
        return {
          ...season,
          inscriptionValue: Number(inscriptionValue) || 0,
          inscriptionType: SeasonService.getInscriptionType(season)
        };
      });
      setSeasons(processedSeasons);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
      // Initialize with empty arrays to prevent undefined errors
      setUsers([]);
      setFilteredUsers([]);
      setChampionships([]);
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSeasons = async (championshipId: string) => {
    try {
      // Usar temporadas do contexto em vez de buscar do backend
      const allSeasons = getSeasons();
      const filteredSeasons = allSeasons.filter(season => 
        season.championshipId === championshipId
      ).map(season => {
        let inscriptionValue = season.inscriptionValue;
        if (typeof inscriptionValue === 'string') {
          // Remove símbolos de moeda e espaços, converte vírgula para ponto
          inscriptionValue = parseFloat(inscriptionValue.replace(/[^\d,.-]/g, '').replace(',', '.'));
        }
        return {
          ...season,
          inscriptionValue: Number(inscriptionValue) || 0,
          inscriptionType: SeasonService.getInscriptionType(season)
        };
      });
      setSeasons(filteredSeasons);
    } catch (error) {
      console.error("Erro ao carregar temporadas:", error);
      toast.error("Erro ao carregar temporadas");
      setSeasons([]);
    }
  };

  const loadCategories = async (seasonId: string) => {
    try {
      // Usar categorias do contexto em vez de buscar do backend
      const allCategories = getCategories();
      const seasonCategories = allCategories.filter(cat => cat.seasonId === seasonId);
      setCategories(seasonCategories || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
      setCategories([]);
    }
  };

  const loadStages = async (seasonId: string) => {
    try {
      // Usar etapas do contexto em vez de buscar do backend
      const allStages = getStages();
      const seasonStages = allStages.filter(stage => stage.seasonId === seasonId);
      setStages(seasonStages || []);
    } catch (error) {
      console.error("Erro ao carregar etapas:", error);
      toast.error("Erro ao carregar etapas");
      setStages([]);
    }
  };

  const filterAvailableStages = async () => {
    if (!selectedUserId || !selectedSeasonId || stages.length === 0) {
      setAvailableStages(stages);
      return;
    }

    try {
      // Buscar inscrições existentes do usuário na temporada
      const userRegistrations = await SeasonRegistrationService.getUserRegistrationsBySeason(selectedUserId, selectedSeasonId);
      
      // Se não há inscrições, todas as etapas estão disponíveis
      if (userRegistrations.length === 0) {
        setAvailableStages(stages);
        return;
      }

      // Extrair IDs das etapas já inscritas
      const registeredStageIds = new Set<string>();
      userRegistrations.forEach(registration => {
        if (registration.stages && registration.stages.length > 0) {
          registration.stages.forEach(stageReg => {
            if (stageReg.stage && stageReg.stage.id) {
              registeredStageIds.add(stageReg.stage.id);
            }
          });
        }
      });

      // Filtrar etapas que o usuário ainda não tem inscrição
      const availableStagesFiltered = stages.filter(stage => !registeredStageIds.has(stage.id));
      setAvailableStages(availableStagesFiltered);
    } catch (error) {
      console.error("Erro ao filtrar etapas disponíveis:", error);
      // Em caso de erro, mostrar todas as etapas
      setAvailableStages(stages);
    }
  };

  const calculateAmount = () => {
    const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
    if (!selectedSeason) {
      return;
    }

    let calculatedAmount = 0;
    
    // Se uma condição de pagamento foi selecionada, usar ela
    if (selectedPaymentCondition) {
      const baseValue = selectedPaymentCondition.value;
      const inscriptionType = selectedPaymentCondition.type;

      if (paymentStatus === 'exempt') {
        calculatedAmount = 0;
      } else if (inscriptionType === 'por_etapa' && selectedStageIds.length > 0) {
        // Por etapa: quantidade de categorias x quantidade de etapas x valor da inscrição
        calculatedAmount = baseValue * selectedCategoryIds.length * selectedStageIds.length;
      } else if (inscriptionType === 'por_temporada') {
        // Por temporada: quantidade de categorias x valor da inscrição
        calculatedAmount = baseValue * selectedCategoryIds.length;
      } else if (inscriptionType === 'por_etapa' && selectedStageIds.length === 0) {
        // Por etapa mas sem etapas selecionadas
        calculatedAmount = 0;
      }
    } else {
      // Fallback para método legado
      const baseValue = SeasonService.getInscriptionValue(selectedSeason as SeasonType);
      const inscriptionType = SeasonService.getInscriptionType(selectedSeason as SeasonType);

      if (paymentStatus === 'exempt') {
        calculatedAmount = 0;
      } else if (inscriptionType === 'por_etapa' && selectedStageIds.length > 0) {
        calculatedAmount = baseValue * selectedCategoryIds.length * selectedStageIds.length;
      } else if (inscriptionType === 'por_temporada') {
        calculatedAmount = baseValue * selectedCategoryIds.length;
      } else if (inscriptionType === 'por_etapa' && selectedStageIds.length === 0) {
        calculatedAmount = 0;
      }
    }

    setAmount(calculatedAmount);
    setAmountDisplay(formatCurrencyInput(calculatedAmount));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds(prev => [...prev, categoryId]);
    } else {
      setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
    }
  };

  const handleStageChange = (stageId: string, checked: boolean) => {
    if (checked) {
      setSelectedStageIds(prev => [...prev, stageId]);
    } else {
      setSelectedStageIds(prev => prev.filter(id => id !== stageId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !selectedSeasonId || selectedCategoryIds.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar se uma condição de pagamento foi selecionada (quando há condições disponíveis)
    if (selectedSeason?.paymentConditions && selectedSeason.paymentConditions.length > 0 && !selectedPaymentCondition) {
      toast.error("Selecione uma condição de pagamento");
      return;
    }

    // Validação específica por tipo de inscrição
    const inscriptionType = selectedPaymentCondition ? selectedPaymentCondition.type : 
      (selectedSeason ? SeasonService.getInscriptionType(selectedSeason as SeasonType) : 'por_temporada');
    
    if (inscriptionType === 'por_etapa') {
      if (availableStages.length === 0) {
        toast.error("O usuário já possui inscrição em todas as etapas disponíveis para esta temporada");
        return;
      }
      if (selectedStageIds.length === 0) {
        toast.error("Para inscrições por etapa, é obrigatório selecionar pelo menos uma etapa");
        return;
      }
    }

    setSubmitting(true);
    try {
      const registrationData = {
        userId: selectedUserId,
        seasonId: selectedSeasonId,
        categoryIds: selectedCategoryIds,
        stageIds: selectedStageIds.length > 0 ? selectedStageIds : undefined,
        paymentStatus,
        amount,
        notes: notes || undefined
      };

      const result = await SeasonRegistrationService.createAdminRegistration(registrationData);
      
      toast.success(result.isUpdate ? "Inscrição administrativa atualizada com sucesso!" : "Inscrição administrativa criada com sucesso!");
      
      // Reset form
      setSelectedUserId("");
      setSelectedSeasonId("");
      setSelectedSeason(null);
      setSelectedCategoryIds([]);
      setSelectedStageIds([]);
      setPaymentStatus('exempt');
      setAmount(0);
      setAmountDisplay("R$ 0,00");
      setNotes("");
      
    } catch (error: any) {
      console.error("Erro ao criar inscrição:", error);
      toast.error(error.message || "Erro ao criar inscrição administrativa");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção 1: Informações Básicas */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
              <CardDescription>Selecione o piloto e a competição</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Seleção de Piloto */}
            <div className="space-y-2 relative md:col-span-2">
              <Label htmlFor="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Piloto *
              </Label>
              <div className="relative flex items-center">
                <Input
                  ref={userInputRef}
                  id="user"
                  autoComplete="off"
                  placeholder="Pesquisar piloto por nome ou email..."
                  value={selectedUserId ? selectedUserText : userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setSelectedUserId("");
                    setSelectedUserText("");
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => {
                    if (!selectedUserId) setShowUserDropdown(true);
                  }}
                  readOnly={!!selectedUserId}
                  className={selectedUserId ? "pr-8" : ""}
                  required
                />
                {selectedUserId && (
                  <button
                    type="button"
                    className="absolute right-2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setSelectedUserId("");
                      setSelectedUserText("");
                      setUserSearchTerm("");
                      setShowUserDropdown(true);
                      userInputRef.current?.focus();
                    }}
                    tabIndex={-1}
                    aria-label="Limpar seleção de piloto"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {showUserDropdown && !selectedUserId && filteredUsers && filteredUsers.length > 0 && (
                <ul className="absolute z-[9999] bg-white border border-gray-300 rounded-md shadow-lg w-full max-h-48 overflow-auto mt-1">
                  {filteredUsers.map((user) => {
                    const userText = `${formatName(user.name)} (${user.email})`;
                    return (
                      <li
                        key={user.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedUserId(user.id);
                          setSelectedUserText(userText);
                          setUserSearchTerm("");
                          setShowUserDropdown(false);
                        }}
                      >
                        {userText}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Seleção de Campeonato */}
            <div className="space-y-2">
              <Label htmlFor="championship" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Campeonato *
              </Label>
              <Select value={selectedChampionshipId} onValueChange={setSelectedChampionshipId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um campeonato" />
                </SelectTrigger>
                <SelectContent>
                  {championships?.map((championship) => (
                    <SelectItem key={championship.id} value={championship.id}>
                      {championship.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seleção de Temporada */}
          {selectedChampionshipId && (
            <div className="space-y-2">
              <Label htmlFor="season" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Temporada *
              </Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma temporada" />
                </SelectTrigger>
                <SelectContent>
                  {seasons?.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 2: Configuração de Pagamento */}
      {selectedSeason && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Configuração de Pagamento</CardTitle>
                <CardDescription>Defina o status e condições de pagamento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Status de Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="paymentStatus" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Status de Pagamento *
                </Label>
                <Select value={paymentStatus} onValueChange={(value: 'exempt' | 'direct_payment') => setPaymentStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exempt">Isento</SelectItem>
                    <SelectItem value="direct_payment">Pagamento Direto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de Condição de Pagamento */}
              {selectedSeason.paymentConditions && selectedSeason.paymentConditions.length > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Condição de Pagamento *
                  </Label>
                  <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                    {selectedSeason.paymentConditions
                      .filter(condition => condition.enabled)
                      .map((condition, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id={`condition-${index}`}
                            name="paymentCondition"
                            value={index}
                            checked={selectedPaymentCondition === condition}
                            onChange={() => setSelectedPaymentCondition(condition)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <Label htmlFor={`condition-${index}`} className="flex-1 cursor-pointer">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {condition.type === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
                              </span>
                              <span className="text-sm text-gray-600">
                                {formatCurrency(condition.value)}
                                {condition.description && ` - ${condition.description}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                Métodos: {condition.paymentMethods.join(', ').replace('pix', 'PIX').replace('cartao_credito', 'Cartão de Crédito')}
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Selecione a condição de pagamento que será aplicada para esta inscrição administrativa
                  </p>
                </div>
              )}
            </div>

            {/* Mensagem quando não há condições de pagamento */}
            {(!selectedSeason.paymentConditions || selectedSeason.paymentConditions.length === 0) && (
              <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p>Esta temporada não possui condições de pagamento configuradas. Será usado o valor padrão da temporada.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção 3: Seleção de Categorias e Etapas */}
      {selectedSeasonId && categories.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Categorias e Etapas</CardTitle>
                <CardDescription>Selecione as categorias e etapas para inscrição</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Categorias */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categorias *
                </Label>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {categories?.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={category.id}
                        checked={selectedCategoryIds.includes(category.id)}
                        onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                      />
                      <Label htmlFor={category.id} className="text-sm cursor-pointer flex-1">{category.name}</Label>
                    </div>
                  )) || []}
                </div>
              </div>

              {/* Etapas (apenas para inscrição por etapa) */}
              {selectedSeason && (
                (selectedPaymentCondition && selectedPaymentCondition.type === 'por_etapa') || 
                (!selectedPaymentCondition && SeasonService.getInscriptionType(selectedSeason as SeasonType) === 'por_etapa')
              ) && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Etapas *
                  </Label>
                  {selectedUserId && availableStages.length > 0 && (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {availableStages?.map((stage) => (
                        <div key={stage.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={stage.id}
                            checked={selectedStageIds.includes(stage.id)}
                            onCheckedChange={(checked) => handleStageChange(stage.id, checked as boolean)}
                          />
                          <Label htmlFor={stage.id} className="text-sm cursor-pointer flex-1">{stage.name}</Label>
                        </div>
                      )) || []}
                    </div>
                  )}
                  {selectedUserId && availableStages.length === 0 && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p>O usuário já possui inscrição em todas as etapas disponíveis para esta temporada.</p>
                    </div>
                  )}
                  {!selectedUserId && stages.length > 0 && (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {stages?.map((stage) => (
                        <div key={stage.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={stage.id}
                            checked={selectedStageIds.includes(stage.id)}
                            onCheckedChange={(checked) => handleStageChange(stage.id, checked as boolean)}
                          />
                          <Label htmlFor={stage.id} className="text-sm cursor-pointer flex-1">{stage.name}</Label>
                        </div>
                      )) || []}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Para inscrições por etapa, é obrigatório selecionar pelo menos uma etapa
                    {selectedUserId && (
                      <span className="block mt-1 text-blue-600">
                        Mostrando apenas etapas onde o usuário ainda não possui inscrição
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 4: Valor e Observações */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Valor e Observações</CardTitle>
              <CardDescription>Confirme o valor e adicione observações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Valor (R$)
              </Label>
              <Input
                id="amount"
                type="text"
                value={amountDisplay}
                onChange={(e) => {
                  if (paymentStatus !== 'exempt') {
                    const numericValue = extractNumericValue(e.target.value);
                    setAmount(numericValue);
                    setAmountDisplay(formatCurrencyInput(e.target.value));
                  }
                }}
                onBlur={(e) => {
                  if (paymentStatus !== 'exempt') {
                    const numericValue = extractNumericValue(e.target.value);
                    setAmount(numericValue);
                    setAmountDisplay(formatCurrencyInput(numericValue));
                  }
                }}
                placeholder="R$ 0,00"
                disabled={paymentStatus === 'exempt'}
                className={paymentStatus === 'exempt' ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
              {paymentStatus === 'exempt' && (
                <p className="text-xs text-gray-500">Valor automaticamente definido como R$ 0,00 para inscrições isentas</p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a inscrição..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          {/* Cálculo do valor */}
          {paymentStatus !== 'exempt' && selectedSeason && selectedCategoryIds.length > 0 && (
            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-medium mb-2">Cálculo do valor:</p>
              {selectedPaymentCondition ? (
                <>
                  <p>Condição selecionada: {selectedPaymentCondition.type === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}</p>
                  <p>Valor base: {formatCurrency(selectedPaymentCondition.value)}</p>
                  <p>Categorias selecionadas: {selectedCategoryIds.length}</p>
                  {selectedPaymentCondition.type === 'por_etapa' && selectedStageIds.length > 0 && (
                    <p>Etapas selecionadas: {selectedStageIds.length}</p>
                  )}
                  <p className="font-medium mt-2">
                    Total: {selectedPaymentCondition.type === 'por_etapa' && selectedStageIds.length > 0 
                      ? `${formatCurrency(selectedPaymentCondition.value)} × ${selectedCategoryIds.length} categorias × ${selectedStageIds.length} etapas = ${amountDisplay}`
                      : `${formatCurrency(selectedPaymentCondition.value)} × ${selectedCategoryIds.length} categorias = ${amountDisplay}`
                    }
                  </p>
                </>
              ) : (
                <>
                  <p>Valor base: {formatCurrency(SeasonService.getInscriptionValue(selectedSeason as SeasonType))}</p>
                  <p>Categorias selecionadas: {selectedCategoryIds.length}</p>
                  {SeasonService.getInscriptionType(selectedSeason as SeasonType) === 'por_etapa' && selectedStageIds.length > 0 && (
                    <p>Etapas selecionadas: {selectedStageIds.length}</p>
                  )}
                  <p className="font-medium mt-2">
                    Total: {SeasonService.getInscriptionType(selectedSeason as SeasonType) === 'por_etapa' && selectedStageIds.length > 0 
                      ? `${formatCurrency(SeasonService.getInscriptionValue(selectedSeason as SeasonType))} × ${selectedCategoryIds.length} categorias × ${selectedStageIds.length} etapas = ${amountDisplay}`
                      : `${formatCurrency(SeasonService.getInscriptionValue(selectedSeason as SeasonType))} × ${selectedCategoryIds.length} categorias = ${amountDisplay}`
                    }
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Envio */}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} className="min-w-[200px]">
          {submitting ? "Criando inscrição..." : "Criar Inscrição Administrativa"}
        </Button>
      </div>
    </form>
  );
}; 