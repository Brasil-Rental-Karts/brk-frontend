import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "brk-design-system";
import { Button, Badge } from "brk-design-system";
import { ChevronDown, MoreHorizontal, CheckCircle, XCircle, Loader2, ChevronRight, Plus, GripVertical, Edit, Copy, Trash2, Circle, X } from "lucide-react";
import { CategoryService, Category } from '@/lib/services/category.service';
import { SeasonRegistrationService, SeasonRegistration } from '@/lib/services/season-registration.service';
import { Loading } from '@/components/ui/loading';
import { StageParticipationService, StageParticipation } from '@/lib/services/stage-participation.service';
import { toast } from "sonner";
// Função utilitária para formatação de nomes
function formatName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
import { useAuth } from '@/contexts/AuthContext';
import { StageService } from '@/lib/services/stage.service';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'brk-design-system';
import { createPortal } from "react-dom";

interface Stage {
  id: string;
  name: string;
  time: string; // HH:MM format
}

interface Season {
  id: string;
  name: string;
  status?: string;
  stages?: Stage[];
}

interface RaceDayTabProps {
  seasons: Season[];
}

interface ScheduleItem {
  id: string;
  label: string;
  time: string;
}

const RaceDayHeader: React.FC<{
  seasons: Season[];
  selectedSeasonId: string;
  onSelectSeason: (seasonId: string) => void;
  stages: Stage[];
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
              if (newSeason?.stages?.length) {
                onSelectStage(newSeason.stages[0].id);
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

export const RaceDayTab: React.FC<RaceDayTabProps> = ({ seasons }) => {
  const { user } = useAuth();
  // Filtrar temporadas válidas
  const validSeasons = seasons.filter(s => s.status === 'agendado' || s.status === 'em_andamento');
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
    if (validSeasons.length > 0) return validSeasons[0].id;
    return seasons[0]?.id || "";
  });
  const selectedSeason = seasons.find(s => s.id === selectedSeasonId) || seasons[0];
  const stages = selectedSeason?.stages || [];
  const [selectedStageId, setSelectedStageId] = useState(() => getClosestStage(stages) || "");
  const selectedStage = stages.find(s => s.id === selectedStageId) || stages[0];
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageParticipations, setStageParticipations] = useState<StageParticipation[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemTime, setNewItemTime] = useState('');
  const [pilotLoading, setPilotLoading] = useState<{ [key: string]: boolean }>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showPilotConfirmationModal, setShowPilotConfirmationModal] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Função para alternar a visibilidade do formulário de adicionar item
  const toggleAddItemForm = () => {
    setShowAddItemForm(!showAddItemForm);
    // Limpar campos quando ocultar o formulário
    if (showAddItemForm) {
      setNewItemLabel('');
      setNewItemTime('');
    }
  };

  // Função para fechar o modal de confirmação de pilotos
  const handleClosePilotConfirmationModal = () => {
    setShowPilotConfirmationModal(false);
    // Limpar estado de loading imediatamente
    setPilotLoading({});
  };

  // Função para abrir o modal de confirmação de pilotos
  const handleOpenPilotConfirmationModal = () => {
    setShowPilotConfirmationModal(true);
  };

  // Limpar estado quando o componente for desmontado
  useEffect(() => {
    return () => {
      setShowPilotConfirmationModal(false);
      setPilotLoading({});
    };
  }, []);

  // Limpar estado quando a etapa mudar
  useEffect(() => {
    if (showPilotConfirmationModal) {
      setShowPilotConfirmationModal(false);
      setPilotLoading({});
    }
    // Ocultar formulário de adicionar item quando mudar de etapa
    setShowAddItemForm(false);
    setNewItemLabel('');
    setNewItemTime('');
  }, [selectedStageId]);

  // --- Frotas ---
  type Fleet = { id: string; name: string; totalKarts: number };
  const [fleets, setFleets] = useState<Fleet[]>([
    { id: '1', name: 'Frota 1', totalKarts: 20 },
  ]);

  // Carregar frotas da etapa selecionada
  const loadFleets = async () => {
    if (!selectedStage?.id) return;
    
    try {
      const stage = await StageService.getById(selectedStage.id);
      
      if (stage.fleets && Array.isArray(stage.fleets) && stage.fleets.length > 0) {
        setFleets(stage.fleets);
        
        // Carregar estado dos karts inativos
        const newInactiveKarts: { [fleetId: string]: number[] } = {};
        stage.fleets.forEach((fleet: any) => {
          if (fleet.inactiveKarts && Array.isArray(fleet.inactiveKarts)) {
            newInactiveKarts[fleet.id] = fleet.inactiveKarts;
          }
        });
        setInactiveKarts(newInactiveKarts);
      } else {
        // Se não há frotas salvas, usar padrão
        const defaultFleets = [{ id: '1', name: 'Frota 1', totalKarts: 20 }];
        setFleets(defaultFleets);
        setInactiveKarts({});
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao carregar frotas:', error);
      // Em caso de erro, usar padrão
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
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao salvar frotas:', error);
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
    const newFleets = fleets.map(f => f.id === id ? { ...f, totalKarts } : f);
    setFleets(newFleets);
    saveFleets(newFleets);
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

  useEffect(() => {
    if (selectedStage && categories.length > 0) {
      loadSchedule();
    }
  }, [selectedStage, categories.length]);

  const loadSchedule = async () => {
    if (!selectedStage) return;
    
    try {
      const stageData = await StageService.getStageById(selectedStage.id);
      const currentSchedule = stageData.schedule || [];
      
      // Se não há cronograma cadastrado e há categorias disponíveis, gerar cronograma padrão automaticamente
      if (currentSchedule.length === 0 && categories.length > 0 && canEditSchedule) {
        await generateDefaultScheduleAutomatically();
      } else {
        setScheduleItems(currentSchedule);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao carregar cronograma:', error);
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
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao salvar cronograma:', error);
      // Opcional: mostrar notificação de erro para o usuário
    }
  };

  const saveSchedule = async () => {
    if (!selectedStage) return;
    
    try {
      await StageService.updateSchedule(selectedStage.id, scheduleItems);
    } catch (error) {
      console.error('Erro ao salvar cronograma:', error);
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

  // Busca dados ao trocar temporada
  useEffect(() => {
    if (!selectedSeasonId) {
      setError('Nenhuma temporada selecionada.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      CategoryService.getBySeasonId(selectedSeasonId),
      SeasonRegistrationService.getBySeasonId(selectedSeasonId)
    ])
      .then(([cats, regs]) => {
        setCategories(cats);
        setRegistrations(regs);
      })
      .catch((err) => {
        setError(err.message || JSON.stringify(err));
      })
      .finally(() => setLoading(false));
  }, [selectedSeasonId]);

  // Buscar participações da etapa selecionada
  useEffect(() => {
    if (!selectedStageId) {
      setStageParticipations([]);
      return;
    }
    StageParticipationService.getStageParticipations(selectedStageId)
      .then(setStageParticipations)
      .catch(() => setStageParticipations([]));
  }, [selectedStageId]);

  // Função para alternar status de confirmação do piloto
  const handleToggleConfirm = async (reg: any, catId: string, isConfirmed: boolean) => {
    const key = reg.userId + '-' + catId;
    setPilotLoading((prev: { [key: string]: boolean }) => ({ ...prev, [key]: true }));
    try {
      if (isConfirmed) {
        // Cancelar participação (envia userId se backend aceitar)
        const data: any = {
          stageId: selectedStageId,
          categoryId: catId
        };
        if (reg.userId) data.userId = reg.userId;
        await StageParticipationService.cancelParticipation(data);
      } else {
        // Confirmar participação (envia userId se backend aceitar)
        const data: any = {
          stageId: selectedStageId,
          categoryId: catId
        };
        if (reg.userId) data.userId = reg.userId;
        await StageParticipationService.confirmParticipation(data);
      }
      // Atualizar participações
      const updated = await StageParticipationService.getStageParticipations(selectedStageId);
      setStageParticipations(updated);
    } catch (err) {
      let msg = 'Erro ao atualizar participação';
      if (err instanceof Error) msg = err.message;
      else if (typeof err === 'string') msg = err;
      toast.error(msg);
    } finally {
      setPilotLoading((prev: { [key: string]: boolean }) => ({ ...prev, [key]: false }));
    }
  };

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="text-lg font-semibold text-gray-900 min-w-[60px]">
                      {item.time}
                    </div>
                    <div className="text-gray-700 flex-1">
                      {item.label}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <MoreHorizontal className="w-4 h-4" />
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
      
      if (current.includes(kartIdx)) {
        // Remove da lista de inativos
        newInactiveKarts[fleetId] = current.filter(i => i !== kartIdx);
      } else {
        // Adiciona à lista de inativos
        newInactiveKarts[fleetId] = [...current, kartIdx];
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

  // Componente Modal customizado para evitar problemas de z-index
  const PilotConfirmationModal = () => {
    if (!showPilotConfirmationModal) return null;

    // Verificar se estamos no lado do cliente
    if (typeof window === 'undefined') return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleClosePilotConfirmationModal}
        />
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] mx-4 overflow-hidden flex flex-col z-50">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Gerenciar Confirmações de Pilotos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Confirme ou cancele a participação dos pilotos na etapa selecionada.
              </p>
            </div>
            <button
              onClick={handleClosePilotConfirmationModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <Loading type="spinner" size="md" message="Carregando dados..." />
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="space-y-6">
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
                    <div key={category.id} className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-semibold text-gray-900">
                            {category.name}
                          </h4>
                          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                            {confirmedPilots.length}/{category.maxPilots}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="space-y-3">
                          {categoryPilots
                            .sort((a, b) => {
                              return (
                                (a.user?.name || a.userId).localeCompare(b.user?.name || b.userId)
                              );
                            })
                            .map((pilot) => {
                              const isConfirmed = confirmedPilots.some(p => p.userId === pilot.userId);
                              const isLoading = !!pilotLoading[pilot.userId + '-' + category.id];
                              
                              return (
                                <div key={pilot.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-gray-900">
                                      {formatName(pilot.user?.name || pilot.userId)}
                                    </span>
                                    {isConfirmed && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Confirmado
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => handleToggleConfirm(pilot, category.id, isConfirmed)}
                                          className="flex items-center space-x-1"
                                          disabled={isLoading}
                                        >
                                          {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                          ) : isConfirmed ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-gray-400" />
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {isConfirmed ? 'Cancelar participação' : 'Confirmar participação'}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleClosePilotConfirmationModal}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Inteligente */}
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
                  setSelectedSeasonId(seasonId);
                  const newSeason = seasons.find(s => s.id === seasonId);
                  if (newSeason?.stages?.length) {
                    setSelectedStageId(getClosestStage(newSeason.stages) || newSeason.stages[0].id);
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
                className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 font-semibold text-base pr-8 focus:outline-none focus:border-orange-500 min-w-[140px]"
                value={selectedStageId}
                onChange={e => setSelectedStageId(e.target.value)}
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
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenPilotConfirmationModal}>
                  Gerenciar Confirmações
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
                  <div key={category.id} className="border border-gray-200 rounded-lg">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                          {confirmedPilots.length}/{category.maxPilots}
                        </span>
                      </div>
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
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
                            .map((pilot) => (
                              <div key={pilot.id} className="flex items-center">
                                <span className="text-sm text-gray-900 font-medium">
                                  {formatName(pilot.user?.name || pilot.userId)}
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="text-sm text-gray-500 text-center py-2">
                            Nenhum piloto confirmado nesta categoria
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
            {canEditSchedule && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={toggleAddItemForm}>
                    {showAddItemForm ? 'Cancelar' : 'Adicionar item ao cronograma'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frota/Sorteio
          </h3>
          <div className="flex flex-wrap gap-6 items-end mb-4 w-full">
            {fleets.map((fleet, idx) => (
              <div key={fleet.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 w-full">
                <div
                  className="flex items-center gap-2 mb-2 cursor-pointer select-none"
                  onClick={() => toggleFleet(fleet.id)}
                >
                  {expandedFleets.has(fleet.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <input
                    type="text"
                    value={fleet.name}
                    onChange={e => handleFleetNameChange(fleet.id, e.target.value)}
                    className="font-semibold text-lg border-b border-gray-300 focus:border-orange-500 outline-none flex-1 bg-transparent"
                    style={{ minWidth: 0 }}
                    onClick={e => e.stopPropagation()}
                  />
                  {fleets.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveFleet(fleet.id); }}
                      className="ml-2 text-gray-400 hover:text-red-500"
                      title="Remover frota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {expandedFleets.has(fleet.id) && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-500">Total de karts:</span>
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 bg-white text-lg font-bold hover:bg-gray-100"
                        onClick={e => { e.stopPropagation(); handleFleetKartsChange(fleet.id, Math.max(0, fleet.totalKarts - 1)); }}
                        disabled={fleet.totalKarts <= 0}
                        tabIndex={-1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={fleet.totalKarts}
                        onChange={e => handleFleetKartsChange(fleet.id, Math.max(0, Math.min(99, Number(e.target.value))))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 bg-white text-lg font-bold hover:bg-gray-100"
                        onClick={e => { e.stopPropagation(); handleFleetKartsChange(fleet.id, Math.min(99, fleet.totalKarts + 1)); }}
                        disabled={fleet.totalKarts >= 99}
                        tabIndex={-1}
                      >
                        +
                      </button>
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
            <Button
              onClick={handleAddFleet}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-black flex items-center justify-center gap-2"
              title="Adicionar frota"
              type="button"
              variant="default"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              Adicionar frota
            </Button>
          </div>
        </div>
      </div>



      {/* Modal de Confirmação de Pilotos */}
      <PilotConfirmationModal />
    </div>
  );
}; 