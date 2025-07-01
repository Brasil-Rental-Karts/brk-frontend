import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "brk-design-system";
import { Button, Badge } from "brk-design-system";
import { ChevronDown, MoreHorizontal, CheckCircle, XCircle, Loader2, ChevronRight, Plus, GripVertical, Edit, Copy, Trash2 } from "lucide-react";
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
} from 'brk-design-system';

interface Stage {
  id: string;
  name: string;
  time: string; // HH:MM format
}

interface Season {
  id: string;
  name: string;
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
    <div className="flex items-center gap-4">
      {/* Temporada */}
      <div className="relative">
        <select
          className="appearance-none bg-transparent font-bold text-2xl pr-6 focus:outline-none"
          value={selectedSeasonId}
          onChange={e => onSelectSeason(e.target.value)}
        >
          {seasons.map(season => (
            <option key={season.id} value={season.id}>{season.name}</option>
          ))}
        </select>
        <ChevronDown className="w-5 h-5 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {/* Etapa */}
      <div className="relative">
        <select
          className="appearance-none bg-transparent font-semibold text-lg pr-6 focus:outline-none"
          value={selectedStageId}
          onChange={e => onSelectStage(e.target.value)}
        >
          {stages.map(stage => (
            <option key={stage.id} value={stage.id}>{stage.name}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
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
  // Estado de seleção
  const [selectedSeasonId, setSelectedSeasonId] = useState(seasons[0]?.id || "");
  const selectedSeason = seasons.find(s => s.id === selectedSeasonId) || seasons[0];
  const stages = selectedSeason?.stages || [];
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id || "");
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingScheduleGeneration, setPendingScheduleGeneration] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: '', time: '' });

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
    if (selectedStage) {
      loadSchedule();
    }
  }, [selectedStage]);

  const loadSchedule = async () => {
    if (!selectedStage) return;
    
    try {
      const stageData = await StageService.getStageById(selectedStage.id);
      setScheduleItems(stageData.schedule || []);
    } catch (error) {
      console.error('Erro ao carregar cronograma:', error);
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
      console.error('Erro ao salvar cronograma:', error);
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

  const generateDefaultSchedule = () => {
    if (!selectedStage || !categories.length) return;
    
    // Verificar se já existem itens no cronograma
    if (scheduleItems.length > 0) {
      setShowConfirmDialog(true);
      setPendingScheduleGeneration(true);
    } else {
      const startTime = selectedStage.time;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      
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
      saveScheduleToDatabase(newScheduleItems);
    }
  };

  const handleConfirmScheduleGeneration = () => {
    setShowConfirmDialog(false);
    setPendingScheduleGeneration(false);
    
    if (!selectedStage || !categories.length) return;
    
    const startTime = selectedStage.time;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
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
    saveScheduleToDatabase(newScheduleItems);
  };

  const handleCancelScheduleGeneration = () => {
    setShowConfirmDialog(false);
    setPendingScheduleGeneration(false);
  };

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item.id);
    setEditForm({ label: item.label, time: item.time });
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editForm.label.trim() || !editForm.time.trim()) return;
    
    const updatedSchedule = scheduleItems.map(item => 
      item.id === editingItem 
        ? { ...item, label: editForm.label.trim(), time: editForm.time.trim() }
        : item
    );
    
    setScheduleItems(updatedSchedule);
    saveScheduleToDatabase(updatedSchedule);
    setEditingItem(null);
    setEditForm({ label: '', time: '' });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({ label: '', time: '' });
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
  const fleets = [
    {
      name: "Frota Branca",
      karts: 20,
      selected: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
      disabled: [17],
    },
    {
      name: "Frota Amarela",
      karts: 20,
      selected: [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20],
      disabled: [9],
    },
  ];

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
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Descrição do item"
                  />
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleSaveEdit}
                    disabled={!editForm.label.trim() || !editForm.time.trim()}
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

  return (
    <div className="space-y-6">
      {/* Header Inteligente */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                className="appearance-none bg-transparent font-bold text-2xl pr-8 focus:outline-none border-b-2 border-transparent hover:border-orange-300 focus:border-orange-500 transition-colors"
                value={selectedStageId}
                onChange={(e) => {
                  const stageId = e.target.value;
                  const stage = stages.find(s => s.id === stageId);
                  if (stage) {
                    setSelectedStageId(stageId);
                    // A temporada já está correta pois as etapas são filtradas pela temporada selecionada
                  }
                }}
              >
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({selectedSeason?.name})
            </span>
          </div>
          
          {/* Seletor de Temporada (apenas se houver múltiplas temporadas) */}
          {seasons.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Temporada:</span>
              <div className="relative">
                <select
                  className="appearance-none bg-transparent font-semibold text-lg pr-6 focus:outline-none border-b border-transparent hover:border-orange-300 focus:border-orange-500 transition-colors"
                  value={selectedSeasonId}
                  onChange={(e) => {
                    const seasonId = e.target.value;
                    setSelectedSeasonId(seasonId);
                    // Resetar para a primeira etapa da nova temporada
                    const newSeason = seasons.find(s => s.id === seasonId);
                    if (newSeason?.stages?.length) {
                      setSelectedStageId(newSeason.stages[0].id);
                    }
                  }}
                >
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>{season.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm">
          Visão geral
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Pilotos Confirmados por Categoria */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pilotos Confirmados por Categoria
          </h3>
          
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
                        {categoryPilots
                          .sort((a, b) => {
                            // Confirmados primeiro, depois não confirmados
                            const aConfirmed = confirmedPilots.some(p => p.userId === a.userId);
                            const bConfirmed = confirmedPilots.some(p => p.userId === b.userId);
                            if (aConfirmed && !bConfirmed) return -1;
                            if (!aConfirmed && bConfirmed) return 1;
                            // Ambos com mesmo status, ordenar alfabeticamente
                            return a.user?.name?.localeCompare(b.user?.name) || a.userId.localeCompare(b.userId);
                          })
                          .map((pilot) => (
                            <div key={pilot.id} className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 font-medium">
                                {formatName(pilot.user?.name || pilot.userId)}
                              </span>
                              <button
                                onClick={() => handleToggleConfirm(pilot, category.id, confirmedPilots.some(p => p.userId === pilot.userId))}
                                className="flex items-center space-x-1"
                                disabled={!!pilotLoading[pilot.userId + '-' + category.id]}
                              >
                                {confirmedPilots.some(p => p.userId === pilot.userId) ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                              </button>
                            </div>
                          ))}
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateDefaultSchedule}
                disabled={!selectedStage || !categories.length}
              >
                Gerar Padrão
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
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
            
            {canEditSchedule && (
              <div className="space-y-3">
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
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={addScheduleItem}
                  disabled={!newItemLabel.trim() || !newItemTime.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Coluna 3: Frota/Sorteio */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frota/Sorteio
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p>Funcionalidade em desenvolvimento</p>
          </div>
        </div>
      </div>

      <Dialog
        open={showConfirmDialog}
        onOpenChange={handleCancelScheduleGeneration}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substituir cronograma</DialogTitle>
            <DialogDescription>
              Já existem itens no cronograma. Gerar o cronograma padrão irá substituir todos os itens existentes. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelScheduleGeneration}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmScheduleGeneration}>
              Substituir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 