import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "brk-design-system";
import { Button, Badge } from "brk-design-system";
import { ChevronDown, MoreHorizontal, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { CategoryService, Category } from '@/lib/services/category.service';
import { SeasonRegistrationService, SeasonRegistration } from '@/lib/services/season-registration.service';
import { Loading } from '@/components/ui/loading';
import { StageParticipationService, StageParticipation } from '@/lib/services/stage-participation.service';

interface Stage {
  id: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
  stages?: Stage[];
}

interface RaceDayTabProps {
  seasons: Season[];
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

// Função utilitária para camel case
function toCamelCase(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export const RaceDayTab: React.FC<RaceDayTabProps> = ({ seasons }) => {
  // Estado de seleção
  const [selectedSeasonId, setSelectedSeasonId] = useState(seasons[0]?.id || "");
  const selectedSeason = seasons.find(s => s.id === selectedSeasonId) || seasons[0];
  const stages = selectedSeason?.stages || [];
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id || "");

  // Dados reais
  const [categories, setCategories] = useState<Category[]>([]);
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageParticipations, setStageParticipations] = useState<StageParticipation[]>([]);

  // Estado de categorias expandidas
  const [expandedCategories, setExpandedCategories] = useState<{ [catId: string]: boolean }>({});

  // Estado de loading por piloto
  const [pilotLoading, setPilotLoading] = useState<{ [key: string]: boolean }>({});

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Atualiza etapas ao trocar temporada
  useEffect(() => {
    setSelectedStageId(stages[0]?.id || "");
  }, [selectedSeasonId]);

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
    setPilotLoading((prev) => ({ ...prev, [key]: true }));
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
      alert(msg);
    } finally {
      setPilotLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // MOCK temporário para as outras colunas
  const schedule = [
    { label: "7:00 - Track walk e Briefing" },
    { label: "#1 – Atlog (Sênior)" },
    { label: "#2 – Potenchip (Graduados)" },
    { label: "#3 – Auto Mecânica JY (Super Sênior)" },
    { label: "#4 – Clínica Ria Mais (Super Graduados)" },
    { label: "#5 – Recanto Divisa (Novatos/Estrantes)" },
    { label: "Premiação" },
  ];
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

  return (
    <div>
      <RaceDayHeader 
        seasons={seasons}
        selectedSeasonId={selectedSeasonId}
        onSelectSeason={setSelectedSeasonId}
        stages={stages}
        selectedStageId={selectedStageId}
        onSelectStage={setSelectedStageId}
      />
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Pilotos confirmados */}
        <Card className="flex-1 min-w-[320px] max-w-sm">
          <CardHeader>
            <CardTitle>Pilotos</CardTitle>
            <CardDescription>Confirmados para a etapa</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading type="spinner" size="md" message="Carregando dados..." />
            ) : error ? (
              <div className="text-red-500 whitespace-pre-wrap">Erro: {error}</div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => {
                  // Filtrar pilotos dessa categoria
                  const catRegs = registrations.filter(reg =>
                    reg.categories.some((rc: any) => rc.category.id === cat.id)
                  );
                  // Contar apenas confirmados na etapa
                  const confirmedCount = catRegs.filter(reg =>
                    stageParticipations.some(
                      (part) => part.userId === reg.userId && part.categoryId === cat.id && part.status === 'confirmed'
                    )
                  ).length;
                  const isOpen = !!expandedCategories[cat.id];
                  return (
                    <div key={cat.id} className="border-b last:border-b-0 py-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{cat.name} - {confirmedCount}/{cat.maxPilots}</div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => toggleCategory(cat.id)}>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                      {/* Lista de pilotos (expandível no futuro) */}
                      {isOpen && (
                        <div className="pl-2 mt-2 space-y-1">
                          {(() => {
                            // Ordenar: confirmados primeiro, depois não confirmados, ambos por nome
                            const sortedRegs = [...catRegs].sort((a, b) => {
                              const aConfirmed = stageParticipations.some(
                                (part) => part.userId === a.userId && part.categoryId === cat.id && part.status === 'confirmed'
                              );
                              const bConfirmed = stageParticipations.some(
                                (part) => part.userId === b.userId && part.categoryId === cat.id && part.status === 'confirmed'
                              );
                              if (aConfirmed !== bConfirmed) {
                                return aConfirmed ? -1 : 1; // Confirmados primeiro
                              }
                              // Ordem alfabética
                              const aName = a.user?.name || '';
                              const bName = b.user?.name || '';
                              return aName.localeCompare(bName);
                            });
                            return sortedRegs.map(reg => {
                              const isConfirmed = stageParticipations.some(
                                (part) => part.userId === reg.userId && part.categoryId === cat.id && part.status === 'confirmed'
                              );
                              return (
                                <div key={reg.id} className="flex items-center justify-between gap-2 text-sm py-1">
                                  <span className="font-medium">{toCamelCase(reg.user?.name || reg.userId)}</span>
                                  <button
                                    type="button"
                                    className="focus:outline-none"
                                    onClick={() => handleToggleConfirm(reg, cat.id, isConfirmed)}
                                    disabled={!!pilotLoading[reg.userId + '-' + cat.id]}
                                  >
                                    {pilotLoading[reg.userId + '-' + cat.id] ? (
                                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : isConfirmed ? (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cronograma */}
        <Card className="flex-1 min-w-[320px] max-w-md">
          <CardHeader>
            <CardTitle>Cronograma</CardTitle>
            <CardDescription>Ordem das corridas em qualquer bateria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.map((item, i) => (
                <div key={i} className="flex items-center bg-dark-900 rounded-lg px-4 py-3 text-white/90 border border-white/10">
                  <div className="mr-3 flex items-center">
                    <span className="inline-block w-6 text-center">
                      <span className="inline-block align-middle">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor"/><rect x="9" y="3" width="2" height="14" rx="1" fill="currentColor"/></svg>
                      </span>
                    </span>
                  </div>
                  <div className="flex-1 font-medium text-base">{item.label}</div>
                  <Button variant="ghost" size="icon" className="text-white/50">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Frota e Sorteio */}
        <Card className="flex-1 min-w-[320px] max-w-sm">
          <CardHeader>
            <CardTitle>Frota e Sorteio</CardTitle>
            <CardDescription>Baseado nas frotas disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fleets.map((fleet, i) => (
                <div key={fleet.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{fleet.name} - {fleet.karts} karts</div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Array.from({ length: fleet.karts }, (_, idx) => {
                      const kartNum = idx + 1;
                      const isSelected = fleet.selected.includes(kartNum);
                      const isDisabled = fleet.disabled.includes(kartNum);
                      return (
                        <span
                          key={kartNum}
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold border 
                            ${isSelected ? 'bg-orange-500 text-white border-orange-600' : 'bg-gray-700 text-white/60 border-gray-600'}
                            ${isDisabled ? 'opacity-50' : ''}`}
                        >
                          {kartNum}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button className="w-full mt-2" variant="outline" disabled>
                Sortear e Distribuir aos Pilotos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 