import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "brk-design-system";
import { Button, Badge } from "brk-design-system";
import { ChevronDown, MoreVertical, CheckCircle, XCircle, Loader2, ChevronRight, Plus, Minus, GripVertical, Edit, Copy, Trash2, Circle, X, Share2, Search, Upload, BarChart3, AlertTriangle, Clock, MapPin, Ban } from "lucide-react";
import { CategoryService, Category } from '@/lib/services/category.service';
import { SeasonRegistrationService, SeasonRegistration } from '@/lib/services/season-registration.service';
import { Loading } from '@/components/ui/loading';
import { StageParticipationService, StageParticipation } from '@/lib/services/stage-participation.service';
import { toast } from "sonner";
import { formatName } from '@/utils/name';
import { useAuth } from '@/contexts/AuthContext';
import { StageService } from '@/lib/services/stage.service';
import { PenaltyService, Penalty, PenaltyType, PenaltyStatus } from '@/lib/services/penalty.service';
import { useNavigate } from 'react-router-dom';
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { Stage as StageType } from "@/lib/types/stage";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'brk-design-system';
import { createPortal } from "react-dom";
import { RaceTrackService } from '@/lib/services/race-track.service';
import { LapTimesService, LapTimes as LapTimesType } from '@/lib/services/lap-times.service';
import * as XLSX from 'xlsx';
import { formatTimeWithPenalty, convertTimeToMs, convertMsToTime } from '@/utils/time';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { BulkConfirmPilotsModal } from '@/components/championship/modals/BulkConfirmPilotsModal';



interface SeasonWithStages {
  id: string;
  name: string;
  status?: string;
  stages?: StageType[];
  inscriptionType?: 'por_temporada' | 'por_etapa';
}

interface RaceDayTabProps {
  championshipId?: string;
}

interface ScheduleItem {
  id: string;
  label: string;
  time: string;
}

