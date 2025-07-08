import { useState, useEffect, useRef } from "react";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { toast } from "sonner";
import { UserService } from "@/lib/services/user.service";
import { SeasonService } from "@/lib/services/season.service";
import { CategoryService } from "@/lib/services/category.service";
import { StageService } from "@/lib/services/stage.service";
import { SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";
import { X } from "lucide-react";
import { ChampionshipService } from "@/lib/services/championship.service";

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

interface User {
  id: string;
  name: string;
  email: string;
}

interface Championship {
  id: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
  championshipId: string;
  inscriptionValue: number;
  inscriptionType: 'por_temporada' | 'por_etapa';
}

interface Category {
  id: string;
  name: string;
}

interface Stage {
  id: string;
  name: string;
}

export const AdminPilotRegistration = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'exempt' | 'direct_payment'>('exempt');
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
    } else {
      setSelectedSeason(null);
    }
  }, [selectedSeasonId, seasons]);

  // Calculate amount when categories or stages change
  useEffect(() => {
    if (selectedSeasonId && selectedCategoryIds.length > 0) {
      calculateAmount();
    }
  }, [selectedSeasonId, selectedCategoryIds, selectedStageIds]);

  // Set amount to 0 when payment status is exempt
  useEffect(() => {
    if (paymentStatus === 'exempt') {
      setAmount(0);
      setAmountDisplay("R$ 0,00");
    } else if (selectedSeasonId && selectedCategoryIds.length > 0) {
      calculateAmount();
    }
  }, [paymentStatus, selectedSeasonId, selectedCategoryIds, selectedStageIds]);

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
      const seasonsData = await SeasonService.getAll(1, 100);
      const filteredSeasons = (seasonsData.data || []).filter(season => 
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
      const categoriesData = await CategoryService.getBySeasonId(seasonId);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
      setCategories([]);
    }
  };

  const loadStages = async (seasonId: string) => {
    try {
      const stagesData = await StageService.getBySeasonId(seasonId);
      setStages(stagesData || []);
    } catch (error) {
      console.error("Erro ao carregar etapas:", error);
      toast.error("Erro ao carregar etapas");
      setStages([]);
    }
  };

  const calculateAmount = () => {
    const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
    if (!selectedSeason) return;

    let calculatedAmount = 0;
    const baseValue = Number(selectedSeason.inscriptionValue);

    if (selectedSeason.inscriptionType === 'por_etapa' && selectedStageIds.length > 0) {
      // Por etapa: quantidade de categorias x quantidade de etapas x valor da inscrição
      calculatedAmount = baseValue * selectedCategoryIds.length * selectedStageIds.length;
    } else {
      // Por temporada: quantidade de categorias x valor da inscrição
      calculatedAmount = baseValue * selectedCategoryIds.length;
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

    // Validação específica por tipo de inscrição
    if (selectedSeason?.inscriptionType === 'por_etapa' && selectedStageIds.length === 0) {
      toast.error("Para inscrições por etapa, é obrigatório selecionar pelo menos uma etapa");
      return;
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

      await SeasonRegistrationService.createAdminRegistration(registrationData);
      
      toast.success("Inscrição administrativa criada com sucesso!");
      
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
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        {/* Seleção de Piloto */}
        <div className="space-y-2 relative">
          <Label htmlFor="user">Piloto *</Label>
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
                const userText = `${user.name} (${user.email})`;
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
          <Label htmlFor="championship">Campeonato *</Label>
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
          <Label htmlFor="season">Temporada *</Label>
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

      {/* Status de Pagamento */}
      <div className="space-y-2">
        <Label htmlFor="paymentStatus">Status de Pagamento *</Label>
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

      {/* Categorias */}
      {selectedSeasonId && categories.length > 0 && (
        <div className="space-y-2">
          <Label>Categorias *</Label>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {categories?.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={selectedCategoryIds.includes(category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                />
                <Label htmlFor={category.id} className="text-sm">{category.name}</Label>
              </div>
            )) || []}
          </div>
        </div>
      )}

      {/* Etapas (apenas para inscrição por etapa) */}
      {selectedSeason?.inscriptionType === 'por_etapa' && selectedSeasonId && stages.length > 0 && (
        <div className="space-y-2">
          <Label>Etapas *</Label>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {stages?.map((stage) => (
              <div key={stage.id} className="flex items-center space-x-2">
                <Checkbox
                  id={stage.id}
                  checked={selectedStageIds.includes(stage.id)}
                  onCheckedChange={(checked) => handleStageChange(stage.id, checked as boolean)}
                />
                <Label htmlFor={stage.id} className="text-sm">{stage.name}</Label>
              </div>
            )) || []}
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Para inscrições por etapa, é obrigatório selecionar pelo menos uma etapa
          </p>
        </div>
      )}

      {/* Valor */}
      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
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
          <p className="text-xs sm:text-sm text-gray-500">Valor automaticamente definido como R$ 0,00 para inscrições isentas</p>
        )}
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações sobre a inscrição..."
          rows={3}
          className="text-sm"
        />
      </div>

      {/* Botão de Envio */}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Criando inscrição..." : "Criar Inscrição Administrativa"}
      </Button>
    </form>
  );
}; 