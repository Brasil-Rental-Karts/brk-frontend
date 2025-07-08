import { useState, useEffect, useRef } from "react";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { toast } from "sonner";
import { ChampionshipService } from "@/lib/services/championship.service";
import { SeasonService } from "@/lib/services/season.service";
import { StageService } from "@/lib/services/stage.service";
import { SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";
import { X } from "lucide-react";

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

interface Championship {
  id: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
  championshipId: string;
  inscriptionType: 'por_temporada' | 'por_etapa';
  inscriptionValue: number;
}

interface Stage {
  id: string;
  name: string;
}

interface SeasonRegistration {
  id: string;
  userId: string;
  seasonId: string;
  status: string;
  paymentStatus: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  stages?: Array<{
    id: string;
    stageId: string;
    stage: {
      id: string;
      name: string;
    };
  }>;
}

export const AddStageToRegistration = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<SeasonRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string>("");
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'exempt' | 'direct_payment'>('exempt');
  const [amount, setAmount] = useState<number>(0);
  const [amountDisplay, setAmountDisplay] = useState<string>("R$ 0,00");
  const [notes, setNotes] = useState<string>("");
  const [pilotSearchTerm, setPilotSearchTerm] = useState('');
  const [showPilotDropdown, setShowPilotDropdown] = useState(false);
  const [selectedPilotText, setSelectedPilotText] = useState("");

  const pilotInputRef = useRef<HTMLInputElement>(null);

  // Load data on component mount
  useEffect(() => {
    loadChampionships();
  }, []);

  // Load seasons when championship changes
  useEffect(() => {
    if (selectedChampionshipId) {
      loadSeasons(selectedChampionshipId);
      resetForm();
    }
  }, [selectedChampionshipId]);

  // Load registrations and stages when season changes
  useEffect(() => {
    if (selectedSeasonId) {
      const season = seasons.find(s => s.id === selectedSeasonId);
      setSelectedSeason(season || null);
      
      if (season && season.inscriptionType === 'por_etapa') {
        loadRegistrations(selectedSeasonId);
        loadStages(selectedSeasonId);
      } else {
        setRegistrations([]);
        setStages([]);
      }
      
      // Reset selection
      setSelectedRegistrationId("");
      setSelectedStageIds([]);
      setPilotSearchTerm("");
      setSelectedPilotText("");
    } else {
      setSelectedSeason(null);
    }
  }, [selectedSeasonId, seasons]);

  // Filter registrations when search term changes
  useEffect(() => {
    if (pilotSearchTerm.trim() === '') {
      setFilteredRegistrations(registrations);
    } else {
      const filtered = registrations.filter(reg =>
        reg.user.name.toLowerCase().includes(pilotSearchTerm.toLowerCase()) ||
        reg.user.email.toLowerCase().includes(pilotSearchTerm.toLowerCase())
      );
      setFilteredRegistrations(filtered);
    }
  }, [pilotSearchTerm, registrations]);

  // Set amount to 0 when payment status is exempt
  useEffect(() => {
    if (paymentStatus === 'exempt') {
      setAmount(0);
      setAmountDisplay("R$ 0,00");
    } else if (paymentStatus === 'direct_payment' && selectedSeason && selectedStageIds.length > 0) {
      calculateStageAmount();
    }
  }, [paymentStatus]);

  // Calculate amount when stages change for direct payment
  useEffect(() => {
    if (paymentStatus === 'direct_payment' && selectedSeason && selectedStageIds.length > 0) {
      calculateStageAmount();
    }
  }, [selectedStageIds, selectedSeason, paymentStatus]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pilotInputRef.current &&
        !pilotInputRef.current.contains(event.target as Node)
      ) {
        setShowPilotDropdown(false);
      }
    }
    if (showPilotDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPilotDropdown]);

  const loadChampionships = async () => {
    setLoading(true);
    try {
      const championshipsData = await ChampionshipService.getAll();
      setChampionships((championshipsData || []).slice().sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Erro ao carregar campeonatos:", error);
      toast.error("Erro ao carregar campeonatos");
      setChampionships([]);
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

  const loadRegistrations = async (seasonId: string) => {
    try {
      const registrationsData = await SeasonRegistrationService.getBySeasonId(seasonId);
      // Filtrar apenas inscrições confirmadas ou administrativas
      const validRegistrations = registrationsData.filter(reg => 
        reg.status === 'confirmed' || 
        reg.paymentStatus === 'exempt' || 
        reg.paymentStatus === 'direct_payment'
      );
      setRegistrations(validRegistrations);
      setFilteredRegistrations(validRegistrations);
    } catch (error) {
      console.error("Erro ao carregar inscrições:", error);
      toast.error("Erro ao carregar inscrições");
      setRegistrations([]);
      setFilteredRegistrations([]);
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

  const resetForm = () => {
    setSelectedSeasonId("");
    setSelectedSeason(null);
    setSelectedRegistrationId("");
    setSelectedStageIds([]);
    setPilotSearchTerm("");
    setSelectedPilotText("");
    setRegistrations([]);
    setStages([]);
  };

  const calculateStageAmount = () => {
    if (!selectedSeason || selectedStageIds.length === 0) return;

    let calculatedAmount = 0;
    const baseValue = Number(selectedSeason.inscriptionValue);

    if (selectedSeason.inscriptionType === 'por_etapa') {
      // Por etapa: quantidade de etapas selecionadas × valor da inscrição
      calculatedAmount = baseValue * selectedStageIds.length;
    }

    setAmount(calculatedAmount);
    setAmountDisplay(formatCurrencyInput(calculatedAmount));
  };

  const handleStageChange = (stageId: string, checked: boolean) => {
    if (checked) {
      setSelectedStageIds(prev => [...prev, stageId]);
    } else {
      setSelectedStageIds(prev => prev.filter(id => id !== stageId));
    }
  };

  const getAvailableStages = () => {
    if (!selectedRegistrationId) return stages;
    
    const selectedRegistration = registrations.find(reg => reg.id === selectedRegistrationId);
    if (!selectedRegistration || !selectedRegistration.stages) return stages;
    
    // Filter out stages that the pilot is already enrolled in
    const enrolledStageIds = selectedRegistration.stages.map(stage => stage.stageId);
    return stages.filter(stage => !enrolledStageIds.includes(stage.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRegistrationId || selectedStageIds.length === 0) {
      toast.error("Selecione um piloto e pelo menos uma etapa");
      return;
    }

    if (!paymentStatus) {
      toast.error("Selecione o status de pagamento");
      return;
    }

    if (paymentStatus === 'direct_payment' && amount <= 0) {
      toast.error("Para pagamento direto, o valor deve ser maior que zero");
      return;
    }

    setSubmitting(true);
    try {
      const addStagesData = {
        stageIds: selectedStageIds,
        paymentStatus,
        amount,
        notes: notes || undefined
      };

      await SeasonRegistrationService.addStagesToRegistration(selectedRegistrationId, addStagesData);
      
      toast.success("Etapas adicionadas com sucesso!");
      
      // Reset form
      setSelectedRegistrationId("");
      setSelectedStageIds([]);
      setPaymentStatus('exempt');
      setAmount(0);
      setAmountDisplay("R$ 0,00");
      setNotes("");
      setPilotSearchTerm("");
      setSelectedPilotText("");
      
      // Reload registrations to update the list
      if (selectedSeasonId) {
        loadRegistrations(selectedSeasonId);
      }
      
    } catch (error: any) {
      console.error("Erro ao adicionar etapas:", error);
      toast.error(error.message || "Erro ao adicionar etapas");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
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
                        {season.name} {season.inscriptionType === 'por_temporada' && '(Por Temporada)'}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Aviso para temporadas por temporada */}
          {selectedSeason && selectedSeason.inscriptionType === 'por_temporada' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                Esta temporada é do tipo "Por Temporada". Apenas temporadas "Por Etapa" permitem adicionar etapas individuais.
              </p>
            </div>
          )}

          {/* Seleção de Piloto */}
          {selectedSeason && selectedSeason.inscriptionType === 'por_etapa' && (
            <>
              <div className="space-y-2 relative">
                <Label htmlFor="pilot">Piloto Inscrito *</Label>
                <div className="relative flex items-center">
                  <Input
                    ref={pilotInputRef}
                    id="pilot"
                    autoComplete="off"
                    placeholder="Pesquisar piloto inscrito por nome ou email..."
                    value={selectedRegistrationId ? selectedPilotText : pilotSearchTerm}
                    onChange={(e) => {
                      setPilotSearchTerm(e.target.value);
                      setSelectedRegistrationId("");
                      setSelectedPilotText("");
                      setShowPilotDropdown(true);
                    }}
                    onFocus={() => {
                      if (!selectedRegistrationId) setShowPilotDropdown(true);
                    }}
                    readOnly={!!selectedRegistrationId}
                    className={selectedRegistrationId ? "pr-8" : ""}
                    required
                  />
                  {selectedRegistrationId && (
                    <button
                      type="button"
                      className="absolute right-2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setSelectedRegistrationId("");
                        setSelectedPilotText("");
                        setPilotSearchTerm("");
                        setSelectedStageIds([]);
                        setShowPilotDropdown(true);
                        pilotInputRef.current?.focus();
                      }}
                      tabIndex={-1}
                      aria-label="Limpar seleção de piloto"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {showPilotDropdown && !selectedRegistrationId && filteredRegistrations && filteredRegistrations.length > 0 && (
                  <ul className="absolute z-[9999] bg-white border border-gray-300 rounded-md shadow-lg w-full max-h-48 overflow-auto mt-1">
                                         {filteredRegistrations.map((registration) => {
                       const pilotText = `${registration.user.name} (${registration.user.email})`;
                       const enrolledStagesCount = registration.stages?.length || 0;
                       
                       const getStatusText = () => {
                         if (registration.paymentStatus === 'exempt') return 'Isento';
                         if (registration.paymentStatus === 'direct_payment') return 'Pagamento Direto';
                         if (registration.status === 'confirmed') return 'Confirmado';
                         return 'Pendente';
                       };
                       
                       const getStatusColor = () => {
                         if (registration.paymentStatus === 'exempt') return 'text-blue-600';
                         if (registration.paymentStatus === 'direct_payment') return 'text-green-600';
                         if (registration.status === 'confirmed') return 'text-emerald-600';
                         return 'text-yellow-600';
                       };
                       
                       return (
                         <li
                           key={registration.id}
                           className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm"
                           onMouseDown={(e) => {
                             e.preventDefault();
                             setSelectedRegistrationId(registration.id);
                             setSelectedPilotText(pilotText);
                             setPilotSearchTerm("");
                             setShowPilotDropdown(false);
                             setSelectedStageIds([]);
                           }}
                         >
                           <div>{pilotText}</div>
                           <div className="text-xs text-gray-500 flex items-center justify-between">
                             <span>{enrolledStagesCount} etapa(s) inscrita(s)</span>
                             <span className={`font-medium ${getStatusColor()}`}>
                               {getStatusText()}
                             </span>
                           </div>
                         </li>
                       );
                     })}
                  </ul>
                )}
                                 {filteredRegistrations.length === 0 && selectedSeasonId && (
                   <p className="text-sm text-gray-500 mt-2">
                     Nenhum piloto inscrito (confirmado ou administrativo) encontrado nesta temporada.
                   </p>
                 )}
              </div>

              {/* Etapas Disponíveis */}
              {selectedRegistrationId && (
                <div className="space-y-2">
                  <Label>Etapas Disponíveis *</Label>
                  {getAvailableStages().length > 0 ? (
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                      {getAvailableStages().map((stage) => (
                        <div key={stage.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={stage.id}
                            checked={selectedStageIds.includes(stage.id)}
                            onCheckedChange={(checked) => handleStageChange(stage.id, checked as boolean)}
                          />
                          <Label htmlFor={stage.id} className="text-sm">{stage.name}</Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Este piloto já está inscrito em todas as etapas disponíveis.
                    </p>
                  )}
                </div>
              )}

              {/* Campos de Pagamento */}
              {selectedRegistrationId && getAvailableStages().length > 0 && (
                <>
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
                      <p className="text-xs sm:text-sm text-gray-500">Valor automaticamente definido como R$ 0,00 para etapas isentas</p>
                    )}
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre as etapas adicionais..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </>
              )}

              {/* Botão de Envio */}
              {selectedRegistrationId && getAvailableStages().length > 0 && (
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Adicionando etapas..." : "Adicionar Etapas"}
                </Button>
              )}
            </>
          )}
        </form>
    </div>
  );
}; 