const RaceDayHeader: React.FC<{
  seasons: SeasonWithStages[];
  selectedSeasonId: string;
  onSelectSeason: (seasonId: string) => void;
  stages: StageType[];
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
}> = ({ seasons, selectedSeasonId, onSelectSeason, stages, selectedStageId, onSelectStage }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-8">
      {/* Temporada */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1 font-medium" htmlFor="season-select">Temporada</label>
        <div className="relative">
          <select
            id="season-select"
            className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 font-bold text-base pr-8 focus:outline-none focus:border-orange-500 min-w-[140px]"
            value={selectedSeasonId}
            onChange={e => {
              const seasonId = e.target.value;
              onSelectSeason(seasonId);
              // Resetar para a primeira etapa da nova temporada
              const newSeason = seasons.find(s => s.id === seasonId);
              const newSeasonStages = stages.filter(stage => stage.seasonId === seasonId);
              if (newSeasonStages.length > 0) {
                onSelectStage(newSeasonStages[0].id);
              }
            }}
          >
            {seasons.map(season => (
              <option key={season.id} value={season.id}>{season.name}</option>
            ))}
          </select>
          <ChevronDown className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      {/* Etapa */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1 font-medium" htmlFor="stage-select">Etapa</label>
        <div className="relative">
          <select
            id="stage-select"
            className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 font-semibold text-base pr-8 focus:outline-none focus:border-orange-500 min-w-[140px]"
            value={selectedStageId}
            onChange={e => onSelectStage(e.target.value)}
          >
            {stages.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
          <ChevronDown className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
    <Button variant="outline" className="rounded-full px-4 py-1 h-8 text-sm font-semibold flex items-center gap-1">
      Visão geral
      <ChevronDown className="w-4 h-4 text-muted-foreground" />
    </Button>
  </div>
);

export const RaceDayTab: React.FC<RaceDayTabProps> = ({ championshipId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Usar o contexto de dados do campeonato
  const { 
    getCategories, 
    getRegistrations, 
    getPenalties, 
    getRaceTracks,
    getStages,
    getStageParticipations,
    getSeasons,
    getChampionshipInfo,
    updateStage,
    refreshPenalties,
    loading: contextLoading, 
    error: contextError
  } = useChampionshipData();
  
  // Obter temporadas e dados do campeonato do contexto
  const seasons = getSeasons();
  const championship = getChampionshipInfo();
  
  // Ler parâmetros da URL para restaurar estado
  const urlParams = new URLSearchParams(window.location.search);
  const urlSeason = urlParams.get('season');
  const urlStage = urlParams.get('stage');
  const urlCategory = urlParams.get('category');
  const urlBattery = urlParams.get('battery');
  
  // Filtrar temporadas válidas
  const validSeasons = seasons.filter((s: any) => s.status === 'agendado' || s.status === 'em_andamento');
  // Função para pegar etapa mais próxima
  function getClosestStage(stages: any[]) {
    if (!stages || stages.length === 0) return undefined;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const stagesWithDate = stages
      .map(s => ({ ...s, dateObj: s.date ? new Date(s.date) : null, dateStr: s.date ? s.date.slice(0, 10) : null }));
    // Filtrar etapas de hoje ou futuras
    const futureOrTodayStages = stagesWithDate.filter(s => {
      if (!s.dateStr) return false;
      return s.dateStr >= todayStr;
    }).sort((a, b) => (a.dateStr as string).localeCompare(b.dateStr as string));
    if (futureOrTodayStages.length > 0) {
      return futureOrTodayStages[0].id;
    }
    // Se não houver, retorna a última etapa
    const sorted = stagesWithDate
      .filter(s => s.dateStr)
      .sort((a, b) => (a.dateStr as string).localeCompare(b.dateStr as string));
    if (sorted.length > 0) {
      return sorted[sorted.length - 1].id;
    }
    return stages[0].id;
  }
  // Estado de seleção
  const [selectedSeasonId, setSelectedSeasonId] = useState(() => {
    // Se há parâmetro de temporada na URL, usar ele
    if (urlSeason !== null) {
      return urlSeason;
    }
    if (validSeasons.length > 0) return validSeasons[0].id;
    return seasons[0]?.id || "";
  });
  const selectedSeason = seasons.find((s: SeasonWithStages) => s.id === selectedSeasonId) || seasons[0];
  
  // Usar etapas do contexto filtradas por temporada (memoizado para evitar recálculos)
  const allContextStages = useMemo(() => getStages(), [getStages]);
  const stages = useMemo(() => 
    allContextStages.filter((stage: StageType) => stage.seasonId === selectedSeasonId),
    [allContextStages, selectedSeasonId]
  );
  
  const [selectedStageId, setSelectedStageId] = useState(() => {
    // Se há parâmetro de etapa na URL, usar ele
    if (urlStage !== null) {
      return urlStage;
    }
    return getClosestStage(stages) || "";
  });
  const selectedStage = stages.find(s => s.id === selectedStageId) || stages[0];
  
  // Obter dados do contexto
  const contextCategories = getCategories();
  const contextRegistrations = getRegistrations();
  const contextPenalties = getPenalties();
  const contextRaceTracks = getRaceTracks();
  
  // Filtrar dados por temporada selecionada
  const categories = contextCategories.filter(cat => cat.seasonId === selectedSeasonId);
  const registrations = contextRegistrations.filter(reg => reg.season.id === selectedSeasonId);
  const filteredPenalties = contextPenalties.filter(penalty => penalty.stageId === selectedStageId);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageParticipations, setStageParticipations] = useState<StageParticipation[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemTime, setNewItemTime] = useState('');
  const [pilotLoading, setPilotLoading] = useState<{ [key: string]: boolean }>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showFleetDrawModal, setShowFleetDrawModal] = useState(false);
  const [fleetDrawResults, setFleetDrawResults] = useState<{[categoryId: string]: {[pilotId: string]: { [batteryIndex: number]: { kart: number } } } }>({});
  const [categoryFleetAssignments, setCategoryFleetAssignments] = useState<{[categoryId: string]: string}>({});
  const [drawVersion, setDrawVersion] = useState(0);
  const [openKartTooltip, setOpenKartTooltip] = useState<string | null>(null);
  const [selectedOverviewCategory, setSelectedOverviewCategory] = useState<string | null>(() => {
    // Se há parâmetro de categoria na URL, usar ele
    if (urlCategory !== null) {
      return urlCategory;
    }
    return null;
  });
  // Novo estado para bateria selecionada
  const [selectedBatteryIndex, setSelectedBatteryIndex] = useState<number>(() => {
    // Se há parâmetro de bateria na URL, usar ele
    if (urlBattery !== null && urlBattery !== '') {
      const batteryIndex = Number(urlBattery);
      // Validar se é um número válido e não negativo
      if (!isNaN(batteryIndex) && batteryIndex >= 0) {
        return batteryIndex;
      }
    }
    return 0;
  });
  const [pilotWeights, setPilotWeights] = useState<Record<string, boolean>>({});
  const [stageResults, setStageResults] = useState<any>({});
  const [showKartSelectionModal, setShowKartSelectionModal] = useState(false);
  const [selectedPilotForKartChange, setSelectedPilotForKartChange] = useState<{categoryId: string, pilotId: string, batteryIndex: number} | null>(null);
  const [kartLoading, setKartLoading] = useState(false);
  // Adicionar estados para seleção de posição
  const [showPositionSelectionModal, setShowPositionSelectionModal] = useState(false);
  const [selectedPilotForPosition, setSelectedPilotForPosition] = useState<{
    categoryId: string;
    pilotId: string;
    batteryIndex: number;
    type: 'startPosition' | 'finishPosition';
  } | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  // Estado para ordenação da tabela
  const [sortColumn, setSortColumn] = useState<string>('piloto');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estados para importação
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importType, setImportType] = useState<'race' | 'qualification' | 'lapTimes'>('race');
  
  // Estados para lap times
  const [lapTimes, setLapTimes] = useState<{ [categoryId: string]: LapTimesType[] }>({});
  const [showLapTimesChart, setShowLapTimesChart] = useState(false);
  const [selectedPilotsForChart, setSelectedPilotsForChart] = useState<string[]>([]);
  const [lapTimesLoading, setLapTimesLoading] = useState(false);
  
  // Estados para penalidades
  // Penalties agora vêm do contexto
  const [penaltiesLoading, setPenaltiesLoading] = useState(false);
  
  // Estado para modal de confirmação em massa
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  // Atualizar selectedBatteryIndex quando a URL mudar
  useEffect(() => {
    if (urlBattery !== null && urlBattery !== '') {
      const batteryIndex = Number(urlBattery);
      // Validar se é um número válido e não negativo
      if (!isNaN(batteryIndex) && batteryIndex >= 0) {
        setSelectedBatteryIndex(batteryIndex);
      }
    }
  }, [urlBattery]);

  // Cores fixas para cada piloto baseado no userId
  const getPilotColor = (userId: string): string => {
    const colors = [
      '#f97316', '#3b82f6', '#ef4444', '#22c55e', '#a855f7', 
      '#f59e0b', '#06b6d4', '#84cc16', '#ec4899', '#6366f1',
      '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6',
      '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'
    ];
    
    // Criar um hash simples do userId para garantir consistência
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };


  // Função para alternar a visibilidade do formulário de adicionar item
  const toggleAddItemForm = () => {
    setShowAddItemForm(!showAddItemForm);
    // Limpar campos quando ocultar o formulário
    if (showAddItemForm) {
      setNewItemLabel('');
      setNewItemTime('');
    }
  };

  // Função para abrir modal de confirmação em massa
  const handleOpenBulkConfirmModal = () => {
    setShowBulkConfirmModal(true);
  };

  // Função para fechar modal de confirmação em massa
  const handleCloseBulkConfirmModal = () => {
    setShowBulkConfirmModal(false);
  };

  // Função para quando a confirmação em massa for bem-sucedida
  const handleBulkConfirmSuccess = () => {
    // Recarregar participações da etapa
    if (selectedStageId) {
      // O contexto será atualizado automaticamente pelo modal
      toast.success('Pilotos confirmados com sucesso!');
    }
  };



  // Função para abrir o modal de sorteio de frota
  const handleOpenFleetDrawModal = () => {
    setShowFleetDrawModal(true);
    // Inicializar atribuições de frota por categoria
    const initialAssignments: {[categoryId: string]: string} = {};
    categories.forEach(category => {
      if (fleets.length > 0) {
        initialAssignments[category.id] = fleets[0].id;
      }
    });
    setCategoryFleetAssignments(initialAssignments);
  };

  // Função para fechar o modal de sorteio de frota
  const handleCloseFleetDrawModal = () => {
    setShowFleetDrawModal(false);
    // Não limpar o estado aqui - manter os dados do sorteio
  };

  // Função para realizar o sorteio de frota
  const performFleetDraw = () => {
    const results: { [categoryId: string]: { [pilotId: string]: { [batteryIndex: number]: { kart: number } } } } = {};

    categories.forEach(category => {
      const assignedFleetId = categoryFleetAssignments[category.id];
      if (!assignedFleetId) {
        return;
      }

      const fleet = fleets.find(f => f.id === assignedFleetId);
      if (!fleet) {
        return;
      }

      // Obter pilotos confirmados na categoria
      const categoryPilots = registrations.filter(reg =>
        reg.categories.some((rc: any) => rc.category.id === category.id) &&
        stageParticipations.some(
          (part) => part.userId === reg.userId && part.categoryId === category.id && part.status === 'confirmed'
        )
      );
      if (categoryPilots.length === 0) {
        return;
      }

      // Obter baterias da categoria
      const batteries = category.batteriesConfig || [];
      if (batteries.length === 0) return;

      // Obter karts disponíveis (não inativos)
      const inactiveKartsForFleet = inactiveKarts[assignedFleetId] || [];
      const availableKarts = Array.from({ length: fleet.totalKarts }, (_, i) => i + 1)
        .filter(kart => !inactiveKartsForFleet.includes(kart - 1));
      if (availableKarts.length === 0) return;

      results[category.id] = {};
      // Inicializar histórico de karts por piloto
      const pilotKartHistory = new Map<string, Set<number>>();
      categoryPilots.forEach(pilot => pilotKartHistory.set(pilot.userId, new Set()));

      // Para cada bateria, sorteia karts para os pilotos
      for (let batteryIndex = 0; batteryIndex < batteries.length; batteryIndex++) {
        // Embaralhar os karts disponíveis para esta bateria
        let kartsForThisBattery = [...availableKarts];
        // Embaralhar pilotos para esta bateria
        let pilotsForThisBattery = [...categoryPilots];
        // Shuffle
        kartsForThisBattery.sort(() => Math.random() - 0.5);
        pilotsForThisBattery.sort(() => Math.random() - 0.5);

        // Para evitar deadlock, limitar tentativas
        let attempts = 0;
        let success = false;
        while (!success && attempts < 20) {
          success = true;
          const usedKarts = new Set<number>();
          for (let i = 0; i < pilotsForThisBattery.length; i++) {
            const pilot = pilotsForThisBattery[i];
            const history = pilotKartHistory.get(pilot.userId) || new Set();
            // Karts disponíveis para este piloto nesta bateria
            const possibleKarts = kartsForThisBattery.filter(kart => !history.has(kart) && !usedKarts.has(kart));
            if (possibleKarts.length === 0) {
              // Não foi possível, tentar outro embaralhamento
              success = false;
              break;
            }
            // Sorteia um kart
            const kart = possibleKarts[Math.floor(Math.random() * possibleKarts.length)];
            usedKarts.add(kart);
            // Salva resultado
            if (!results[category.id][pilot.userId]) results[category.id][pilot.userId] = {};
            results[category.id][pilot.userId][batteryIndex] = { kart };
          }
          if (!success) {
            // Tentar outro shuffle
            kartsForThisBattery.sort(() => Math.random() - 0.5);
            pilotsForThisBattery.sort(() => Math.random() - 0.5);
            attempts++;
          }
        }
        // Atualiza histórico
        if (success) {
          for (let i = 0; i < pilotsForThisBattery.length; i++) {
            const pilot = pilotsForThisBattery[i];
            const kart = results[category.id][pilot.userId][batteryIndex]?.kart;
            if (kart) {
              pilotKartHistory.get(pilot.userId)?.add(kart);
            }
          }
        } else {
          // Se não conseguiu, limpa os resultados desta bateria
          pilotsForThisBattery.forEach(pilot => {
            if (results[category.id][pilot.userId]) {
              delete results[category.id][pilot.userId][batteryIndex];
            }
          });
        }
      }
    });
    setFleetDrawResults(results);
    return results;
  };

  // Limpar estado quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Cleanup code here if needed
    };
  }, []);

  // Limpar estado quando a etapa mudar
  useEffect(() => {
    // Ocultar formulário de adicionar item quando mudar de etapa
    setShowAddItemForm(false);
    setNewItemLabel('');
    setNewItemTime('');
    // Fechar modal de sorteio quando mudar de etapa
    setShowFleetDrawModal(false);
    // Fechar modal de importação quando mudar de etapa
    setShowImportModal(false);
    // Não resetar fleetDrawResults e categoryFleetAssignments aqui
    // Eles serão carregados pelo useEffect específico
  }, [selectedStageId]);

  // --- Frotas ---
  type Fleet = { id: string; name: string; totalKarts: number };
  const [fleets, setFleets] = useState<Fleet[]>([
    { id: '1', name: 'Frota 1', totalKarts: 20 },
  ]);

  // Calcular o número máximo de pilotos confirmados entre todas as categorias
  const getMaxPilots = () => {
    let maxPilots = 0;
    categories.forEach(category => {
      const categoryPilots = registrations.filter(reg =>
        reg.categories.some((rc: any) => rc.category.id === category.id) &&
        stageParticipations.some(
          (part) => part.userId === reg.userId && part.categoryId === category.id && part.status === 'confirmed'
        )
      );
      maxPilots = Math.max(maxPilots, categoryPilots.length);
    });
    return maxPilots;
  };

  // Função para obter o mínimo de karts ativos necessário
  const getMinKartsRequired = () => getMaxPilots();

  // Função para calcular karts ativos de uma frota
  const getActiveKartsCount = (fleetId: string) => {
    const fleet = fleets.find(f => f.id === fleetId);
    if (!fleet) return 0;
    const inactiveKartsForFleet = inactiveKarts[fleetId] || [];
    return fleet.totalKarts - inactiveKartsForFleet.length;
  };

  /**
   * Carregar frotas da etapa selecionada
   * 
   * Lógica de carregamento:
   * 1. Se a etapa tem frotas cadastradas → usa as frotas da etapa
   * 2. Se a etapa NÃO tem frotas cadastradas → busca frotas padrão do kartódromo
   * 3. Se o kartódromo não tem frotas padrão → usa frota genérica padrão
   * 4. Em caso de erro → usa frota genérica padrão
   */
  const loadFleets = async () => {
    if (!selectedStage?.id) return;
    try {
      // Usar selectedStage do contexto diretamente
      if (selectedStage.fleets && Array.isArray(selectedStage.fleets) && selectedStage.fleets.length > 0) {
        setFleets(selectedStage.fleets);
        // Carregar estado dos karts inativos
        const newInactiveKarts: { [fleetId: string]: number[] } = {};
        selectedStage.fleets.forEach((fleet: any) => {
          if (fleet.inactiveKarts && Array.isArray(fleet.inactiveKarts)) {
            newInactiveKarts[fleet.id] = fleet.inactiveKarts;
          }
        });
        setInactiveKarts(newInactiveKarts);
      } else {
        // Se não há frotas salvas, buscar frotas padrão do kartódromo
        if (selectedStage.raceTrackId) {
          try {
            // Usar dados do contexto em vez de buscar do backend
            const raceTrack = contextRaceTracks[selectedStage.raceTrackId];
            if (raceTrack?.defaultFleets && Array.isArray(raceTrack.defaultFleets) && raceTrack.defaultFleets.length > 0) {
              // Converter frotas padrão do kartódromo para o formato esperado
              const defaultFleets = raceTrack.defaultFleets.map((fleet: any, index: number) => ({
                id: `default-${index + 1}`,
                name: fleet.name,
                totalKarts: fleet.kartQuantity
              }));
              setFleets(defaultFleets);
              setInactiveKarts({});
            } else {
              // Se não há frotas padrão no kartódromo, usar padrão genérico
              const defaultFleets = [{ id: '1', name: 'Frota 1', totalKarts: 20 }];
              setFleets(defaultFleets);
              setInactiveKarts({});
            }
          } catch (raceTrackError) {
            console.error('Erro ao buscar frotas padrão do kartódromo:', raceTrackError);
            // Em caso de erro ao buscar kartódromo, usar padrão genérico
            const defaultFleets = [{ id: '1', name: 'Frota 1', totalKarts: 20 }];
            setFleets(defaultFleets);
            setInactiveKarts({});
          }
        } else {
          // Se não há raceTrackId, usar padrão genérico
          const defaultFleets = [{ id: '1', name: 'Frota 1', totalKarts: 20 }];
          setFleets(defaultFleets);
          setInactiveKarts({});
        }
      }
    } catch (error) {
      console.error('Erro ao carregar frotas da etapa:', error);
      // Em caso de erro, usar padrão genérico
      const defaultFleets = [{ id: '1', name: 'Frota 1', totalKarts: 20 }];
      setFleets(defaultFleets);
      setInactiveKarts({});
    }
  };

  // Salvar frotas no backend
  const saveFleets = async (newFleets: Fleet[]) => {
    if (!selectedStage?.id) return;
    
    try {
      const updateData = { fleets: newFleets };
      
      await StageService.update(selectedStage.id, updateData);
      
      // Atualizar o contexto com as novas frotas
      updateStage(selectedStage.id, { fleets: newFleets });
    } catch (error) {
      toast.error('Erro ao salvar frotas');
    }
  };

  // Carregar frotas quando a etapa muda
  useEffect(() => {
    loadFleets();
  }, [selectedStage?.id]);

  const handleFleetNameChange = (id: string, name: string) => {
    const newFleets = fleets.map(f => f.id === id ? { ...f, name } : f);
    setFleets(newFleets);
    saveFleets(newFleets);
  };
  
  const handleFleetKartsChange = (id: string, totalKarts: number) => {
    setFleets(prevFleets => {
      const fleet = prevFleets.find(f => f.id === id);
      if (!fleet) return prevFleets;
      const currentInactive = inactiveKarts[id] || [];
      const minRequired = getMinKartsRequired();
      const wouldBeActive = totalKarts - currentInactive.length;
      if (wouldBeActive < minRequired) {
        toast.error(`Não é possível reduzir. Mínimo de ${minRequired} karts ativos é necessário.`);
        return prevFleets;
      }
      const newFleets = prevFleets.map(f => f.id === id ? { ...f, totalKarts } : f);
    saveFleets(newFleets);
      return newFleets;
    });
  };

  const handleAddFleet = () => {
    const newFleet = { id: Date.now().toString(), name: `Frota ${fleets.length + 1}`, totalKarts: 20 };
    const newFleets = [...fleets, newFleet];
    setFleets(newFleets);
    saveFleets(newFleets);
    // Expandir automaticamente a nova frota
    setExpandedFleets(prev => new Set([...prev, newFleet.id]));
  };

  const handleRemoveFleet = (id: string) => {
    const newFleets = fleets.filter(f => f.id !== id);
    setFleets(newFleets);
    saveFleets(newFleets);
    // Remover da lista de expandidos
    setExpandedFleets(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (prev.has(catId)) {
        newSet.delete(catId);
      } else {
        newSet.add(catId);
      }
      return newSet;
    });
  };

  const toggleKartTooltip = (pilotId: string) => {
    setOpenKartTooltip(openKartTooltip === pilotId ? null : pilotId);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openKartTooltip && !(event.target as Element).closest('[data-kart-tooltip]')) {
        setOpenKartTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openKartTooltip]);

  useEffect(() => {
    if (selectedStage && categories.length > 0) {
      loadSchedule();
    }
  }, [selectedStage, categories.length, allContextStages]);

  const loadSchedule = async () => {
    if (!selectedStage) return;
    
    try {
      // Sempre usar dados do contexto
      const contextStage = allContextStages.find(s => s.id === selectedStage.id);
      let currentSchedule: any[] = [];
      
      if (contextStage?.schedule && Array.isArray(contextStage.schedule)) {
        currentSchedule = contextStage.schedule;
      }
      
      // Se não há cronograma cadastrado e há categorias disponíveis, gerar cronograma padrão automaticamente
      if (currentSchedule.length === 0 && categories.length > 0 && canEditSchedule) {
        await generateDefaultScheduleAutomatically();
      } else {
        setScheduleItems(currentSchedule);
      }
    } catch (error) {
      // Opcional: mostrar notificação de erro para o usuário
    }
  };

  const addScheduleItem = () => {
    if (!newItemLabel.trim() || !newItemTime.trim()) return;
    
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      label: newItemLabel.trim(),
      time: newItemTime.trim()
    };
    
    // Encontrar a posição correta baseada no horário
    const insertIndex = scheduleItems.findIndex(item => item.time > newItem.time);
    const finalIndex = insertIndex === -1 ? scheduleItems.length : insertIndex;
    
    // Inserir o item na posição correta
    const updatedSchedule = [...scheduleItems];
    updatedSchedule.splice(finalIndex, 0, newItem);
    
    setScheduleItems(updatedSchedule);
    
    // Salvar automaticamente
    saveScheduleToDatabase(updatedSchedule);
    
    // Limpar campos
    setNewItemLabel('');
    setNewItemTime('');
  };

  const removeScheduleItem = (id: string) => {
    const updatedSchedule = scheduleItems.filter(item => item.id !== id);
    
    setScheduleItems(updatedSchedule);
    
    // Salvar automaticamente no banco
    saveScheduleToDatabase(updatedSchedule);
  };

  const saveScheduleToDatabase = async (schedule: ScheduleItem[]) => {
    if (!selectedStage) return;
    
    try {
      await StageService.updateSchedule(selectedStage.id, schedule);
      
      // Atualizar o contexto com o novo schedule
      updateStage(selectedStage.id, { schedule });
    } catch (error) {
      // Opcional: mostrar notificação de erro para o usuário
    }
  };

  const saveSchedule = async () => {
    if (!selectedStage) return;
    
    try {
      await StageService.updateSchedule(selectedStage.id, scheduleItems);
      
      // Atualizar o contexto com o novo schedule
      updateStage(selectedStage.id, { schedule: scheduleItems });
    } catch (error) {
      // Opcional: mostrar notificação de erro para o usuário
    }
  };

  const generateDefaultScheduleAutomatically = async () => {
    if (!selectedStage || !categories.length) return;
    
    const startTime = selectedStage.time;
    let [startHour, startMinute] = startTime.split(':').map(Number);
    // Subtrair 30 minutos do horário do evento
    startMinute -= 30;
    if (startMinute < 0) {
      startHour -= 1;
      startMinute += 60;
    }
    
    const newScheduleItems: ScheduleItem[] = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Adicionar briefing inicial
    newScheduleItems.push({
      id: Date.now().toString(),
      label: 'Briefing',
      time: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    });
    
    // Adicionar 30 minutos para o briefing
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
    
    // Adicionar cada categoria
    categories.forEach((category, index) => {
      newScheduleItems.push({
        id: (Date.now() + index + 1).toString(),
        label: `${category.name}`,
        time: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
      });
      
      // Adicionar 30 minutos para próxima categoria
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    });
    
    // Adicionar premiação
    newScheduleItems.push({
      id: (Date.now() + categories.length + 1).toString(),
      label: 'Premiação',
      time: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    });
    
    setScheduleItems(newScheduleItems);
    await saveScheduleToDatabase(newScheduleItems);
  };



  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item.id);
  };

  const handleDuplicateItem = (item: ScheduleItem) => {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      label: `${item.label} (cópia)`,
      time: item.time
    };
    
    // Encontrar a posição correta baseada no horário
    const insertIndex = scheduleItems.findIndex(scheduleItem => scheduleItem.time > newItem.time);
    const finalIndex = insertIndex === -1 ? scheduleItems.length : insertIndex;
    
    // Inserir o item na posição correta
    const updatedSchedule = [...scheduleItems];
    updatedSchedule.splice(finalIndex, 0, newItem);
    
    setScheduleItems(updatedSchedule);
    saveScheduleToDatabase(updatedSchedule);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedSchedule = scheduleItems.filter(item => item.id !== itemId);
    setScheduleItems(updatedSchedule);
    saveScheduleToDatabase(updatedSchedule);
  };

  // Busca dados ao trocar temporada - agora usando contexto
  useEffect(() => {
    if (!selectedSeasonId) {
      setError('Nenhuma temporada selecionada.');
      setLoading(false);
      return;
    }
    // Dados já vêm do contexto, não precisamos buscar novamente
    setLoading(false);
    setError(null);
  }, [selectedSeasonId]);

  // Buscar participações da etapa selecionada do contexto
  useEffect(() => {
    if (!selectedStageId) {
      setStageParticipations([]);
      return;
    }
    const participations = getStageParticipations(selectedStageId);
    setStageParticipations(participations);
  }, [selectedStageId, getStageParticipations]);



  // Verificar se o usuário pode editar o cronograma
  const canEditSchedule = user?.role === 'Administrator' || user?.role === 'Manager';

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = scheduleItems.findIndex(item => item.id === active.id);
      const newIndex = scheduleItems.findIndex(item => item.id === over.id);
      const updatedSchedule = arrayMove(scheduleItems, oldIndex, newIndex);
      setScheduleItems(updatedSchedule);
      
      // Salvar automaticamente no banco
      saveScheduleToDatabase(updatedSchedule);
    }
  }

  // Componente para cada item do cronograma com drag handle
  const SortableItem = ({ item }: { item: ScheduleItem }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isEditing = editingItem === item.id;
    const [localEditForm, setLocalEditForm] = React.useState({ label: item.label, time: item.time });
    React.useEffect(() => {
      if (isEditing) {
        setLocalEditForm({ label: item.label, time: item.time });
      }
    }, [isEditing, item.label, item.time]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`mb-3 ${isDragging ? 'opacity-50' : ''}`}
      >
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localEditForm.label}
                    onChange={(e) => setLocalEditForm({ ...localEditForm, label: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Descrição do item"
                  />
                  <input
                    type="time"
                    value={localEditForm.time}
                    onChange={(e) => setLocalEditForm({ ...localEditForm, time: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingItem(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      if (!localEditForm.label.trim() || !localEditForm.time.trim()) return;
                      // Atualiza o item no array global
                      const updatedSchedule = scheduleItems.map(it =>
                        it.id === item.id
                          ? { ...it, label: localEditForm.label.trim(), time: localEditForm.time.trim() }
                          : it
                      );
                      setScheduleItems(updatedSchedule);
                      saveScheduleToDatabase(updatedSchedule);
                      setEditingItem(null);
                    }}
                    disabled={!localEditForm.label.trim() || !localEditForm.time.trim()}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="text-lg font-semibold text-gray-900 flex-shrink-0">
                      {item.time}
                    </div>
                    <div className="text-gray-700 flex-1 min-w-0 truncate">
                      {item.label}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditItem(item)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateItem(item)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Estado para karts inativos por frota
  const [inactiveKarts, setInactiveKarts] = useState<{ [fleetId: string]: number[] }>({});

  const toggleKartActive = (fleetId: string, kartIdx: number) => {
    setInactiveKarts(prev => {
      const current = prev[fleetId] || [];
      const newInactiveKarts = { ...prev };
      const fleet = fleets.find(f => f.id === fleetId);
      if (!fleet) return prev;
      const minRequired = getMinKartsRequired();
      if (current.includes(kartIdx)) {
        // Ativando kart (sempre permitido)
        newInactiveKarts[fleetId] = current.filter(i => i !== kartIdx);
      } else {
        // Inativando kart
        const wouldBeInactive = [...current, kartIdx];
        const wouldBeActive = fleet.totalKarts - wouldBeInactive.length;
        if (wouldBeActive < minRequired) {
          toast.error(`Não é possível inativar este kart. Mínimo de ${minRequired} karts ativos é necessário.`);
          return prev;
        }
        newInactiveKarts[fleetId] = wouldBeInactive;
      }
      // Salvar frotas com estado dos karts inativos
      const fleetsWithInactiveKarts = fleets.map(fleet => ({
        ...fleet,
        inactiveKarts: newInactiveKarts[fleet.id] || []
      }));
      saveFleets(fleetsWithInactiveKarts);
      return newInactiveKarts;
    });
  };

  // Estado para expandir/colapsar frotas
  const [expandedFleets, setExpandedFleets] = useState<Set<string>>(new Set());

  // Atualizar expandedFleets quando frotas são carregadas
  useEffect(() => {
    setExpandedFleets(new Set(fleets.map(f => f.id)));
  }, [fleets]);

  const toggleFleet = (fleetId: string) => {
    setExpandedFleets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fleetId)) newSet.delete(fleetId);
      else newSet.add(fleetId);
      return newSet;
    });
  };

  const togglePilotWeight = (pilotId: string) => {
    setPilotWeights(prev => ({
      ...prev,
      [pilotId]: !prev[pilotId]
    }));
  };



  // Carregar dados do contexto quando a etapa muda
  useEffect(() => {
    if (selectedStageId) {
      const selectedStage = allContextStages.find(stage => stage.id === selectedStageId);
      
      if (selectedStage) {
        // Usar dados do contexto se disponíveis
        if (selectedStage.kart_draw_assignments) {
          if (selectedStage.kart_draw_assignments.results) {
            setFleetDrawResults(selectedStage.kart_draw_assignments.results);
          }
          if (selectedStage.kart_draw_assignments.categoryFleetAssignments) {
            setCategoryFleetAssignments(selectedStage.kart_draw_assignments.categoryFleetAssignments);
          }
        } else {
          setFleetDrawResults({});
          setCategoryFleetAssignments({});
        }

        // Usar resultados da etapa do contexto se disponíveis
        if (selectedStage.stage_results) {
          setStageResults(selectedStage.stage_results);
        } else {
          setStageResults({});
        }
        // Resetar flag de modificação quando dados vêm do contexto
        setStageResultsModified(false);
      } else {
        // Se não encontrado no contexto, limpar estados locais
        setFleetDrawResults({});
        setCategoryFleetAssignments({});
        setStageResults({});
      }
    }
  }, [selectedStageId, allContextStages]);

  // Salvar sorteio no backend ao clicar em 'Realizar Sorteio'
  const handleSaveFleetDraw = async (results?: any) => {
    if (!selectedStageId) return;
    const dataToSave = results || fleetDrawResults;
    const dataWithFleetAssignments = {
      results: dataToSave,
      categoryFleetAssignments: categoryFleetAssignments
    };
    await StageService.saveKartDrawAssignments(selectedStageId, dataWithFleetAssignments);
    
    // Atualizar o contexto com os novos kart draw assignments
    updateStage(selectedStageId, { kart_draw_assignments: dataWithFleetAssignments });
    
    setFleetDrawResults(dataWithFleetAssignments.results);
    setCategoryFleetAssignments(dataWithFleetAssignments.categoryFleetAssignments);
    setDrawVersion(v => v + 1); // força re-render
    toast.success('Sorteio salvo com sucesso!');
  };

  // Atualizar selectedBatteryIndex ao trocar de categoria
  useEffect(() => {
    // Só resetar para 0 se não houver parâmetro de bateria na URL
    if (!urlBattery || urlBattery === '') {
      setSelectedBatteryIndex(0);
    }
    // Fechar modal de importação quando mudar de categoria
    setShowImportModal(false);
  }, [selectedOverviewCategory, urlBattery]);



  // Salvar resultados da etapa
  const saveStageResults = async (results?: any) => {
    if (!selectedStageId) return;
    try {
      const dataToSave = results || stageResults;
      await StageService.saveStageResults(selectedStageId, dataToSave);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: dataToSave });
    } catch (error) {
      console.error('Erro ao salvar resultados da etapa:', error);
    }
  };

  // Atualizar resultado de um piloto
  const updatePilotResult = (categoryId: string, pilotId: string, batteryIndex: number, field: string, value: any) => {
    setStageResults((prev: any) => {
      const newResults = { ...prev };
      if (!newResults[categoryId]) {
        newResults[categoryId] = {};
      }
      if (!newResults[categoryId][pilotId]) {
        newResults[categoryId][pilotId] = {};
      }
      if (!newResults[categoryId][pilotId][batteryIndex]) {
        newResults[categoryId][pilotId][batteryIndex] = {};
      }
      newResults[categoryId][pilotId][batteryIndex][field] = value;
      return newResults;
    });
    // Marcar que os dados foram modificados pelo usuário
    setStageResultsModified(true);
  };

  // Carregar resultados quando a etapa muda - agora usando contexto
  useEffect(() => {
    // Os resultados já são carregados no useEffect principal que usa o contexto
  }, [selectedStageId]);

  // Carregar lap times quando categoria é selecionada
  useEffect(() => {
    if (selectedOverviewCategory) {
      loadLapTimes(selectedOverviewCategory);
    }
  }, [selectedOverviewCategory, selectedStageId]);

  // Carregar penalidades da etapa - agora usando contexto
  const loadPenalties = async () => {
    // Punições já vêm do contexto, não precisamos buscar novamente
    // Apenas atualizar se necessário
  };

  // Carregar penalidades quando a etapa muda
  useEffect(() => {
    // Punições já vêm do contexto filtradas por selectedStageId
  }, [selectedStageId]);

  // Estado para controlar se os dados foram modificados pelo usuário
  const [stageResultsModified, setStageResultsModified] = useState(false);
  
  // Estado para controlar o Dialog de confirmação de limpeza
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  // Salvar resultados automaticamente quando mudam (apenas se foram modificados pelo usuário)
  useEffect(() => {
    if (Object.keys(stageResults).length > 0 && stageResultsModified) {
      const timeoutId = setTimeout(() => {
        saveStageResults();
      }, 1000); // Debounce de 1 segundo
      return () => clearTimeout(timeoutId);
    }
  }, [stageResults, stageResultsModified]);

  // Função para abrir modal de seleção de kart
  const openKartSelectionModal = (categoryId: string, pilotId: string, batteryIndex: number) => {
    setSelectedPilotForKartChange({ categoryId, pilotId, batteryIndex });
    setShowKartSelectionModal(true);
  };

  // Função para fechar modal de seleção de kart
  const closeKartSelectionModal = () => {
    setShowKartSelectionModal(false);
    setSelectedPilotForKartChange(null);
    setKartLoading(false);
  };

  // Função para alterar kart de um piloto
  const changePilotKart = async (newKart: number) => {
    if (!selectedPilotForKartChange) return;

    const { categoryId, pilotId, batteryIndex } = selectedPilotForKartChange;
    setKartLoading(true);

    // Obter o kart atual do piloto (se houver)
    const currentKart = fleetDrawResults[categoryId]?.[pilotId]?.[batteryIndex]?.kart;
    
    // Verificar se o novo kart já está sendo usado por outro piloto
    const pilotUsingKart = Object.entries(fleetDrawResults[categoryId] || {}).find(([otherPilotId, batteryResults]) => {
      return otherPilotId !== pilotId && batteryResults[batteryIndex]?.kart === newKart;
    });

    // Atualizar os resultados do sorteio
    const updatedResults = { ...fleetDrawResults };
    if (!updatedResults[categoryId]) {
      updatedResults[categoryId] = {};
    }
    if (!updatedResults[categoryId][pilotId]) {
      updatedResults[categoryId][pilotId] = {};
    }
    
    // Se o kart já está sendo usado por outro piloto, limpar a atribuição anterior
    if (pilotUsingKart) {
      const [otherPilotId] = pilotUsingKart;
      if (!updatedResults[categoryId][otherPilotId]) {
        updatedResults[categoryId][otherPilotId] = {};
      }
      delete updatedResults[categoryId][otherPilotId][batteryIndex];
    }
    
    // Atribuir o novo kart ao piloto
    updatedResults[categoryId][pilotId][batteryIndex] = { kart: newKart };

    setFleetDrawResults(updatedResults);

    // Salvar no backend
    try {
      const dataWithFleetAssignments = {
        results: updatedResults,
        categoryFleetAssignments: categoryFleetAssignments
      };
      await StageService.saveKartDrawAssignments(selectedStageId, dataWithFleetAssignments);
      
      // Atualizar o contexto com os novos kart draw assignments
      updateStage(selectedStageId, { kart_draw_assignments: dataWithFleetAssignments });
      
      closeKartSelectionModal();
      
      if (pilotUsingKart) {
        toast.success(`Kart ${newKart} transferido do piloto anterior para ${formatName(registrations.find(r => r.userId === pilotId)?.user?.name || pilotId)}!`);
      } else {
        toast.success('Kart alterado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar alteração do kart');
      console.error('Erro ao salvar kart:', error);
    } finally {
      setKartLoading(false);
    }
  };

  // Função para limpar kart
  const clearPilotKart = async () => {
    if (!selectedPilotForKartChange) return;

    const { categoryId, pilotId, batteryIndex } = selectedPilotForKartChange;
    setKartLoading(true);

    // Atualizar os resultados do sorteio
    const updatedResults = { ...fleetDrawResults };
    if (!updatedResults[categoryId]) {
      updatedResults[categoryId] = {};
    }
    if (!updatedResults[categoryId][pilotId]) {
      updatedResults[categoryId][pilotId] = {};
    }

    // Remover completamente a entrada da bateria
    if (updatedResults[categoryId][pilotId][batteryIndex]) {
      delete updatedResults[categoryId][pilotId][batteryIndex];
    }

    setFleetDrawResults(updatedResults);

    // Salvar no backend
    try {
      const dataWithFleetAssignments = {
        results: updatedResults,
        categoryFleetAssignments: categoryFleetAssignments
      };
      await StageService.saveKartDrawAssignments(selectedStageId, dataWithFleetAssignments);
      
      // Atualizar o contexto com os novos kart draw assignments
      updateStage(selectedStageId, { kart_draw_assignments: dataWithFleetAssignments });
      
      closeKartSelectionModal();
      toast.success('Kart removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover kart');
      console.error('Erro ao remover kart:', error);
    } finally {
      setKartLoading(false);
    }
  };

  // Função para obter todos os karts da frota (incluindo os já utilizados)
  const getAvailableKarts = (categoryId: string, batteryIndex: number, currentPilotId: string): Array<{kart: number, isUsed: boolean, usedBy: string | null}> => {
    const assignedFleetId = categoryFleetAssignments[categoryId];
    if (!assignedFleetId) return [];

    const fleet = fleets.find(f => f.id === assignedFleetId);
    if (!fleet) return [];

    // Obter karts inativos
    const inactiveKartsForFleet = inactiveKarts[assignedFleetId] || [];
    
    // Obter todos os karts ativos da frota
    const allActiveKarts = Array.from({ length: fleet.totalKarts }, (_, i) => i + 1)
      .filter(kart => !inactiveKartsForFleet.includes(kart - 1));

    // Obter karts já utilizados por outros pilotos nesta bateria
    const usedKarts = new Map<number, string>(); // kart -> pilotId
    Object.entries(fleetDrawResults[categoryId] || {}).forEach(([pilotId, batteryResults]) => {
      if (pilotId !== currentPilotId && batteryResults[batteryIndex]) {
        usedKarts.set(batteryResults[batteryIndex].kart, pilotId);
      }
    });

    // Retornar todos os karts ativos com informação de uso
    return allActiveKarts.map(kart => ({
      kart,
      isUsed: usedKarts.has(kart),
      usedBy: usedKarts.get(kart) || null
    }));
  };

  // Função para abrir modal de seleção de posição
  const openPositionSelectionModal = (
    categoryId: string,
    pilotId: string,
    batteryIndex: number,
    type: 'startPosition' | 'finishPosition'
  ) => {
    setSelectedPilotForPosition({ categoryId, pilotId, batteryIndex, type });
    setShowPositionSelectionModal(true);
  };

  // Função para fechar modal de seleção de posição
  const closePositionSelectionModal = () => {
    setShowPositionSelectionModal(false);
    setSelectedPilotForPosition(null);
    setPositionLoading(false);
  };

  // Função para alterar posição
  const changePilotPosition = async (position: number) => {
    if (!selectedPilotForPosition) return;
    const { categoryId, pilotId, batteryIndex, type } = selectedPilotForPosition;
    setPositionLoading(true);
    
    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};
    updatedResults[categoryId][pilotId][batteryIndex][type] = position;
    setStageResults(updatedResults);
    setStageResultsModified(true);
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closePositionSelectionModal();
      toast.success('Posição salva!');
    } catch (error) {
      toast.error('Erro ao salvar posição');
    } finally {
      setPositionLoading(false);
    }
  };

  // Função para limpar posição
  const clearPilotPosition = async () => {
    if (!selectedPilotForPosition) return;
    const { categoryId, pilotId, batteryIndex, type } = selectedPilotForPosition;
    setPositionLoading(true);
    
    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};

    delete updatedResults[categoryId][pilotId][batteryIndex][type];
    setStageResults(updatedResults);
    setStageResultsModified(true);
    
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closePositionSelectionModal();
      toast.success(`${type === 'startPosition' ? 'Posição de classificação' : 'Posição de corrida'} removida!`);
    } catch (error) {
      toast.error('Erro ao remover posição');
    } finally {
      setPositionLoading(false);
    }
  };

  // Estados para modal de melhor volta
  const [showBestLapModal, setShowBestLapModal] = useState(false);
  const [selectedPilotForBestLap, setSelectedPilotForBestLap] = useState<{
    categoryId: string;
    pilotId: string;
    batteryIndex: number;
  } | null>(null);
  const [bestLapTimeInput, setBestLapTimeInput] = useState('');
  const [bestLapLoading, setBestLapLoading] = useState(false);

  // Estados para modal de melhor volta de classificação
  const [showQualifyingBestLapModal, setShowQualifyingBestLapModal] = useState(false);
  const [selectedPilotForQualifyingBestLap, setSelectedPilotForQualifyingBestLap] = useState<{
    categoryId: string;
    pilotId: string;
    batteryIndex: number;
  } | null>(null);
  const [qualifyingBestLapTimeInput, setQualifyingBestLapTimeInput] = useState('');
  const [qualifyingBestLapLoading, setQualifyingBestLapLoading] = useState(false);

  // Estados para modal de tempo total
  const [showTotalTimeModal, setShowTotalTimeModal] = useState(false);
  const [selectedPilotForTotalTime, setSelectedPilotForTotalTime] = useState<{
    categoryId: string;
    pilotId: string;
    batteryIndex: number;
  } | null>(null);
  const [totalTimeInput, setTotalTimeInput] = useState('');
  const [totalTimeLoading, setTotalTimeLoading] = useState(false);

  // Função para abrir modal de melhor volta
  const openBestLapModal = (
    categoryId: string,
    pilotId: string,
    batteryIndex: number
  ) => {
    const currentBestLap = stageResults[categoryId]?.[pilotId]?.[batteryIndex]?.bestLap || '';
    setSelectedPilotForBestLap({ categoryId, pilotId, batteryIndex });
    setBestLapTimeInput(currentBestLap);
    setShowBestLapModal(true);
  };

  // Função para fechar modal de melhor volta
  const closeBestLapModal = () => {
    setShowBestLapModal(false);
    setSelectedPilotForBestLap(null);
    setBestLapTimeInput('');
    setBestLapLoading(false);
  };

  // Função para salvar melhor volta
  const saveBestLap = async () => {
    if (!selectedPilotForBestLap) return;
    
    const { categoryId, pilotId, batteryIndex } = selectedPilotForBestLap;
    
    // Validar formato do tempo
    const timePattern = /^(\d{1,2}:)?\d{1,2}[.,]\d{1,3}$/;
    if (bestLapTimeInput.trim() && !timePattern.test(bestLapTimeInput.trim())) {
      toast.error('Formato de tempo inválido. Use MM:SS.sss ou SS.sss');
      return;
    }

    setBestLapLoading(true);

    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};
    
    // Normalizar formato (trocar vírgula por ponto se necessário)
    const normalizedTime = bestLapTimeInput.trim().replace(',', '.');
    updatedResults[categoryId][pilotId][batteryIndex].bestLap = normalizedTime || null;
    
    setStageResults(updatedResults);
    setStageResultsModified(true);
    
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closeBestLapModal();
      toast.success('Melhor volta salva!');
    } catch (error) {
      toast.error('Erro ao salvar melhor volta');
    } finally {
      setBestLapLoading(false);
    }
  };

  // Função para limpar melhor volta
  const clearBestLap = async () => {
    if (!selectedPilotForBestLap) return;
    
    const { categoryId, pilotId, batteryIndex } = selectedPilotForBestLap;
    setBestLapLoading(true);
    
    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};

    delete updatedResults[categoryId][pilotId][batteryIndex].bestLap;
    setStageResults(updatedResults);
    setStageResultsModified(true);
    
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closeBestLapModal();
      toast.success('Melhor volta removida!');
    } catch (error) {
      toast.error('Erro ao remover melhor volta');
    } finally {
      setBestLapLoading(false);
    }
  };

  // Função para abrir modal de melhor volta de classificação
  const openQualifyingBestLapModal = (
    categoryId: string,
    pilotId: string,
    batteryIndex: number
  ) => {
    const currentQualifyingBestLap = stageResults[categoryId]?.[pilotId]?.[batteryIndex]?.qualifyingBestLap || '';
    setSelectedPilotForQualifyingBestLap({ categoryId, pilotId, batteryIndex });
    setQualifyingBestLapTimeInput(currentQualifyingBestLap);
    setShowQualifyingBestLapModal(true);
  };

  // Função para fechar modal de melhor volta de classificação
  const closeQualifyingBestLapModal = () => {
    setShowQualifyingBestLapModal(false);
    setSelectedPilotForQualifyingBestLap(null);
    setQualifyingBestLapTimeInput('');
    setQualifyingBestLapLoading(false);
  };

  // Função para salvar melhor volta de classificação
  const saveQualifyingBestLap = async () => {
    if (!selectedPilotForQualifyingBestLap) return;
    
    const { categoryId, pilotId, batteryIndex } = selectedPilotForQualifyingBestLap;
    
    // Validar formato do tempo
    const timePattern = /^(\d{1,2}:)?\d{1,2}[.,]\d{1,3}$/;
    if (qualifyingBestLapTimeInput.trim() && !timePattern.test(qualifyingBestLapTimeInput.trim())) {
      toast.error('Formato de tempo inválido. Use MM:SS.sss ou SS.sss');
      return;
    }

    setQualifyingBestLapLoading(true);

    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};
    
    // Normalizar formato (trocar vírgula por ponto se necessário)
    const normalizedTime = qualifyingBestLapTimeInput.trim().replace(',', '.');
    updatedResults[categoryId][pilotId][batteryIndex].qualifyingBestLap = normalizedTime || null;
    
    setStageResults(updatedResults);
    setStageResultsModified(true);
    
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closeQualifyingBestLapModal();
      toast.success('Melhor volta de classificação salva!');
    } catch (error) {
      toast.error('Erro ao salvar melhor volta de classificação');
    } finally {
      setQualifyingBestLapLoading(false);
    }
  };

  // Função para limpar melhor volta de classificação
  const clearQualifyingBestLap = async () => {
    if (!selectedPilotForQualifyingBestLap) return;
    
    const { categoryId, pilotId, batteryIndex } = selectedPilotForQualifyingBestLap;
    setQualifyingBestLapLoading(true);
    
    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};

    delete updatedResults[categoryId][pilotId][batteryIndex].qualifyingBestLap;
    setStageResults(updatedResults);
    setStageResultsModified(true);
    
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closeQualifyingBestLapModal();
      toast.success('Melhor volta de classificação removida!');
    } catch (error) {
      toast.error('Erro ao remover melhor volta de classificação');
    } finally {
      setQualifyingBestLapLoading(false);
    }
  };

  // Função para abrir modal de tempo total
  const openTotalTimeModal = (
    categoryId: string,
    pilotId: string,
    batteryIndex: number
  ) => {
    const currentTotalTime = stageResults[categoryId]?.[pilotId]?.[batteryIndex]?.totalTime || '';
    setSelectedPilotForTotalTime({ categoryId, pilotId, batteryIndex });
    setTotalTimeInput(currentTotalTime);
    setShowTotalTimeModal(true);
  };

  // Função para fechar modal de tempo total
  const closeTotalTimeModal = () => {
    setShowTotalTimeModal(false);
    setSelectedPilotForTotalTime(null);
    setTotalTimeInput('');
    setTotalTimeLoading(false);
  };

  // Função para salvar tempo total
  const saveTotalTime = async () => {
    if (!selectedPilotForTotalTime) return;
    
    const { categoryId, pilotId, batteryIndex } = selectedPilotForTotalTime;
    
    // Validar formato do tempo
    const timePattern = /^\d{1,2}:\d{2}[.,]\d{1,3}$/;
    if (totalTimeInput.trim() && !timePattern.test(totalTimeInput.trim())) {
      toast.error('Formato de tempo inválido. Use MM:SS.sss (ex: 14:34.610)');
      return;
    }

    setTotalTimeLoading(true);

    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};
    
    // Normalizar formato (trocar vírgula por ponto se necessário)
    const normalizedTime = totalTimeInput.trim().replace(',', '.');
    updatedResults[categoryId][pilotId][batteryIndex].totalTime = normalizedTime || null;
    
    setStageResults(updatedResults);
    setStageResultsModified(true);
    
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closeTotalTimeModal();
      toast.success('Tempo total salvo!');
    } catch (error) {
      toast.error('Erro ao salvar tempo total');
    } finally {
      setTotalTimeLoading(false);
    }
  };

  // Função para limpar tempo total
  const clearTotalTime = async () => {
    if (!selectedPilotForTotalTime) return;
    
    const { categoryId, pilotId, batteryIndex } = selectedPilotForTotalTime;
    setTotalTimeLoading(true);
    
    const updatedResults = { ...stageResults };
    if (!updatedResults[categoryId]) updatedResults[categoryId] = {};
    if (!updatedResults[categoryId][pilotId]) updatedResults[categoryId][pilotId] = {};
    if (!updatedResults[categoryId][pilotId][batteryIndex]) updatedResults[categoryId][pilotId][batteryIndex] = {};

    delete updatedResults[categoryId][pilotId][batteryIndex].totalTime;
    setStageResults(updatedResults);
    setStageResultsModified(true);
    
    try {
      await StageService.saveStageResults(selectedStageId, updatedResults);
      
      // Atualizar o contexto com os novos resultados
      updateStage(selectedStageId, { stage_results: updatedResults });
      
      closeTotalTimeModal();
      toast.success('Tempo total removido!');
    } catch (error) {
      toast.error('Erro ao remover tempo total');
    } finally {
      setTotalTimeLoading(false);
    }
  };

  // Função para abrir o Dialog de confirmação de limpeza
  const openClearAllDialog = () => {
    setShowClearAllDialog(true);
  };

  // Função para limpar todos os resultados da bateria
  const clearAllResults = async () => {
    if (!selectedOverviewCategory || selectedBatteryIndex === null) return;
    
    try {
      
      // Obter pilotos da categoria selecionada
      const categoryPilots = registrations.filter(reg =>
        reg.categories.some((rc: any) => rc.category.id === selectedOverviewCategory) &&
        stageParticipations.some(
          (part) => part.userId === reg.userId && part.categoryId === selectedOverviewCategory && part.status === 'confirmed'
        )
      );
      
      // Criar cópia dos resultados atuais
      const updatedResults = { ...stageResults };
      
      // Para cada piloto da categoria, limpar todos os resultados da bateria selecionada
      categoryPilots.forEach(pilot => {
        if (updatedResults[selectedOverviewCategory]?.[pilot.userId]?.[selectedBatteryIndex]) {
          // Manter apenas os karts sorteados, limpar todo o resto
          const kartAssignment = updatedResults[selectedOverviewCategory][pilot.userId][selectedBatteryIndex].kart;
          
          // Resetar para apenas o kart sorteado e peso OK, removendo todos os resultados da corrida
          updatedResults[selectedOverviewCategory][pilot.userId][selectedBatteryIndex] = {
            kart: kartAssignment,
            weight: true // Resetar peso para OK
            // Removendo: startPosition, finishPosition, bestLap, totalTime, qualifyingBestLap
          };
        }
      });

      // Deletar lap times da bateria selecionada
      try {
        await LapTimesService.deleteLapTimesByCategoryAndBattery(selectedStageId, selectedOverviewCategory, selectedBatteryIndex);
        
        // Limpar lap times do contexto/estado local
        setLapTimes(prev => {
          const updated = { ...prev };
          if (updated[selectedOverviewCategory]) {
            // Filtrar apenas os lap times que não são da bateria selecionada
            updated[selectedOverviewCategory] = updated[selectedOverviewCategory].filter(
              lapTime => lapTime.batteryIndex !== selectedBatteryIndex
            );
          }
          return updated;
        });
      } catch (error) {
        console.error('Erro ao deletar lap times:', error);
        // Continuar mesmo se falhar ao deletar lap times
      }

      // Deletar penalidades da bateria selecionada
      try {
        // Buscar penalidades da bateria selecionada
        const penalties = getPenalties().filter(penalty => 
          penalty.stageId === selectedStageId &&
          penalty.categoryId === selectedOverviewCategory &&
          penalty.batteryIndex === selectedBatteryIndex
        );

        // Deletar cada penalidade no backend
        for (const penalty of penalties) {
          await PenaltyService.deletePenalty(penalty.id);
        }

        // Recarregar penalidades do contexto para atualizar a interface
        await refreshPenalties();
      } catch (error) {
        console.error('Erro ao deletar penalidades:', error);
        // Continuar mesmo se falhar ao deletar penalidades
      }
      
      // Atualizar estado local
      setStageResults(updatedResults);
      
      // Salvar no backend imediatamente
      await saveStageResults(updatedResults);
      
      // Marcar que os dados foram modificados para trigger do save automático
      setStageResultsModified(true);
      
      toast.success('Todos os resultados foram limpos com sucesso!');
      setShowClearAllDialog(false);
    } catch (error) {
      console.error('Erro ao limpar todos os resultados:', error);
      toast.error('Erro ao limpar todos os resultados');
    }
  };

  // Função para cancelar o Dialog de limpeza
  const cancelClearAllDialog = () => {
    setShowClearAllDialog(false);
  };

  // Função para filtrar penalidades por categoria e bateria
  const getFilteredPenalties = (categoryId: string, batteryIndex: number) => {
    return filteredPenalties.filter(penalty => 
      penalty.categoryId === categoryId && 
      penalty.batteryIndex === batteryIndex
    );
  };

  // Função para obter ícone do tipo de penalidade
  const getPenaltyTypeIcon = (type: PenaltyType) => {
    switch (type) {
      case PenaltyType.TIME_PENALTY:
        return <Clock className="w-4 h-4" />;
      case PenaltyType.POSITION_PENALTY:
        return <MapPin className="w-4 h-4" />;
      case PenaltyType.DISQUALIFICATION:
        return <Ban className="w-4 h-4" />;
      case PenaltyType.WARNING:
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Função para obter descrição do tipo de penalidade
  const getPenaltyTypeDescription = (type: PenaltyType) => {
    switch (type) {
      case PenaltyType.TIME_PENALTY:
        return 'Penalidade de Tempo';
      case PenaltyType.POSITION_PENALTY:
        return 'Penalidade de Posição';
      case PenaltyType.DISQUALIFICATION:
        return 'Desqualificação';
      case PenaltyType.WARNING:
        return 'Advertência';
      default:
        return 'Penalidade';
    }
  };

  // Função para obter cor do status da penalidade
  const getPenaltyStatusColor = (status: PenaltyStatus) => {
    switch (status) {
      case PenaltyStatus.APPLIED:
        return 'bg-green-100 text-green-800';
      case PenaltyStatus.NOT_APPLIED:
        return 'bg-gray-100 text-gray-800';
      case PenaltyStatus.APPEALED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para ordenar os pilotos por categoria
  const getSortedPilots = (categoryPilots: any[], category: any) => {
    const sorted = [...categoryPilots];
    sorted.sort((a, b) => {
              const getValue = (pilot: any, col: string) => {
          const kart = fleetDrawResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.kart || 0;
          const peso = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.weight;
          const start = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.startPosition || 0;
          const finish = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.finishPosition || 0;
          const bestLap = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.bestLap;
          const totalTime = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.totalTime;
          const nome = formatName(pilot.user?.name || pilot.userId);
          switch (col) {
            case 'kart': return kart;
            case 'peso': return peso === false ? 0 : 1;
            case 'classificacao': return start;
            case 'corrida': return finish;
            case 'bestLap': 
              if (!bestLap) return 999999; // Coloca pilotos sem tempo no final
              // Converter tempo para milissegundos para comparação
              const [minutes, seconds] = bestLap.includes(':') 
                ? bestLap.split(':') 
                : ['0', bestLap];
              return parseFloat(minutes) * 60000 + parseFloat(seconds) * 1000;
            case 'totalTime':
              if (!totalTime) return 999999; // Coloca pilotos sem tempo no final
              // Converter tempo para milissegundos para comparação
              const [totalMinutes, totalSeconds] = totalTime.includes(':') 
                ? totalTime.split(':') 
                : ['0', totalTime];
              return parseFloat(totalMinutes) * 60000 + parseFloat(totalSeconds) * 1000;
            case 'piloto': return nome;
            default: return nome;
          }
        };
      let vA = getValue(a, sortColumn);
      let vB = getValue(b, sortColumn);
      if (typeof vA === 'string' && typeof vB === 'string') {
        return sortDirection === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortDirection === 'asc' ? vA - vB : vB - vA;
    });
    return sorted;
  };

  // Função para alternar ordenação
  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Função para processar penalidades do arquivo Excel
  const processPenaltiesFromExcel = (data: any[], kartToUserMapping: { [kartNumber: number]: string }) => {
    const penalties: Array<{
      kartNumber: number;
      penaltyText: string;
      timePenaltySeconds?: number;
      type: PenaltyType;
    }> = [];
    
    let foundPenaltiesSection = false;
    let foundObservationsSection = false;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;
      
      const firstCell = String(row[0] || '').trim().toUpperCase();
      
      // Procurar pela seção de penalidades
      if (firstCell.includes('PENALIZAÇÕES') || firstCell.includes('PENALIZACOES')) {
        foundPenaltiesSection = true;
        continue;
      }
      
      // Parar quando encontrar "Observações da prova"
      if (firstCell.includes('OBSERVAÇÕES DA PROVA') || firstCell.includes('OBSERVACOES DA PROVA')) {
        foundObservationsSection = true;
        break;
      }
      
      // Se estamos na seção de penalidades, processar as linhas
      if (foundPenaltiesSection && !foundObservationsSection) {
        const rowText = row.map((cell: any) => String(cell || '')).join(' ').trim();
        
        // Procurar por padrões de penalidade
        // Padrão: "KART 25 PENALIZADO EM 10 SEC SOB KART 18"
        const penaltyPattern = /KART\s+(\d+)\s+PENALIZADO\s+EM\s+(\d+)\s+SEC/i;
        const match = rowText.match(penaltyPattern);
        
        if (match) {
          const kartNumber = parseInt(match[1]);
          const timePenaltySeconds = parseInt(match[2]);
          
          penalties.push({
            kartNumber,
            penaltyText: rowText,
            timePenaltySeconds,
            type: PenaltyType.TIME_PENALTY
          });
        }
        
        // Outros padrões podem ser adicionados aqui
        // Por exemplo: "KART 25 DESQUALIFICADO"
        const disqualificationPattern = /KART\s+(\d+)\s+DESQUALIFICADO/i;
        const dqMatch = rowText.match(disqualificationPattern);
        
        if (dqMatch) {
          const kartNumber = parseInt(dqMatch[1]);
          
          penalties.push({
            kartNumber,
            penaltyText: rowText,
            type: PenaltyType.DISQUALIFICATION
          });
        }
      }
    }
    
    // Processar observações da prova para bandeiras pretas
    let foundObservationsSectionForFlags = false;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;
      
      const firstCell = String(row[0] || '').trim().toUpperCase();
      
      // Procurar pela seção de observações
      if (firstCell.includes('OBSERVAÇÕES DA PROVA') || firstCell.includes('OBSERVACOES DA PROVA')) {
        foundObservationsSectionForFlags = true;
        continue;
      }
      
      // Se estamos na seção de observações, processar as linhas
      if (foundObservationsSectionForFlags) {
        const rowText = row.map((cell: any) => String(cell || '')).join(' ').trim();
        
        // Procurar por padrões de bandeira preta
        // Padrão: "O competidor de nº 15 recebeu uma bandeira Preta na passagem de nº 9 SOB KART 31"
        const blackFlagPattern = /O\s+competidor\s+de\s+nº\s+(\d+)\s+recebeu\s+uma\s+bandeira\s+preta/i;
        const match = rowText.match(blackFlagPattern);
        
        if (match && !rowText.toLowerCase().includes('laranja')) {
          const competitorNumber = parseInt(match[1]);
          
          // Buscar o kart correspondente ao número do competidor
          const kartNumber = Object.keys(kartToUserMapping).find(kart => {
            const userId = kartToUserMapping[parseInt(kart)];
            // Aqui precisamos buscar o número do competidor baseado no userId
            // Por enquanto, vamos usar o kart diretamente
            return parseInt(kart) === competitorNumber;
          });
          
          if (kartNumber) {
            penalties.push({
              kartNumber: parseInt(kartNumber),
              penaltyText: rowText,
              type: PenaltyType.DISQUALIFICATION
            });
          }
        }
      }
    }
    
    return penalties;
  };

  // Funções para lap times
  const loadLapTimes = async (categoryId: string) => {
    try {
      setLapTimesLoading(true);
      const lapTimesData = await LapTimesService.getLapTimesByStageAndCategory(selectedStageId, categoryId);
      setLapTimes(prev => ({
        ...prev,
        [categoryId]: lapTimesData
      }));
    } catch (error) {
      console.error('Erro ao carregar tempos volta a volta:', error);
    } finally {
      setLapTimesLoading(false);
    }
  };

  // Funções para importação
  const openImportModal = (type: 'race' | 'qualification' | 'lapTimes') => {
    setImportType(type);
    setShowImportModal(true);
    setImportFile(null);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const processImportFile = async () => {
    if (!importFile || !selectedOverviewCategory) return;
    
    // Verificar se há resultados de sorteio para a categoria
    const categoryResults = fleetDrawResults[selectedOverviewCategory];
    if (!categoryResults || Object.keys(categoryResults).length === 0) {
      toast.error('É necessário realizar o sorteio de karts antes de importar os resultados.');
      return;
    }
    
    setImportLoading(true);
    
    try {
      const buffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      if (importType === 'lapTimes') {
        // Para volta a volta, usar apenas a primeira sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Processar arquivo de volta a volta
        try {
          const processedData = LapTimesService.processExcelData(data as any[]);
          
          // Criar mapeamento de kart para usuário
          const kartToUserMapping: { [kartNumber: number]: string } = {};
          Object.entries(categoryResults).forEach(([pilotId, batteryResults]) => {
            const pilotBatteryData = batteryResults[selectedBatteryIndex];
            if (pilotBatteryData) {
              kartToUserMapping[pilotBatteryData.kart] = pilotId;
            }
          });
          
          // Importar os tempos volta a volta
          const result = await LapTimesService.importLapTimesFromExcel(
            selectedStageId,
            selectedOverviewCategory,
            {
              batteryIndex: selectedBatteryIndex,
              excelData: processedData,
              kartToUserMapping
            }
          );
          
          // Atualizar estado local
          await loadLapTimes(selectedOverviewCategory);
          
          // Feedback
          let message = `${result.imported} pilotos com tempos volta a volta importados`;
          if (result.errors.length > 0) {
            message += ` • ${result.errors.length} erros: ${result.errors.slice(0, 3).join(', ')}`;
            if (result.errors.length > 3) {
              message += '...';
            }
          }
          
          if (result.imported > 0) {
            toast.success(message);
          } else {
            toast.error('Nenhum tempo volta a volta foi importado. Verifique se o arquivo está no formato correto.');
          }
          
        } catch (error) {
          console.error('Erro ao processar volta a volta:', error);
          toast.error('Erro ao processar arquivo de volta a volta. Verifique o formato.');
        }
      } else {
        // Processar arquivo de corrida/classificação com múltiplas sheets
        let totalProcessedCount = 0;
        let totalNcCount = 0;
        let totalBestLapCount = 0;
        let totalTimeCount = 0;
        let totalLapsCount = 0;
        const allNotFoundKarts: number[] = [];
        
        // Criar mapeamento de kart para usuário
        const kartToUserMapping: { [kartNumber: number]: string } = {};
        Object.entries(categoryResults).forEach(([pilotId, batteryResults]) => {
          const pilotBatteryData = batteryResults[selectedBatteryIndex];
          if (pilotBatteryData) {
            kartToUserMapping[pilotBatteryData.kart] = pilotId;
          }
        });

        // Processar todas as sheets
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Buscar pelo cabeçalho (linha que contém "POS", "#" e melhor volta)
          let headerRow = -1;
          let positionColumn = -1;
          let kartColumn = -1;
          let bestLapColumn = -1;
          let totalTimeColumn = -1;
          let totalLapsColumn = -1;
          
          for (let i = 0; i < data.length; i++) {
            const row = data[i] as any[];
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').trim().toLowerCase();
              if (cell === 'pos' || cell === 'posição') {
                headerRow = i;
                positionColumn = j;
              }
              if (cell === '#' || cell === 'kart') {
                kartColumn = j;
              }
              // Procurar pela coluna TMV (Tempo Melhor Volta)
              if (cell === 'tmv' || cell === 'tempo melhor volta' || cell === 'melhor volta') {
                bestLapColumn = j;
              }
              // Procurar pela coluna TT (Tempo Total)
              if (cell === 'tt' || cell === 'tempo total' || cell === 'total') {
                totalTimeColumn = j;
              }
              // Procurar pela coluna TV (Total de Voltas)
              if (cell === 'tv' || cell === 'total voltas' || cell === 'voltas' || cell === 'total de voltas') {
                totalLapsColumn = j;
              }
            }
            if (headerRow >= 0 && positionColumn >= 0 && kartColumn >= 0) {
              break;
            }
          }
          
          if (headerRow === -1 || positionColumn === -1 || kartColumn === -1) {
            continue;
          }
          
          // Processar as linhas de dados (começando após o cabeçalho)
          let processedCount = 0;
          let ncCount = 0;
          let bestLapCount = 0;
          let totalTimeCountLocal = 0;
          let totalLapsCountLocal = 0;
          const notFoundKarts: number[] = [];
          
          for (let i = headerRow + 1; i < data.length; i++) {
            const row = data[i] as any[];
            if (!row[positionColumn] || !row[kartColumn]) continue;
            
            const positionValue = String(row[positionColumn]).trim().toUpperCase();
            const kartNumber = Number(row[kartColumn]);
            const bestLapValue = bestLapColumn >= 0 ? String(row[bestLapColumn] || '').trim() : '';
            const totalTimeValue = totalTimeColumn >= 0 ? String(row[totalTimeColumn] || '').trim() : '';
            const totalLapsValue = totalLapsColumn >= 0 ? String(row[totalLapsColumn] || '').trim() : '';

            // Validar se o kart é um número válido
            if (isNaN(kartNumber)) continue;
            
            // Encontrar o piloto que tem este kart sorteado
            const categoryResults = fleetDrawResults[selectedOverviewCategory];
            if (!categoryResults) continue;
            
            let pilotFound = false;
            for (const [pilotId, batteryResults] of Object.entries(categoryResults)) {
              const pilotBatteryData = batteryResults[selectedBatteryIndex];
              if (pilotBatteryData && pilotBatteryData.kart === kartNumber) {
                const fieldToUpdate = importType === 'race' ? 'finishPosition' : 'startPosition';
                
                // Verificar se é NC (Não Completou)
                if (positionValue === 'NC') {
                  // Limpar a posição (definir como null/undefined)
                  updatePilotResult(selectedOverviewCategory, pilotId, selectedBatteryIndex, fieldToUpdate, null);
                  ncCount++;
                } else {
                  // Tentar converter para número
                  const position = Number(positionValue);
                  if (!isNaN(position)) {
                    updatePilotResult(selectedOverviewCategory, pilotId, selectedBatteryIndex, fieldToUpdate, position);
                    processedCount++;
                  }
                }
                
                // Processar melhor volta se disponível
                if (bestLapColumn >= 0 && bestLapValue && bestLapValue !== 'NC' && positionValue !== 'NC' && positionValue !== 'DQ') {
                  // Validar formato de tempo (exemplo: 47.123, 1:23.456, 47,123)
                  const timePattern = /^(\d{1,2}:)?\d{1,2}[.,]\d{1,3}$/;
                  if (timePattern.test(bestLapValue)) {
                    // Normalizar formato (trocar vírgula por ponto se necessário)
                    const normalizedTime = bestLapValue.replace(',', '.');
                    if (importType === 'qualification') {
                      updatePilotResult(selectedOverviewCategory, pilotId, selectedBatteryIndex, 'qualifyingBestLap', normalizedTime);
                    } else {
                      updatePilotResult(selectedOverviewCategory, pilotId, selectedBatteryIndex, 'bestLap', normalizedTime);
                    }
                    bestLapCount++;
                  } else {
                    // Formato de tempo inválido ignorado
                  }
                }
                
                // Processar tempo total se disponível (apenas para corrida)
                if (importType === 'race' && totalTimeColumn >= 0 && totalTimeValue && totalTimeValue !== 'NC' && positionValue !== 'NC' && positionValue !== 'DQ') {
                  // Validar formato de tempo (exemplo: 00:14:34.610, 14:34.610, 14:34,610)
                  const timePattern = /^(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}$/;
                  if (timePattern.test(totalTimeValue)) {
                    // Normalizar formato (trocar vírgula por ponto se necessário)
                    let normalizedTime = totalTimeValue.replace(',', '.');
                    
                    // Remover "00:" do início se presente
                    if (normalizedTime.startsWith('00:')) {
                      normalizedTime = normalizedTime.substring(3);
                    }
                    
                    updatePilotResult(selectedOverviewCategory, pilotId, selectedBatteryIndex, 'totalTime', normalizedTime);
                    totalTimeCountLocal++;
                  } else {
                    // Formato de tempo inválido ignorado
                  }
                }
                
                // Processar total de voltas se disponível (apenas para corrida)
                if (importType === 'race' && totalLapsColumn >= 0 && totalLapsValue && totalLapsValue !== 'NC' && positionValue !== 'NC' && positionValue !== 'DQ') {
                  // Validar se é um número válido
                  const totalLaps = Number(totalLapsValue);
                  if (!isNaN(totalLaps) && totalLaps >= 0) {
                    updatePilotResult(selectedOverviewCategory, pilotId, selectedBatteryIndex, 'totalLaps', totalLaps);
                    totalLapsCountLocal++;
                  } else {
                    // Valor inválido ignorado
                  }
                }
                
                pilotFound = true;
                break;
              }
            }
            
            if (!pilotFound) {
              notFoundKarts.push(kartNumber);
            }
          }
          
          // Processar penalidades do arquivo (apenas para corrida)
          if (importType === 'race') {
            try {
              const penalties = processPenaltiesFromExcel(data, kartToUserMapping);
              let penaltiesCreated = 0;
              let penaltiesSkipped = 0;
              let penaltyTimeApplied = 0;
              
              // Obter penalidades existentes para esta etapa e categoria
              const existingPenalties = contextPenalties.filter(penalty => 
                penalty.stageId === selectedStageId && 
                penalty.categoryId === selectedOverviewCategory &&
                penalty.batteryIndex === selectedBatteryIndex
              );
              
              // Mapear punições por piloto para calcular tempo total de punição
              const penaltyTimeByPilot: { [userId: string]: number } = {};
              
              for (const penalty of penalties) {
                const userId = kartToUserMapping[penalty.kartNumber];
                if (userId) {
                  // Verificar se já existe uma punição com o mesmo motivo para este piloto
                  const existingPenalty = existingPenalties.find(existing => 
                    existing.userId === userId && 
                    existing.reason === penalty.penaltyText
                  );
                  
                  if (existingPenalty) {
                    console.log(`Punição duplicada descartada para kart ${penalty.kartNumber}: ${penalty.penaltyText}`);
                    penaltiesSkipped++;
                    continue;
                  }
                  
                  try {
                    await PenaltyService.createPenalty({
                      type: penalty.type,
                      reason: penalty.penaltyText,
                      description: penalty.penaltyText,
                      timePenaltySeconds: penalty.timePenaltySeconds,
                      batteryIndex: selectedBatteryIndex,
                      userId,
                      championshipId: championshipId!,
                      seasonId: selectedSeasonId,
                      stageId: selectedStageId,
                      categoryId: selectedOverviewCategory,
                      status: PenaltyStatus.APPLIED, // Aplicar automaticamente
                      isImported: true // Marcar como importada
                    });
                    penaltiesCreated++;
                    
                    // Acumular tempo de punição para este piloto
                    if (penalty.timePenaltySeconds && penalty.timePenaltySeconds > 0) {
                      penaltyTimeByPilot[userId] = (penaltyTimeByPilot[userId] || 0) + penalty.timePenaltySeconds;
                      penaltyTimeApplied++;
                    }
                  } catch (error) {
                    console.error(`Erro ao criar penalidade para kart ${penalty.kartNumber}:`, error);
                  }
                }
              }
              
              // Aplicar tempo de punição aos resultados dos pilotos
              for (const [userId, totalPenaltySeconds] of Object.entries(penaltyTimeByPilot)) {
                const currentResults = stageResults[selectedOverviewCategory]?.[userId]?.[selectedBatteryIndex];
                if (currentResults && currentResults.totalTime) {
                  // Calcular tempo real (subtraindo punições do tempo salvo)
                  const savedTimeMs = convertTimeToMs(currentResults.totalTime);
                  const penaltyTimeMs = totalPenaltySeconds * 1000;
                  const realTimeMs = savedTimeMs - penaltyTimeMs;
                  
                  // Atualizar o tempo total com o tempo real (sem punições)
                  const realTime = convertMsToTime(realTimeMs);
                  updatePilotResult(selectedOverviewCategory, userId, selectedBatteryIndex, 'totalTime', realTime);
                  
                  // Salvar o tempo de punição
                  updatePilotResult(selectedOverviewCategory, userId, selectedBatteryIndex, 'penaltyTime', totalPenaltySeconds.toString());
                }
              }
              
              if (penaltiesCreated > 0 || penaltiesSkipped > 0) {
                let message = '';
                if (penaltiesCreated > 0) {
                  message += `${penaltiesCreated} penalidades criadas automaticamente`;
                }
                if (penaltiesSkipped > 0) {
                  if (message) message += ' • ';
                  message += `${penaltiesSkipped} penalidades duplicadas descartadas`;
                }
                if (penaltyTimeApplied > 0) {
                  if (message) message += ' • ';
                  message += `${penaltyTimeApplied} tempos de punição aplicados`;
                }
                toast.success(message);
                // Recarregar penalidades do contexto para atualizar a interface
                await refreshPenalties();
              }
            } catch (error) {
              console.error('Erro ao processar penalidades:', error);
            }
          }
          
          // Acumular totais
          totalProcessedCount += processedCount;
          totalNcCount += ncCount;
          totalBestLapCount += bestLapCount;
          totalTimeCount += totalTimeCountLocal;
          totalLapsCount += totalLapsCountLocal;
          allNotFoundKarts.push(...notFoundKarts);
          

        }
        
        // Feedback detalhado final
        if (totalProcessedCount > 0 || totalNcCount > 0 || totalBestLapCount > 0 || totalTimeCount > 0 || totalLapsCount > 0) {
          let message = '';
          if (totalProcessedCount > 0) {
            message += `${totalProcessedCount} ${importType === 'race' ? 'posições de corrida' : 'posições de classificação'} importadas`;
          }
          if (totalNcCount > 0) {
            if (message) message += ' • ';
            message += `${totalNcCount} pilotos marcados como NC (não completaram)`;
          }
          if (totalBestLapCount > 0) {
            if (message) message += ' • ';
            message += `${totalBestLapCount} melhores voltas importadas`;
          }
          if (totalTimeCount > 0) {
            if (message) message += ' • ';
            message += `${totalTimeCount} tempos totais importados`;
          }
          if (totalLapsCount > 0) {
            if (message) message += ' • ';
            message += `${totalLapsCount} totais de voltas importados`;
          }
          if (workbook.SheetNames.length > 1) {
            message += ` (processadas ${workbook.SheetNames.length} sheets)`;
          }
          toast.success(message);
        }
        
        if (allNotFoundKarts.length > 0) {
          const uniqueNotFoundKarts = [...new Set(allNotFoundKarts)];
          toast.warning(`Karts não encontrados no sorteio: ${uniqueNotFoundKarts.join(', ')}`);
        }
        
        if (totalProcessedCount === 0 && totalNcCount === 0 && totalBestLapCount === 0 && totalTimeCount === 0 && totalLapsCount === 0) {
          toast.error('Nenhum resultado foi importado. Verifique se o arquivo está no formato correto.');
        }
      }
      
      closeImportModal();
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar o arquivo. Verifique se o formato está correto.');
    } finally {
      setImportLoading(false);
    }
  };





  // Função para copiar mensagem com emojis
  const copyMessageWithEmojis = async () => {
    try {
      const stageData = stages.find((s: StageType) => s.id === selectedStageId);
      if (!stageData) {
        toast.error('Etapa não encontrada');
        return;
      }

      // Buscar dados do kartódromo
      let raceTrackName = 'Kartódromo';
      let raceTrackAddress = '';
      
      if (stageData.raceTrackId) {
        try {
          // Usar dados do contexto em vez de buscar do backend
          const raceTrack = contextRaceTracks[stageData.raceTrackId];
          if (raceTrack) {
            raceTrackName = raceTrack.name;
            raceTrackAddress = raceTrack.address;
          }
        } catch (err) {
          console.error('Erro ao buscar dados do kartódromo:', err);
        }
      }

      const formattedDate = StageService.formatDate(stageData.date);
      const formattedTime = StageService.formatTime(stageData.time);
      const seasonName = selectedSeason?.name || 'Temporada';
      
      // Gerar mensagem com emojis
      let message = `🏁 *${stageData.name}*\n`;
      message += `📅 ${formattedDate}\n`;
      message += `🕒 ${formattedTime}\n`;
      message += `📍 ${raceTrackName}\n`;
      if (raceTrackAddress) {
        message += `🏠 ${raceTrackAddress}\n\n`;
      } else {
        message += `\n`;
      }
      
      if (scheduleItems.length > 0) {
        message += `📋 *CRONOGRAMA:*\n`;
        scheduleItems.forEach((item, index) => {
          message += `${index + 1}. ${item.time} - ${item.label}\n`;
        });
        message += `\n`;
      }
      
      if (stageData.streamLink) {
        message += `📺 *TRANSMISSÃO:*\n`;
        message += `${stageData.streamLink}\n\n`;
      }
      
      if (stageData.briefing) {
        message += `📢 *BRIEFING:*\n`;
        message += `${stageData.briefing}\n`;
        message += `\n`;
      }
      
      message += `🏆 ${seasonName}\n`;
      message += `\n`;
              message += `#BRK #Kart #Corrida #${championship?.name?.replace(/\s+/g, '') || 'Championship'}`;
      
      // Copiar para clipboard
      await navigator.clipboard.writeText(message);
      toast.success('Cronograma copiado para área de transferência!');
      
    } catch (error) {
      console.error('Erro ao copiar mensagem:', error);
      toast.error('Erro ao copiar mensagem do cronograma');
    }
  };



  return (
    <div className="space-y-6">
      {/* Título da aba */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Race Day</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie tudo para o dia da corrida.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full px-4 py-1 h-8 text-sm font-semibold flex items-center gap-1 w-full lg:w-auto">
                  {selectedOverviewCategory ? 
                    categories.find(cat => cat.id === selectedOverviewCategory)?.name || 'Visão geral' 
                    : 'Visão geral'
                  }
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSelectedOverviewCategory(null)}>
                  Visão geral
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories.map(category => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => setSelectedOverviewCategory(category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filtros sempre visíveis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Temporada */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 font-medium" htmlFor="season-select">Temporada</label>
            <div className="relative">
              <select
                id="season-select"
              className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 font-bold text-base pr-8 focus:outline-none focus:border-orange-500 w-full"
                value={selectedSeasonId}
                onChange={e => {
                  const seasonId = e.target.value;
                  setSelectedSeasonId(seasonId);
                  const newSeason = seasons.find(s => s.id === seasonId);
                          const newSeasonStages = stages.filter(stage => stage.seasonId === seasonId);
        if (newSeasonStages.length > 0) {
          setSelectedStageId(getClosestStage(newSeasonStages) || newSeasonStages[0].id);
        } else {
                    setSelectedStageId("");
                  }
                }}
              >
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          {/* Etapa */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 font-medium" htmlFor="stage-select">Etapa</label>
            <div className="relative">
              <select
                id="stage-select"
              className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 font-semibold text-base pr-8 focus:outline-none focus:border-orange-500 w-full"
                value={selectedStageId}
                onChange={e => setSelectedStageId(e.target.value)}
              >
                {stages.map((stage: StageType) => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        {/* Filtro de bateria (apenas se categoria selecionada) */}
        {selectedOverviewCategory ? (() => {
          const category = categories.find(cat => cat.id === selectedOverviewCategory);
          if (!category) return <div></div>;
          const batteries = category.batteriesConfig || [ { name: 'Bateria 1' } ];
          return (
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1 font-medium" htmlFor="battery-select">Bateria <span className='text-gray-400'>({batteries.length})</span></label>
              <div className="relative">
                <select
                  id="battery-select"
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 font-semibold text-base pr-8 focus:outline-none focus:border-orange-500 w-full"
                  value={selectedBatteryIndex}
                  onChange={e => setSelectedBatteryIndex(Number(e.target.value))}
                >
                  {batteries.map((battery, idx) => (
                    <option key={idx} value={idx}>{battery.name || `Bateria ${idx + 1}`}</option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
            </div>
          );
        })() : <div></div>}
      </div>

      {/* Renderização condicional dos blocos */}
      {selectedOverviewCategory === null ? (
        // Visão geral: renderizar os 3 blocos
        <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Pilotos Confirmados na Etapa */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pilotos Confirmados na Etapa
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenBulkConfirmModal}>
                  Gerenciar Participações na Etapa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {loading ? (
            <Loading type="spinner" size="md" message="Carregando dados..." />
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => {
                const categoryPilots = registrations.filter(reg =>
                  reg.categories.some((rc: any) => rc.category.id === category.id)
                );
                const confirmedPilots = categoryPilots.filter(reg =>
                  stageParticipations.some(
                    (part) => part.userId === reg.userId && part.categoryId === category.id && part.status === 'confirmed'
                  )
                );
                
                return (
                      <div key={category.id + '-' + drawVersion} className="border border-gray-200 rounded-lg">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCategory(category.id)}
                    >
                          <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>
                            <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800`}>
                          {confirmedPilots.length}/{category.maxPilots}
                        </span>
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                            </div>
                          </div>
                    </div>
                    
                    {expandedCategories.has(category.id) && (
                      <div className="border-t border-gray-200 p-3 space-y-2">
                        {confirmedPilots.length > 0 ? (
                          confirmedPilots
                            .sort((a, b) => {
                              return (
                                (a.user?.name || a.userId).localeCompare(b.user?.name || b.userId)
                              );
                            })
                                .map((pilot) => {
                                  // Verificar se há karts sorteados para este piloto
                                  const pilotKartAssignments = fleetDrawResults[category.id]?.[pilot.userId];
                                  const hasKartAssignments = pilotKartAssignments && Object.keys(pilotKartAssignments).length > 0;
                                  return (
                                    <div key={pilot.id} className="flex items-center justify-between">
                                <span className="text-sm text-gray-900 font-medium">
                                  {formatName(pilot.user?.name || pilot.userId)}
                                </span>
                                      {hasKartAssignments && (
                                        <div className="relative" data-kart-tooltip>
                                          <button
                                            onClick={() => toggleKartTooltip(pilot.id)}
                                            className="flex items-center ml-2 p-1 rounded hover:bg-gray-100"
                                          >
                                            <img 
                                              src="/kart.svg" 
                                              alt="Kart" 
                                              className="w-4 h-4 text-black"
                                            />
                                          </button>
                                          {openKartTooltip === pilot.id && (
                                            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-max max-w-[calc(100vw-2rem)] min-w-[200px]">
                                              <div className="space-y-1">
                                                <div className="font-semibold text-sm">Karts Sorteados:</div>
                                                {Object.entries(pilotKartAssignments).map(([batteryIdx, result]) => {
                                                  const batteryNumber = Number(batteryIdx) + 1;
                                                  const assignedFleetId = categoryFleetAssignments[category.id];
                                                  const fleet = fleets.find(f => f.id === assignedFleetId);
                                                  return (
                                                    <div key={batteryIdx} className="text-xs">
                                                      Bateria {batteryNumber}: Kart {result.kart}
                                                      {fleet && ` (${fleet.name})`}
                              </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                        ) : (
                          <div className="text-sm text-gray-500 text-center py-2">
                            'Nenhum piloto confirmado nesta categoria'
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Coluna 2: Cronograma */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Cronograma
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyMessageWithEmojis}>
                  Compartilhar cronograma
                </DropdownMenuItem>
                {canEditSchedule && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleAddItemForm}>
                      {showAddItemForm ? 'Cancelar' : 'Adicionar item ao cronograma'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="space-y-3">
                {canEditSchedule && showAddItemForm && (
              <div className="space-y-3">
                <div className="w-full flex items-center my-2">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="mx-3 text-xs text-gray-400 uppercase tracking-wider">Adicionar novo item</span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Descrição do item"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="time"
                    value={newItemTime}
                    onChange={(e) => setNewItemTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                  onClick={addScheduleItem}
                  disabled={!newItemLabel.trim() || !newItemTime.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
                <div className="w-full flex items-center my-2">
                  <div className="flex-grow border-t border-gray-200" />
                </div>
              </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={scheduleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {scheduleItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Coluna 3: Frota/Sorteio */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Frota/Sorteio
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFleet}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar frota
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenFleetDrawModal}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sorteio de frota
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col gap-4 mb-4 w-full">
            {fleets.map((fleet, idx) => (
              <div key={fleet.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 min-w-0">
                <div
                  className="flex items-center gap-2 mb-3 cursor-pointer select-none min-w-0"
                  onClick={() => toggleFleet(fleet.id)}
                >
                  <div className="flex-shrink-0">
                    {expandedFleets.has(fleet.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={fleet.name}
                      onChange={e => handleFleetNameChange(fleet.id, e.target.value)}
                      className="font-semibold text-lg border-b border-gray-300 focus:border-orange-500 outline-none bg-transparent w-full truncate"
                      placeholder="Nome da frota"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  {fleets.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveFleet(fleet.id); }}
                      className="flex-shrink-0 ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remover frota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {expandedFleets.has(fleet.id) && (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Karts ativos: {getActiveKartsCount(fleet.id)}</span>
                        {getMinKartsRequired() > 0 && (
                          <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                            (mín: {getMinKartsRequired()})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={e => { e.stopPropagation(); handleFleetKartsChange(fleet.id, Math.max(getMinKartsRequired(), fleet.totalKarts - 1)); }}
                          disabled={fleet.totalKarts <= getMinKartsRequired()}
                          tabIndex={-1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <input
                          type="number"
                          min={getMinKartsRequired()}
                          max={99}
                          value={fleet.totalKarts}
                          onChange={e => handleFleetKartsChange(fleet.id, Math.max(getMinKartsRequired(), Math.min(99, Number(e.target.value))))}
                          className="w-24 h-9 px-3 border border-gray-300 rounded-md text-sm text-center focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                          onClick={e => e.stopPropagation()}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={e => { e.stopPropagation(); handleFleetKartsChange(fleet.id, Math.min(99, fleet.totalKarts + 1)); }}
                          disabled={fleet.totalKarts >= 99}
                          tabIndex={-1}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: fleet.totalKarts }, (_, i) => {
                        const isInactive = (inactiveKarts[fleet.id] || []).includes(i);
                        return (
                          <TooltipProvider key={i}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => toggleKartActive(fleet.id, i)}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-colors
                                    ${isInactive ? 'bg-gray-300 text-white border-gray-400' : 'bg-orange-500 text-black border-orange-600'}`}
                                  title={`Kart ${i + 1} ${isInactive ? '(inativo)' : ''}`}
                                >
                                  {i + 1}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isInactive ? 'Desbloquear kart' : 'Bloquear kart'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      ) : (
        // Categoria selecionada: renderizar bloco customizado
        (() => {
          const category = categories.find(cat => cat.id === selectedOverviewCategory);
          if (!category) return null;
          const categoryPilots = registrations.filter(reg =>
            reg.categories.some((rc: any) => rc.category.id === category.id) &&
            stageParticipations.some(
              (part) => part.userId === reg.userId && part.categoryId === category.id && part.status === 'confirmed'
            )
          );
          const batteries = category.batteriesConfig || [ { name: 'Bateria 1' } ];
          return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {category.name} {categoryPilots.length}/{category.maxPilots}
                    </div>
                    <div className="text-sm text-gray-600">Pilotos confirmados para a etapa</div>
                  </div>
                  {selectedOverviewCategory && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full px-3 h-8 text-xs font-semibold">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openImportModal('qualification')}>
                          <Upload className="w-4 h-4 mr-2" />
                          Importar Classificação
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openImportModal('race')}>
                          <Upload className="w-4 h-4 mr-2" />
                          Importar Corrida
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openImportModal('lapTimes')}>
                          <Upload className="w-4 h-4 mr-2" />
                          Importar Volta a Volta
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            loadLapTimes(selectedOverviewCategory);
                            setShowLapTimesChart(true);
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Gráfico Volta a Volta
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={openClearAllDialog}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpar Todos os Resultados
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-700 mb-2">{batteries[selectedBatteryIndex]?.name || `Bateria ${selectedBatteryIndex + 1}`}</div>
                <div className="overflow-x-auto">
                  {/* MOBILE: Cards de resultados */}
                  {categoryPilots.length > 0 && (
                    <div className="block lg:hidden">
                      {getSortedPilots(categoryPilots, category).map((pilot) => (
                        <div key={pilot.id} className="bg-white rounded-lg shadow p-4 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="font-bold text-lg">{formatName(pilot.user?.name || pilot.userId)}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (championshipId) {
                                      navigate(`/championship/${championshipId}/penalties/new?seasonId=${selectedSeasonId}&stageId=${selectedStageId}&categoryId=${category.id}&userId=${pilot.userId}&batteryIndex=${selectedBatteryIndex}&returnTab=race-day&returnSeason=${selectedSeasonId}&returnStage=${selectedStageId}&returnCategory=${category.id}&returnBattery=${selectedBatteryIndex}`);
                                    }
                                  }}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Aplicar Punição
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Primeira linha: Kart e Peso */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {/* Kart */}
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Kart</span>
                              <button
                                className="py-3 px-4 rounded-lg bg-orange-100 text-orange-800 font-semibold text-base border border-orange-200 hover:bg-orange-200 transition-colors"
                                onClick={() => openKartSelectionModal(category.id, pilot.userId, selectedBatteryIndex)}
                              >
                                {(() => {
                                  const pilotKartAssignments = fleetDrawResults[category.id]?.[pilot.userId];
                                  if (pilotKartAssignments && pilotKartAssignments[selectedBatteryIndex]) {
                                    return pilotKartAssignments[selectedBatteryIndex].kart;
                                  }
                                  return '-';
                                })()}
                              </button>
                            </div>
                            
                            {/* Peso */}
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Peso</span>
                              <button
                                className={`py-3 px-4 rounded-lg font-semibold text-base border transition-colors ${
                                  stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.weight === false 
                                    ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200' 
                                    : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                }`}
                                onClick={() => {
                                  const currentWeight = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.weight;
                                  const newWeight = currentWeight === false ? true : false;
                                  updatePilotResult(category.id, pilot.userId, selectedBatteryIndex, 'weight', newWeight);
                                }}
                              >
                                {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.weight === false ? 'Abaixo peso' : 'OK'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Segunda linha: Classificação e Corrida */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Classificação */}
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Classificação</span>
                              <button
                                className="py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-semibold text-base border border-gray-200 hover:bg-gray-200 transition-colors"
                                onClick={() => openPositionSelectionModal(category.id, pilot.userId, selectedBatteryIndex, 'startPosition')}
                              >
                                {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.startPosition || '-'}
                              </button>
                            </div>
                            
                            {/* Corrida */}
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Corrida</span>
                              <button
                                className="py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-semibold text-base border border-gray-200 hover:bg-gray-200 transition-colors"
                                onClick={() => openPositionSelectionModal(category.id, pilot.userId, selectedBatteryIndex, 'finishPosition')}
                              >
                                {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.finishPosition || '-'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Terceira linha: Melhor Volta */}
                          <div className="grid grid-cols-1 gap-3 mt-3">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Melhor Volta</span>
                                                              <button
                                  className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-semibold text-base border border-gray-200 hover:bg-gray-200 transition-colors min-h-[49px] flex items-center justify-center"
                                  onClick={() => openBestLapModal(category.id, pilot.userId, selectedBatteryIndex)}
                                >
                                  {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.bestLap ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="font-medium">
                                        {stageResults[category.id][pilot.userId][selectedBatteryIndex].bestLap}
                                      </span>
                                      {(() => {
                                        // Verificar se é a melhor volta da categoria
                                        const categoryResults = stageResults[category.id] || {};
                                        const allBestLaps = Object.values(categoryResults).map((pilotData: any) => 
                                          pilotData?.[selectedBatteryIndex]?.bestLap
                                        ).filter(Boolean);
                                        
                                        if (allBestLaps.length === 0) return null;
                                        
                                        // Converter tempos para comparação
                                        const convertTimeToMs = (time: string) => {
                                          const [minutes, seconds] = time.includes(':') 
                                            ? time.split(':') 
                                            : ['0', time];
                                          return parseFloat(minutes) * 60000 + parseFloat(seconds) * 1000;
                                        };
                                        
                                        const currentTime = stageResults[category.id][pilot.userId][selectedBatteryIndex].bestLap;
                                        const bestTime = allBestLaps.reduce((best, current) => {
                                          return convertTimeToMs(current) < convertTimeToMs(best) ? current : best;
                                        });
                                        
                                        if (currentTime === bestTime) {
                                          return <span className="text-orange-500 font-bold">🏆</span>;
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </button>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Melhor Volta Classificação</span>
                              <button
                                className="py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-semibold text-base border border-gray-200 hover:bg-gray-200 transition-colors min-h-[49px] flex items-center justify-center"
                                onClick={() => openQualifyingBestLapModal(category.id, pilot.userId, selectedBatteryIndex)}
                              >
                                {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.qualifyingBestLap ? (
                                  <span className="font-medium">
                                    {stageResults[category.id][pilot.userId][selectedBatteryIndex].qualifyingBestLap}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* Quarta linha: Tempo Total e Total de Voltas */}
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Tempo Total</span>
                              <button
                                className="py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-semibold text-base border border-gray-200 hover:bg-gray-200 transition-colors min-h-[49px] flex items-center justify-center"
                                onClick={() => openTotalTimeModal(category.id, pilot.userId, selectedBatteryIndex)}
                              >
                                {(() => {
                                  const totalTime = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.totalTime;
                                  const penaltyTime = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.penaltyTime;
                                  
                                  if (!totalTime) {
                                    return <span className="text-gray-400">-</span>;
                                  }
                                  
                                  const penaltySeconds = penaltyTime ? parseInt(penaltyTime) : undefined;
                                  
                                  // Verificar se há punições importadas para este piloto nesta bateria
                                  const pilotPenalties = contextPenalties.filter(penalty => 
                                    penalty.userId === pilot.userId && 
                                    penalty.stageId === selectedStageId && 
                                    penalty.categoryId === category.id &&
                                    penalty.batteryIndex === selectedBatteryIndex &&
                                    penalty.isImported
                                  );
                                  const hasImportedPenalties = pilotPenalties.length > 0;
                                  
                                  const formattedTime = formatTimeWithPenalty(totalTime, penaltySeconds, false, hasImportedPenalties);
                                  
                                  return (
                                    <span className="font-medium">
                                      {formattedTime}
                                    </span>
                                  );
                                })()}
                              </button>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Total de Voltas</span>
                              <div className="py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-semibold text-base border border-gray-200 min-h-[49px] flex items-center justify-center">
                                {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.totalLaps ? (
                                  <span className="font-medium">
                                    {stageResults[category.id][pilot.userId][selectedBatteryIndex].totalLaps}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DESKTOP: Tabela de resultados (layout original) */}
                  <table className="min-w-full text-sm border-separate border-spacing-y-2 hidden lg:table">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('kart')}>
                          Kart {sortColumn === 'kart' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('piloto')}>
                          Piloto {sortColumn === 'piloto' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('peso')}>
                          Peso {sortColumn === 'peso' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('classificacao')}>
                          Posição Classificação {sortColumn === 'classificacao' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-left">Melhor Volta Classificação</th>
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('corrida')}>
                          Posição Corrida {sortColumn === 'corrida' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('bestLap')}>
                          Melhor Volta {sortColumn === 'bestLap' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('totalTime')}>
                          Tempo Total {sortColumn === 'totalTime' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-left cursor-pointer select-none" onClick={() => handleSort('totalLaps')}>
                          Total de Voltas {sortColumn === 'totalLaps' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-2 py-1 text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="border-t border-gray-200">
                      {getSortedPilots(categoryPilots, category).map((pilot, i) => (
                        <tr key={pilot.id} className="border-b border-gray-200 group">
                          {/* Kart */}
                          <td 
                            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                            onClick={() => openKartSelectionModal(category.id, pilot.userId, selectedBatteryIndex)}
                          >
                            {(() => {
                              const pilotKartAssignments = fleetDrawResults[category.id]?.[pilot.userId];
                              if (pilotKartAssignments && pilotKartAssignments[selectedBatteryIndex]) {
                                return (
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{pilotKartAssignments[selectedBatteryIndex].kart}</span>
                                    <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                );
                              }
                              return (
                                <div className="flex items-center justify-between text-gray-400">
                                  <span>-</span>
                                  <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              );
                            })()}
                          </td>
                          {/* Piloto */}
                          <td className="px-2 py-1">{formatName(pilot.user?.name || pilot.userId)}</td>
                          {/* Peso */}
                          <td 
                            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors flex items-center justify-between group w-32"
                            onClick={() => {
                              const currentWeight = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.weight;
                              const newWeight = currentWeight === false ? true : false;
                              updatePilotResult(category.id, pilot.userId, selectedBatteryIndex, 'weight', newWeight);
                            }}
                          >
                            <span className={`${stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.weight === false ? 'text-orange-600' : 'text-green-600'} text-xs font-medium truncate`}>
                              {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.weight === false ? 'Abaixo peso' : 'OK'}
                            </span>
                            <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                          </td>
                          {/* Posição Classificação */}
                          <td
                            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors text-center"
                            onClick={() => openPositionSelectionModal(category.id, pilot.userId, selectedBatteryIndex, 'startPosition')}
                          >
                            {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.startPosition ? (
                              <span className="font-medium">
                                {stageResults[category.id][pilot.userId][selectedBatteryIndex].startPosition}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          {/* Melhor Volta Classificação */}
                          <td 
                            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors text-center"
                            onClick={() => openQualifyingBestLapModal(category.id, pilot.userId, selectedBatteryIndex)}
                          >
                            {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.qualifyingBestLap ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">
                                  {stageResults[category.id][pilot.userId][selectedBatteryIndex].qualifyingBestLap}
                                </span>
                                <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-gray-400">-</span>
                                <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>
                          {/* Posição Corrida */}
                          <td
                            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors text-center"
                            onClick={() => openPositionSelectionModal(category.id, pilot.userId, selectedBatteryIndex, 'finishPosition')}
                          >
                            {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.finishPosition ? (
                              <span className="font-medium">
                                {stageResults[category.id][pilot.userId][selectedBatteryIndex].finishPosition}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          {/* Melhor Volta */}
                          <td 
                            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors text-center"
                            onClick={() => openBestLapModal(category.id, pilot.userId, selectedBatteryIndex)}
                          >
                            {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.bestLap ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">
                                  {stageResults[category.id][pilot.userId][selectedBatteryIndex].bestLap}
                                </span>
                                {(() => {
                                  // Verificar se é a melhor volta da categoria
                                  const categoryResults = stageResults[category.id] || {};
                                  const allBestLaps = Object.values(categoryResults).map((pilotData: any) => 
                                    pilotData?.[selectedBatteryIndex]?.bestLap
                                  ).filter(Boolean);
                                  
                                  if (allBestLaps.length === 0) return null;
                                  
                                  // Converter tempos para comparação
                                  const convertTimeToMs = (time: string) => {
                                    const [minutes, seconds] = time.includes(':') 
                                      ? time.split(':') 
                                      : ['0', time];
                                    return parseFloat(minutes) * 60000 + parseFloat(seconds) * 1000;
                                  };
                                  
                                  const currentTime = stageResults[category.id][pilot.userId][selectedBatteryIndex].bestLap;
                                  const bestTime = allBestLaps.reduce((best, current) => {
                                    return convertTimeToMs(current) < convertTimeToMs(best) ? current : best;
                                  });
                                  
                                  if (currentTime === bestTime) {
                                    return <span className="text-orange-500 font-bold">🏆</span>;
                                  }
                                  return null;
                                })()}
                                <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-gray-400">-</span>
                                <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>
                          
                          {/* Tempo Total */}
                          <td 
                            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors text-center"
                            onClick={() => openTotalTimeModal(category.id, pilot.userId, selectedBatteryIndex)}
                          >
                            {(() => {
                              const totalTime = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.totalTime;
                              const penaltyTime = stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.penaltyTime;
                              
                              if (!totalTime) {
                                return (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-gray-400">-</span>
                                    <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                );
                              }
                              
                              const penaltySeconds = penaltyTime ? parseInt(penaltyTime) : undefined;
                              
                              // Verificar se há punições importadas para este piloto nesta bateria
                              const pilotPenalties = contextPenalties.filter(penalty => 
                                penalty.userId === pilot.userId && 
                                penalty.stageId === selectedStageId && 
                                penalty.categoryId === category.id &&
                                penalty.batteryIndex === selectedBatteryIndex &&
                                penalty.isImported
                              );
                              const hasImportedPenalties = pilotPenalties.length > 0;
                              
                              const formattedTime = formatTimeWithPenalty(totalTime, penaltySeconds, false, hasImportedPenalties);
                              
                              return (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="font-medium">
                                    {formattedTime}
                                  </span>
                                  <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              );
                            })()}
                          </td>
                          
                          {/* Total de Voltas */}
                          <td className="px-2 py-1 text-center">
                            {stageResults[category.id]?.[pilot.userId]?.[selectedBatteryIndex]?.totalLaps ? (
                              <span className="font-medium">
                                {stageResults[category.id][pilot.userId][selectedBatteryIndex].totalLaps}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          
                          {/* Coluna de ações */}
                          <td className="px-2 py-1 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    // Navegar para a página de criação de punição com os dados pré-preenchidos
                                    if (championshipId) {
                                      const penaltyData = {
                                        seasonId: selectedSeasonId,
                                        stageId: selectedStageId,
                                        categoryId: category.id,
                                        userId: pilot.userId,
                                        batteryIndex: selectedBatteryIndex,
                                        pilotName: formatName(pilot.user?.name || pilot.userId),
                                        categoryName: category.name,
                                        stageName: stages.find(s => s.id === selectedStageId)?.name || 'Etapa',
                                        seasonName: seasons.find(s => s.id === selectedSeasonId)?.name || 'Temporada'
                                      };
                                      
                                      // Navegar para a página de criação de punição
                                      navigate(`/championship/${championshipId}/penalties/new?seasonId=${selectedSeasonId}&stageId=${selectedStageId}&categoryId=${category.id}&userId=${pilot.userId}&batteryIndex=${selectedBatteryIndex}&returnTab=race-day&returnSeason=${selectedSeasonId}&returnStage=${selectedStageId}&returnCategory=${category.id}&returnBattery=${selectedBatteryIndex}`);
                                    }
                                  }}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Aplicar Punição
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Listagem de Penalidades */}
              {(() => {
                if (penaltiesLoading) {
                  return (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          Penalidades da Bateria {selectedBatteryIndex + 1}
                        </h4>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <Loading type="spinner" size="sm" message="Carregando penalidades..." />
                      </div>
                    </div>
                  );
                }
                
                const categoryPenalties = getFilteredPenalties(category.id, selectedBatteryIndex);
                if (categoryPenalties.length === 0) {
                  return (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          Penalidades da Bateria {selectedBatteryIndex + 1}
                        </h4>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-center text-green-700">
                          <CheckCircle className="w-5 h-5 mx-auto mb-2" />
                          <p className="text-sm font-medium">Nenhuma penalidade aplicada nesta bateria</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="mt-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Penalidades da Bateria {selectedBatteryIndex + 1}
                      </h4>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {categoryPenalties.length} penalidade{categoryPenalties.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="space-y-3">
                        {categoryPenalties.map((penalty) => (
                          <div key={penalty.id} className="bg-white rounded-lg border border-red-200 p-4">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {getPenaltyTypeIcon(penalty.type)}
                                    <span className="text-sm font-medium text-gray-600 break-words">
                                      {getPenaltyTypeDescription(penalty.type)}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-gray-900 break-words">
                                    {formatName(penalty.user?.name || penalty.userId)}
                                  </span>
                                  <Badge className={`${getPenaltyStatusColor(penalty.status)} flex-shrink-0`}>
                                    {PenaltyService.getPenaltyStatusLabel(penalty.status)}
                                  </Badge>
                                </div>
                                
                                <div className="text-sm text-gray-700 mb-2 break-words">
                                  <strong>Motivo:</strong> {penalty.reason}
                                </div>
                                
                                {penalty.description && (
                                  <div className="text-sm text-gray-600 mb-2 break-words">
                                    <strong>Descrição:</strong> {penalty.description}
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  {penalty.timePenaltySeconds && (
                                    <span className="flex items-center gap-1 flex-shrink-0">
                                      <Clock className="w-3 h-3" />
                                      {penalty.timePenaltySeconds}s de penalidade
                                    </span>
                                  )}
                                  {penalty.positionPenalty && (
                                    <span className="flex items-center gap-1 flex-shrink-0">
                                      <MapPin className="w-3 h-3" />
                                      {penalty.positionPenalty} posição{penalty.positionPenalty !== 1 ? 's' : ''} de penalidade
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-400 lg:text-right lg:ml-4 flex-shrink-0">
                                <div>Aplicada por</div>
                                <div className="font-medium break-words">{formatName(penalty.appliedByUser?.name || 'N/A')}</div>
                                <div className="mt-1">
                                  {new Date(penalty.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()
      )}

      {/* Modal de Confirmação de Pilotos */}
      {/* Removed PilotConfirmationModal */}

      {/* Modal de Sorteio de Frota */}
      {showFleetDrawModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCloseFleetDrawModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full mx-4 overflow-hidden flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sorteio de Frota</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure a frota para cada categoria e realize o sorteio dos karts por bateria.
                </p>
              </div>
              <button
                onClick={handleCloseFleetDrawModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Configuração de frotas por categoria */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Configuração de Frotas</h3>
                {categories.map((category) => {
                  const categoryPilots = registrations.filter(reg =>
                      reg.categories.some((rc: any) => rc.category.id === category.id)
                  );
                  const confirmedPilots = categoryPilots.filter(reg =>
                    stageParticipations.some(
                      (part) => part.userId === reg.userId && part.categoryId === category.id && part.status === 'confirmed'
                    )
                  );
                  
                  return (
                      <div key={category.id + '-' + drawVersion} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <h4 className="text-base font-semibold text-gray-900">
                            {category.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {confirmedPilots.length} pilotos confirmados • {category.batteriesConfig?.length || 0} baterias
                          </p>
                          <select
                            value={categoryFleetAssignments[category.id] || ''}
                            onChange={(e) => setCategoryFleetAssignments(prev => ({
                              ...prev,
                              [category.id]: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecione uma frota</option>
                            {fleets.map(fleet => (
                              <option key={fleet.id} value={fleet.id}>
                                {fleet.name} ({getActiveKartsCount(fleet.id)} karts ativos)
                              </option>
                            ))}
                          </select>
                      </div>
                      
                        {/* Resultados do sorteio para esta categoria */}
                        {fleetDrawResults[category.id] && (
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Resultado do Sorteio:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {Object.entries(fleetDrawResults[category.id])
                                .map(([pilotId, batteryResults]) => {
                                  const pilot = registrations.find(reg => reg.userId === pilotId);
                                  return {
                                    pilotId,
                                    batteryResults,
                                    pilotName: formatName(pilot?.user?.name || pilotId)
                                  };
                                })
                                .sort((a, b) => a.pilotName.localeCompare(b.pilotName, 'pt-BR'))
                                .map(({ pilotId, batteryResults, pilotName }) => (
                                  <div key={pilotId} className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {pilotName}
                                  </div>
                                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                                      {Object.entries(batteryResults).map(([batteryIdx, result]) => (
                                        <div key={batteryIdx}>
                                          Bateria {Number(batteryIdx) + 1}: Kart {result.kart}
                                </div>
                                      ))}
                          </div>
                        </div>
                                  ))}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
              </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleCloseFleetDrawModal}
            >
            Fechar
          </Button>
            <Button 
              onClick={async () => { 
                const results = performFleetDraw(); 
                await handleSaveFleetDraw(results); 
              }}
              disabled={Object.keys(categoryFleetAssignments).length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-black"
            >
              Realizar Sorteio
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Modal de Seleção de Kart */}
    {showKartSelectionModal && selectedPilotForKartChange && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeKartSelectionModal}
        />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Selecionar Kart</h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecione um kart disponível para o piloto.
              </p>
            </div>
            <button
              onClick={closeKartSelectionModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={kartLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Loading Overlay */}
          {kartLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Loading type="spinner" size="md" message="" />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Karts Disponíveis
                </h3>
                              <p className="text-sm text-gray-600 mb-4">
                Selecione um kart da frota para a bateria {selectedPilotForKartChange.batteryIndex + 1}. 
                Karts em preto estão sendo usados por outros pilotos e serão transferidos automaticamente.
              </p>
                
                <div className="grid grid-cols-6 gap-2">
                  {getAvailableKarts(
                    selectedPilotForKartChange.categoryId, 
                    selectedPilotForKartChange.batteryIndex, 
                    selectedPilotForKartChange.pilotId
                  ).map((kartInfo) => (
                    <TooltipProvider key={kartInfo.kart}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => changePilotKart(kartInfo.kart)}
                            className={`w-12 h-12 rounded-full font-bold text-sm border-2 transition-colors flex items-center justify-center ${
                              kartInfo.isUsed 
                                ? 'bg-black text-orange-500 border-gray-700 hover:bg-gray-800' 
                                : 'bg-orange-500 text-black border-orange-600 hover:bg-orange-600'
                            }`}
                            disabled={kartLoading}
                          >
                            {kartInfo.kart}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {kartInfo.isUsed 
                            ? `Kart ${kartInfo.kart} - Em uso por ${formatName(registrations.find(r => r.userId === kartInfo.usedBy)?.user?.name || kartInfo.usedBy)}`
                            : `Kart ${kartInfo.kart} - Disponível`
                          }
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                
                {getAvailableKarts(
                  selectedPilotForKartChange.categoryId, 
                  selectedPilotForKartChange.batteryIndex, 
                  selectedPilotForKartChange.pilotId
                ).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum kart disponível para esta bateria.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={clearPilotKart}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={kartLoading}
            >
              Limpar
            </Button>
            <Button 
              variant="outline" 
              onClick={closeKartSelectionModal}
              disabled={kartLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Modal de Seleção de Posição */}
    {showPositionSelectionModal && selectedPilotForPosition && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closePositionSelectionModal}
        />
        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Selecionar Posição</h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecione a posição para o piloto.
              </p>
            </div>
            <button
              onClick={closePositionSelectionModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={positionLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Loading Overlay */}
          {positionLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Loading type="spinner" size="md" message=""  />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-6 gap-2">
              {selectedPilotForPosition && (() => {
                // Encontrar a lista de pilotos confirmados na categoria
                const categoryPilots = registrations.filter(reg =>
                  reg.categories.some((rc: any) => rc.category.id === selectedPilotForPosition.categoryId) &&
                  stageParticipations.some(
                    (part) => part.userId === reg.userId && part.categoryId === selectedPilotForPosition.categoryId && part.status === 'confirmed'
                  )
                );
                return Array.from({ length: categoryPilots.length }, (_, idx) => idx + 1).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => changePilotPosition(pos)}
                    className="w-12 h-12 rounded-full bg-orange-500 text-black font-bold text-sm border-2 border-orange-600 hover:bg-orange-600 transition-colors flex items-center justify-center"
                    disabled={positionLoading}
                  >
                    {pos}
                  </button>
                ));
              })()}
            </div>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={clearPilotPosition}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={positionLoading}
            >
              Limpar
            </Button>
            <Button 
              variant="outline" 
              onClick={closePositionSelectionModal}
              disabled={positionLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Modal de Importação */}
    {showImportModal && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeImportModal}
        />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Importar {importType === 'race' ? 'Corrida' : importType === 'qualification' ? 'Classificação' : 'Volta a Volta'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecione o arquivo Excel com os resultados.
              </p>
            </div>
            <button
              onClick={closeImportModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6">
            <div className="space-y-4">
              {/* Informações do formato */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Formato do arquivo Excel:
                </h3>
                {importType === 'lapTimes' ? (
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Coluna A: Marcador <strong>#</strong> seguido pelos dados</li>
                    <li>• Coluna A: Número do kart (após o marcador #)</li>
                    <li>• Coluna C: Número da volta</li>
                    <li>• Coluna D: Tempo de volta (formato MM:SS.sss)</li>
                    <li>• Exemplo: <code>NOVATOS - VOLTA A VOLTA 01.xlsx</code></li>
                  </ul>
                ) : (
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Cabeçalho com coluna <strong>POS</strong> (posição)</li>
                    <li>• Cabeçalho com coluna <strong>#</strong> (número do kart)</li>
                    <li>• Dados numéricos nas colunas POS e #</li>
                    <li>• Use <strong>NC</strong> para pilotos que não completaram</li>
                    <li>• Arquivo de exemplo: <code>exemplo-importacao-corrida.xlsx</code></li>
                  </ul>
                )}
              </div>
              
              {/* Upload de arquivo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Selecionar arquivo Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              {/* Arquivo selecionado */}
              {importFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Arquivo selecionado:</strong> {importFile.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={closeImportModal}
              disabled={importLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={processImportFile}
              disabled={!importFile || importLoading}
              className="bg-orange-500 hover:bg-orange-600 text-black"
            >
              {importLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar'
              )}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Modal de Melhor Volta */}
    {showBestLapModal && selectedPilotForBestLap && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeBestLapModal}
        />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Melhor Volta</h2>
              <p className="text-sm text-gray-600 mt-1">
                Digite o tempo da melhor volta do piloto.
              </p>
            </div>
            <button
              onClick={closeBestLapModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={bestLapLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Loading Overlay */}
          {bestLapLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Loading type="spinner" size="md" message="" />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 p-6">
            <div className="space-y-4">
              {/* Informações do formato */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Formato de tempo:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>MM:SS.sss</strong> (ex: 1:23.456)</li>
                  <li>• <strong>SS.sss</strong> (ex: 47.123)</li>
                  <li>• Deixe em branco para remover o tempo</li>
                </ul>
              </div>
              
              {/* Input de tempo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tempo da melhor volta
                </label>
                <input
                  type="text"
                  value={bestLapTimeInput}
                  onChange={(e) => setBestLapTimeInput(e.target.value)}
                  placeholder="Ex: 1:23.456 ou 47.123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
                  disabled={bestLapLoading}
                />
              </div>
              
              {/* Preview do tempo */}
              {bestLapTimeInput.trim() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Tempo:</strong> {bestLapTimeInput.trim()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={clearBestLap}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={bestLapLoading}
            >
              Limpar
            </Button>
            <Button 
              variant="outline" 
              onClick={closeBestLapModal}
              disabled={bestLapLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveBestLap}
              className="bg-orange-500 hover:bg-orange-600 text-black"
              disabled={bestLapLoading}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Modal de Melhor Volta de Classificação */}
    {showQualifyingBestLapModal && selectedPilotForQualifyingBestLap && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeQualifyingBestLapModal}
        />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Melhor Volta de Classificação</h2>
              <p className="text-sm text-gray-600 mt-1">
                Digite o tempo da melhor volta de classificação do piloto.
              </p>
            </div>
            <button
              onClick={closeQualifyingBestLapModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={qualifyingBestLapLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Loading Overlay */}
          {qualifyingBestLapLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Loading type="spinner" size="md" message=""  />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 p-6">
            <div className="space-y-4">
              {/* Informações do formato */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Formato de tempo:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>MM:SS.sss</strong> (ex: 1:23.456)</li>
                  <li>• <strong>SS.sss</strong> (ex: 47.123)</li>
                  <li>• Deixe em branco para remover o tempo</li>
                </ul>
              </div>
              
              {/* Input de tempo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tempo da melhor volta de classificação
                </label>
                <input
                  type="text"
                  value={qualifyingBestLapTimeInput}
                  onChange={(e) => setQualifyingBestLapTimeInput(e.target.value)}
                  placeholder="Ex: 1:23.456 ou 47.123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
                  disabled={qualifyingBestLapLoading}
                />
              </div>
              
              {/* Preview do tempo */}
              {qualifyingBestLapTimeInput.trim() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Tempo:</strong> {qualifyingBestLapTimeInput.trim()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={clearQualifyingBestLap}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={qualifyingBestLapLoading}
            >
              Limpar
            </Button>
            <Button 
              variant="outline" 
              onClick={closeQualifyingBestLapModal}
              disabled={qualifyingBestLapLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveQualifyingBestLap}
              className="bg-orange-500 hover:bg-orange-600 text-black"
              disabled={qualifyingBestLapLoading}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Modal de Tempo Total */}
    {showTotalTimeModal && selectedPilotForTotalTime && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeTotalTimeModal}
        />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Tempo Total</h2>
              <p className="text-sm text-gray-600 mt-1">
                Digite o tempo total da corrida do piloto.
              </p>
            </div>
            <button
              onClick={closeTotalTimeModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={totalTimeLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Loading Overlay */}
          {totalTimeLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <Loading type="spinner" size="md" message="" />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 p-6">
            <div className="space-y-4">
              {/* Informações do formato */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Formato de tempo:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>MM:SS.sss</strong> (ex: 14:34.610)</li>
                  <li>• Deixe em branco para remover o tempo</li>
                </ul>
              </div>
              
              {/* Input de tempo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tempo total da corrida
                </label>
                <input
                  type="text"
                  value={totalTimeInput}
                  onChange={(e) => setTotalTimeInput(e.target.value)}
                  placeholder="Ex: 14:34.610"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
                  disabled={totalTimeLoading}
                />
              </div>
              
              {/* Preview do tempo */}
              {totalTimeInput.trim() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Tempo:</strong> {totalTimeInput.trim()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={clearTotalTime}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={totalTimeLoading}
            >
              Limpar
            </Button>
            <Button 
              variant="outline" 
              onClick={closeTotalTimeModal}
              disabled={totalTimeLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveTotalTime}
              className="bg-orange-500 hover:bg-orange-600 text-black"
              disabled={totalTimeLoading}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Modal de Gráfico Volta a Volta */}
    {showLapTimesChart && selectedOverviewCategory && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-60"
        />
        
        {/* Modal Content - Maximized */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-hidden flex flex-col z-10">
          {/* Header - Compact */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  📊 Gráfico Volta a Volta
                </h2>
                <p className="text-xs text-gray-600">
                  {categories.find(cat => cat.id === selectedOverviewCategory)?.name} - Bateria {selectedBatteryIndex + 1}
                </p>
              </div>
              
              {/* Quick Stats */}
              {lapTimes[selectedOverviewCategory] && lapTimes[selectedOverviewCategory].length > 0 && (
                <div className="hidden md:flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    {lapTimes[selectedOverviewCategory]
                      .filter(lt => lt.batteryIndex === selectedBatteryIndex).length} pilotos
                  </span>
                  <span>|</span>
                  <span>
                    {selectedPilotsForChart.length} selecionados
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowLapTimesChart(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content - Split Layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {lapTimesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Carregando tempos volta a volta...</span>
              </div>
            ) : lapTimes[selectedOverviewCategory] && lapTimes[selectedOverviewCategory].length > 0 ? (
              <>
                {/* Sidebar - Pilot Selection */}
                <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      👥 Selecionar Pilotos
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        {selectedPilotsForChart.length}
                      </span>
                    </h3>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => {
                          const allPilotIds = lapTimes[selectedOverviewCategory]
                            .filter(lapTime => lapTime.batteryIndex === selectedBatteryIndex)
                            .map(lapTime => lapTime.userId);
                          setSelectedPilotsForChart(allPilotIds);
                        }}
                      >
                        ✓ Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => setSelectedPilotsForChart([])}
                      >
                        ✗ Limpar
                      </Button>
                    </div>
                  </div>
                  
                  {/* Pilots List - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {lapTimes[selectedOverviewCategory]
                      .filter(lapTime => lapTime.batteryIndex === selectedBatteryIndex)
                      .sort((a, b) => a.kartNumber - b.kartNumber)
                                             .map((lapTime, index) => {
                         const isSelected = selectedPilotsForChart.includes(lapTime.userId);
                         const pilotColor = getPilotColor(lapTime.userId);
                        
                        return (
                          <label 
                            key={lapTime.userId} 
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-white border ${
                              isSelected 
                                ? 'bg-white border-orange-200 shadow-sm' 
                                : 'bg-gray-100 border-transparent hover:border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPilotsForChart(prev => [...prev, lapTime.userId]);
                                } else {
                                  setSelectedPilotsForChart(prev => prev.filter(id => id !== lapTime.userId));
                                }
                              }}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-3"
                            />
                            
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {isSelected && (
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: pilotColor }}
                                />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                                                 <div className="font-medium text-sm text-gray-900 truncate">
                                   {lapTime.user?.name ? formatName(lapTime.user.name) : `Piloto ${lapTime.userId}`}
                                 </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  <span>Kart {lapTime.kartNumber}</span>
                                  <span>•</span>
                                  <span>{lapTime.lapTimes.length} voltas</span>
                                  {lapTime.lapTimes.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono">
                                        {LapTimesService.getBestLapTime(lapTime.lapTimes)?.time}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Main Chart Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {selectedPilotsForChart.length > 0 ? (
                    <div className="flex-1 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="lap" 
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            label={{ value: 'Volta', position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                            tickFormatter={(value) => LapTimesService.formatMsToTime(value)}
                            label={{ value: 'Tempo', angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                            width={80}
                          />
                          <RechartsTooltip 
                            formatter={(value: any) => [LapTimesService.formatMsToTime(value), 'Tempo']}
                            labelFormatter={(label) => `Volta ${label}`}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          {selectedPilotsForChart.map((pilotId) => {
                            const lapTime = lapTimes[selectedOverviewCategory]?.find(
                              lt => lt.userId === pilotId && lt.batteryIndex === selectedBatteryIndex
                            );
                            if (!lapTime) return null;

                            const data = lapTime.lapTimes.map(lt => ({
                              lap: lt.lap,
                              timeMs: lt.timeMs,
                              time: lt.time
                            }));

                            const pilotColor = getPilotColor(pilotId);

                            return (
                              <Line
                                key={pilotId}
                                type="monotone"
                                dataKey="timeMs"
                                data={data}
                                stroke={pilotColor}
                                strokeWidth={2.5}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                                name={`${lapTime.user?.name ? formatName(lapTime.user.name) : `Piloto ${pilotId}`} (Kart ${lapTime.kartNumber})`}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <div className="text-lg font-medium mb-2">Selecione os pilotos</div>
                        <div className="text-sm">Escolha os pilotos na lateral para visualizar o gráfico</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">⏱️</div>
                  <div className="text-lg font-medium mb-2">Nenhum tempo volta a volta encontrado</div>
                  <div className="text-sm">
                    Para esta categoria e bateria.
                    <br />
                    Importe os dados usando o botão "Importar Volta a Volta".
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer - Compact with Stats */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {selectedPilotsForChart.length > 0 && lapTimes[selectedOverviewCategory] && (
                <>
                  <span>
                    {selectedPilotsForChart.length} pilotos selecionados
                  </span>
                  <span>•</span>
                  <span>
                    {Math.max(...selectedPilotsForChart.map(pilotId => {
                      const lapTime = lapTimes[selectedOverviewCategory]?.find(
                        lt => lt.userId === pilotId && lt.batteryIndex === selectedBatteryIndex
                      );
                      return lapTime?.lapTimes.length || 0;
                    }))} voltas máximo
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    
    {/* Modal de confirmação em massa de pilotos */}
    <BulkConfirmPilotsModal
      stageId={selectedStageId}
      isOpen={showBulkConfirmModal}
      onClose={handleCloseBulkConfirmModal}
      onSuccess={handleBulkConfirmSuccess}
    />

    {/* Dialog de confirmação para limpar todos os resultados */}
    <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar limpeza de resultados</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja limpar todos os resultados desta bateria?
            <br /><br />
            <strong>Esta ação irá:</strong>
            <br />
            • Manter os karts sorteados
            <br />
            • Resetar todos os pesos para "OK"
            <br />
            • Limpar todas as posições, voltas e tempos
            <br />
            • Remover dados de volta a volta
            <br /><br />
            <strong>Esta ação não pode ser desfeita.</strong>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={cancelClearAllDialog}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={clearAllResults}
          >
            Limpar Todos os Resultados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}; 