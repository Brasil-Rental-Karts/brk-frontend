import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'brk-design-system';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { ArrowLeft, X, Loader2, BarChart3, Users, Check, X as XIcon, ChevronDown, ChevronLeft, ChevronRight, Maximize, Minimize, RotateCcw, Smartphone, RefreshCcw } from 'lucide-react';
import { LapTimesService, LapTimes as LapTimesType } from '@/lib/services/lap-times.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatName } from '@/utils/name';
import { SeasonService } from '@/lib/services/season.service';
import { StageService } from '@/lib/services/stage.service';
import { CategoryService } from '@/lib/services/category.service';
import type { TooltipProps } from 'recharts';
import { LegendProps } from 'recharts';
import { useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LapTimesChartProps {
  championshipId?: string;
  categoryId?: string;
  batteryIndex?: number;
}

export const LapTimesChart: React.FC<LapTimesChartProps> = ({ 
  championshipId: propChampionshipId, 
  categoryId: propCategoryId, 
  batteryIndex: propBatteryIndex 
}) => {
  const params = useParams();
  const navigate = useNavigate();
  
  const championshipId = propChampionshipId || params.championshipId;
  const categoryId = propCategoryId || params.categoryId;
  const batteryIndex = propBatteryIndex !== undefined ? propBatteryIndex : (params.batteryIndex ? parseInt(params.batteryIndex) : 0);

  const [lapTimes, setLapTimes] = useState<{ [categoryId: string]: LapTimesType[] }>({});
  const [lapTimesLoading, setLapTimesLoading] = useState(false);
  const [selectedPilotsForChart, setSelectedPilotsForChart] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || '');
  const [selectedBatteryIndex, setSelectedBatteryIndex] = useState<number>(batteryIndex);
  const [batteries, setBatteries] = useState<any[]>([]);
  
  // Estados para temporada e etapa
  const [seasons, setSeasons] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingBatteries, setLoadingBatteries] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Cores para os pilotos
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    '#14B8A6', '#F43F5E', '#22C55E', '#EAB308', '#A855F7'
  ];

  // Paleta de 4 cores bem distintas para até 4 pilotos
  const distinctColors = [
    '#3B82F6', // azul
    '#EF4444', // vermelho
    '#10B981', // verde
    '#F59E0B', // laranja
  ];

  const getPilotColor = (userId: string, indexOverride?: number): string => {
    // Se indexOverride for passado, usar a paleta distinta
    if (typeof indexOverride === 'number') {
      return distinctColors[indexOverride % distinctColors.length];
    }
    // fallback para paleta antiga
    const index = parseInt(userId) % colors.length;
    return colors[index];
  };

  const loadLapTimes = async (categoryId: string) => {
    if (!categoryId || !selectedStageId) return;
    
    setLapTimesLoading(true);
    try {
      const times = await LapTimesService.getLapTimesByStageAndCategory(selectedStageId, categoryId);
      setLapTimes(prev => ({
        ...prev,
        [categoryId]: times
      }));
    } catch (error) {
      console.error('Erro ao carregar tempos volta a volta:', error);
    } finally {
      setLapTimesLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedSeasonId) return;
    
    try {
      // Buscar categorias da temporada selecionada
      const categoriesData = await CategoryService.getBySeasonId(selectedSeasonId);
      setCategories(categoriesData);
      
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0].id);
        loadLapTimes(categoriesData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadBatteries = async () => {
    if (!selectedCategory) return;
    
    setLoadingBatteries(true);
    try {
      // Buscar baterias da categoria selecionada
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category && category.batteriesConfig) {
        setBatteries(category.batteriesConfig);
      } else {
        // Fallback: criar uma bateria padrão se não houver configuração
        setBatteries([{ name: 'Bateria 1', order: 1, isRequired: true }]);
      }
    } catch (error) {
      console.error('Erro ao carregar baterias:', error);
      // Fallback em caso de erro
      setBatteries([{ name: 'Bateria 1', order: 1, isRequired: true }]);
    } finally {
      setLoadingBatteries(false);
    }
  };

  const loadSeasons = async () => {
    if (!championshipId) return;
    
    setLoadingSeasons(true);
    try {
      const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
      const filteredSeasons = seasonsData.data.filter((season: any) => season.championshipId === championshipId);
      setSeasons(filteredSeasons);
      if (filteredSeasons.length > 0) {
        const activeSeason = filteredSeasons.find((s: any) => s.status === 'em_andamento') || filteredSeasons[0];
        setSelectedSeasonId(activeSeason.id);
      }
    } catch (error) {
      console.error('Erro ao carregar temporadas:', error);
    } finally {
      setLoadingSeasons(false);
    }
  };

  const loadStages = async () => {
    if (!selectedSeasonId) return;
    
    setLoadingStages(true);
    try {
      const stagesData = await StageService.getBySeasonId(selectedSeasonId);
      setStages(stagesData);
      if (stagesData.length > 0) {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const futureStages = stagesData
          .filter((stage: any) => stage.date && stage.date.slice(0, 10) >= todayStr)
          .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
        const selectedStage = futureStages[0] || stagesData[0];
        setSelectedStageId(selectedStage.id);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    } finally {
      setLoadingStages(false);
    }
  };

  // Carregar dados quando championshipId mudar
  useEffect(() => {
    if (championshipId) {
      loadSeasons();
    }
  }, [championshipId]);

  // Carregar etapas quando temporada for selecionada
  useEffect(() => {
    if (selectedSeasonId) {
      loadStages();
    }
  }, [selectedSeasonId]);

  // Carregar categorias quando etapa for selecionada
  useEffect(() => {
    if (selectedStageId) {
      loadCategories();
    }
  }, [selectedStageId]);

  // Carregar baterias quando categoria for selecionada
  useEffect(() => {
    if (selectedCategory) {
      loadBatteries();
    }
  }, [selectedCategory]);

  // Carregar tempos volta a volta quando categoria ou bateria mudar
  useEffect(() => {
    if (selectedCategory && selectedStageId) {
      loadLapTimes(selectedCategory);
    }
  }, [selectedCategory, selectedBatteryIndex, selectedStageId]);

  useEffect(() => {
    setSelectedPilotsForChart([]);
  }, [selectedSeasonId, selectedStageId, selectedCategory, selectedBatteryIndex]);

  const handleBack = () => navigate(-1);

  const handleNext = () => {
    setShowFilters(false);
  };

  const handleBackToFilters = () => {
    setShowFilters(true);
  };

  const isFiltersComplete = selectedSeasonId && selectedStageId && selectedCategory && selectedBatteryIndex !== undefined;

  const currentSeason = seasons.find(season => season.id === selectedSeasonId);
  const currentStage = stages.find(stage => stage.id === selectedStageId);
  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const currentBattery = batteries[selectedBatteryIndex];

  const chartCardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();
  
  // Detectar se está em modo PWA
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      setIsPWA(isStandalone || isFullscreen || isMinimalUI);
    };
    
    checkPWA();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWA);
    return () => window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkPWA);
  }, []);
  
  // Verificar se fullscreen está disponível
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  
  useEffect(() => {
    const checkFullscreenSupport = () => {
      // Detectar se é iPhone/iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      // No iPhone/Safari, fullscreen pode não estar disponível, mas sempre mostrar o botão
      if (isIOS && isSafari) {
        setFullscreenSupported(true); // Sempre mostrar o botão no iPhone
        return;
      }
      
      const isSupported = !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
      );
      setFullscreenSupported(isSupported);
    };
    
    checkFullscreenSupport();
  }, []);

  // Função para alternar fullscreen
  const handleToggleFullscreen = () => {
    // Detectar se é iPhone/iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (!isFullscreen) {
      if (chartCardRef.current) {
        // No iPhone/Safari, usar modo maximizado visual
        if (isIOS && isSafari) {
          setIsFullscreen(true);
          return;
        }
        
        // Suporte para diferentes navegadores mobile
        if (chartCardRef.current.requestFullscreen) {
          chartCardRef.current.requestFullscreen().catch((err: any) => {
            console.log('Fullscreen não suportado:', err);
            // Fallback: maximizar o card visualmente
            setIsFullscreen(true);
          });
        } else if ((chartCardRef.current as any).webkitRequestFullscreen) {
          (chartCardRef.current as any).webkitRequestFullscreen().catch((err: any) => {
            console.log('Webkit fullscreen não suportado:', err);
            setIsFullscreen(true);
          });
        } else if ((chartCardRef.current as any).mozRequestFullScreen) {
          (chartCardRef.current as any).mozRequestFullScreen();
        } else if ((chartCardRef.current as any).msRequestFullscreen) {
          (chartCardRef.current as any).msRequestFullscreen();
        } else {
          // Fallback para navegadores que não suportam fullscreen
          console.log('Fullscreen não suportado neste navegador');
          setIsFullscreen(true);
        }
        setIsFullscreen(true);
      }
    } else {
      // No iPhone/Safari, sair do modo maximizado visual
      if (isIOS && isSafari) {
        setIsFullscreen(false);
        return;
      }
      
      // Suporte para sair do fullscreen em diferentes navegadores
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err: any) => {
          console.log('Erro ao sair do fullscreen:', err);
          setIsFullscreen(false);
        });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };
  
  // Função para alternar modo maximizado (fallback quando fullscreen não está disponível)
  const handleToggleMaximized = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Listener para sair do fullscreen
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).mozFullScreenElement && 
          !(document as any).msFullscreenElement) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  // Tooltip customizado
  const CustomTooltip = (props: TooltipProps<any, any>) => {
    const { active, payload, label } = props as any;
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, minWidth: 160 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{`Volta ${label}`}</div>
        {payload.map((entry: any, idx: number) => (
          <div key={entry.dataKey + '-' + idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 6, background: entry.color, marginRight: 8 }} />
            <span style={{ fontWeight: 500, marginRight: 6 }}>{entry.name}</span>
            <span style={{ fontFamily: 'monospace', color: '#555' }}>{LapTimesService.formatMsToTime(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const [showChartMobile, setShowChartMobile] = useState(false);

  // Minimizar filtro e mostrar gráfico ao clicar no botão (mobile)
  const handleShowChartMobile = () => {
    setSidebarVisible(false);
    setShowChartMobile(true);
  };

  // Se maximizar filtro, esconder gráfico (mobile)
  useEffect(() => {
    if (isMobile && sidebarVisible) {
      setShowChartMobile(false);
    }
  }, [isMobile, sidebarVisible]);

  // Sempre que filtros mudarem, esconder gráfico no mobile
  useEffect(() => {
    if (isMobile) setShowChartMobile(false);
  }, [selectedSeasonId, selectedStageId, selectedCategory, selectedBatteryIndex]);

  // Estado para forçar exibição do gráfico mesmo em portrait
  const [forcarGraficoNoPortrait, setForcarGraficoNoPortrait] = useState(false);

  // Detectar orientação com suporte melhorado para PWA
  const [isPortrait, setIsPortrait] = useState(() => {
    // Detecção inicial mais robusta
    const width = window.innerWidth || document.documentElement.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight;
    
    // Tentar usar a API de orientação do dispositivo se disponível
    if ('orientation' in window) {
      const orientation = (window as any).orientation;
      if (orientation !== undefined) {
        return orientation === 0 || orientation === 180; // 0 e 180 são portrait
      }
    }
    
    return height > width;
  });
  
  useEffect(() => {
    const handleResize = () => {
      // Usar múltiplas fontes para detectar dimensões
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      const newIsPortrait = height > width;
      
      // Adicionar um pequeno delay para PWA
      setTimeout(() => {
        setIsPortrait(newIsPortrait);
      }, 100);
    };
    
    // Detectar mudanças de orientação específicas para mobile
    const handleOrientationChange = () => {
      // Aguardar um pouco para o PWA processar a mudança
      setTimeout(() => {
        // Tentar usar a API de orientação primeiro
        if ('orientation' in window) {
          const orientation = (window as any).orientation;
          if (orientation !== undefined) {
            setIsPortrait(orientation === 0 || orientation === 180);
            return;
          }
        }
        
        // Fallback para detecção por dimensões
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        setIsPortrait(height > width);
      }, 200);
    };
    
    // Event listeners para diferentes tipos de mudança
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Para PWA, também escutar mudanças no viewport
    if ('visualViewport' in window) {
      (window as any).visualViewport?.addEventListener('resize', handleResize);
    }
    
    // Para PWA, adicionar um listener mais frequente para detectar mudanças
    let orientationCheckInterval: NodeJS.Timeout;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      orientationCheckInterval = setInterval(() => {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        const currentIsPortrait = height > width;
        if (currentIsPortrait !== isPortrait) {
          setIsPortrait(currentIsPortrait);
        }
      }, 500); // Verificar a cada 500ms no PWA
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if ('visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', handleResize);
      }
      if (orientationCheckInterval) {
        clearInterval(orientationCheckInterval);
      }
    };
  }, [isPortrait]); // Adicionar isPortrait como dependência

  // Se o usuário virar o celular para landscape, mostrar o gráfico automaticamente
  useEffect(() => {
    if (!isPortrait) {
      setForcarGraficoNoPortrait(false);
    }
    

  }, [isPortrait]);

  const isStandalone = !propChampionshipId;

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Título da aba */}
        <div className="border-b border-gray-200 pb-4 mb-6 flex items-center gap-2">
          {isStandalone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análise Volta a Volta</h2>
            <p className="text-sm text-gray-600 mt-1">
              Compare o desempenho dos pilotos volta a volta nas baterias do campeonato
            </p>
          </div>
        </div>
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-120px)]">
          {/* Sidebar - Pilot Selection */}
          {sidebarVisible && (
            <div
              className={`lg:col-span-1 relative flex flex-col${isMobile ? ' w-full' : ' h-full'}`}
              style={isMobile ? { maxWidth: '100vw', minWidth: 0, height: '100dvh' } : {}}
            >
              <Card className={`relative flex flex-col${isMobile ? '' : ' h-full flex-1 min-h-0'}`}>
                {/* Botão de fechar (X) no topo direito do Card */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10 border border-gray-100 bg-white/80 rounded-full h-8 w-8 p-0 opacity-80 hover:opacity-100 transition-all flex items-center justify-center"
                  onClick={() => {
                    setSidebarVisible(false);
                    if (isMobile) {
                      if (selectedPilotsForChart.length > 0) {
                        setShowChartMobile(true);
                      } else {
                        setShowChartMobile(false);
                      }
                    }
                  }}
                  title="Fechar filtros"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {showFilters ? 'Configurar Filtros' : 'Selecionar Pilotos'}
                    {!showFilters && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedPilotsForChart.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className={`${isMobile ? '' : 'h-full min-h-0 flex-1'} flex flex-col`}>
                  {showFilters ? (
                    <>
                      {/* Season and Stage Selection */}
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Temporada
                            {loadingSeasons && <Loader2 className="w-3 h-3 animate-spin ml-1 inline" />}
                          </label>
                          <div className="relative">
                            <select
                              value={selectedSeasonId}
                              onChange={(e) => {
                                const seasonId = e.target.value;
                                setSelectedSeasonId(seasonId);
                                setSelectedStageId(''); // Reset etapa
                                setSelectedCategory(''); // Reset categoria
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm appearance-none pr-8"
                              disabled={loadingSeasons}
                            >
                              <option value="">{loadingSeasons ? 'Carregando...' : 'Selecione uma temporada'}</option>
                              {seasons.map(season => (
                                <option key={season.id} value={season.id}>
                                  {season.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Etapa
                            {loadingStages && <Loader2 className="w-3 h-3 animate-spin ml-1 inline" />}
                          </label>
                          <div className="relative">
                            <select
                              value={selectedStageId}
                              onChange={(e) => {
                                const stageId = e.target.value;
                                setSelectedStageId(stageId);
                                setSelectedCategory(''); // Reset categoria
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm appearance-none pr-8"
                              disabled={!selectedSeasonId || loadingStages}
                            >
                              <option value="">{loadingStages ? 'Carregando...' : 'Selecione uma etapa'}</option>
                              {stages.map(stage => (
                                <option key={stage.id} value={stage.id}>
                                  {stage.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Categoria
                          </label>
                          <select
                            value={selectedCategory}
                            onChange={(e) => {
                              const categoryId = e.target.value;
                              setSelectedCategory(categoryId);
                              setSelectedBatteryIndex(0); // Reset bateria
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            disabled={!selectedStageId}
                          >
                            <option value="">Selecione uma categoria</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Bateria
                            {loadingBatteries && <Loader2 className="w-3 h-3 animate-spin ml-1 inline" />}
                          </label>
                          <select
                            value={selectedBatteryIndex}
                            onChange={(e) => setSelectedBatteryIndex(parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            disabled={!selectedCategory || loadingBatteries}
                          >
                            <option value="">{loadingBatteries ? 'Carregando...' : 'Selecione uma bateria'}</option>
                            {batteries.map((battery, index) => (
                              <option key={index} value={index}>
                                {battery?.name || `Bateria ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Next Button */}
                      <Button
                        onClick={handleNext}
                        disabled={!isFiltersComplete}
                        className="w-full"
                      >
                        Próximo
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Back to Filters Button */}
                      <Button
                        variant="outline"
                        onClick={handleBackToFilters}
                        className="w-full mb-4"
                      >
                        ← Voltar aos Filtros
                      </Button>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={() => setSelectedPilotsForChart([])}
                        >
                          <XIcon className="w-3 h-3 mr-1" />
                          Limpar
                        </Button>
                        {isMobile && (
                          <Button
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={handleShowChartMobile}
                            disabled={selectedPilotsForChart.length === 0}
                          >
                            Mostrar Gráfico
                          </Button>
                        )}
                      </div>

                      {/* Pilots List */}
                      <div className={`space-y-2${isMobile ? '' : ' flex-1 overflow-y-auto max-h-[600px]'}`}>
                        <div className="text-xs text-gray-500 mb-2">
                          Selecione até <span className="font-semibold text-gray-700">4 pilotos</span> para comparar no gráfico.
                        </div>
                        {lapTimesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                          </div>
                        ) : selectedCategory && lapTimes[selectedCategory]?.filter(lapTime => lapTime.batteryIndex === selectedBatteryIndex).length > 0 ? (
                          lapTimes[selectedCategory]
                            .filter(lapTime => lapTime.batteryIndex === selectedBatteryIndex)
                            .sort((a, b) => a.kartNumber - b.kartNumber)
                            .map((lapTime) => {
                              const isSelected = selectedPilotsForChart.includes(lapTime.userId);
                              const pilotIdx = selectedPilotsForChart.indexOf(lapTime.userId);
                              const pilotColor = isSelected ? getPilotColor(lapTime.userId, pilotIdx) : getPilotColor(lapTime.userId);
                              
                              return (
                                <label 
                                  key={lapTime.userId} 
                                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border ${
                                    isSelected 
                                      ? 'bg-orange-50 border-orange-200' 
                                      : 'bg-white border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={!isSelected && selectedPilotsForChart.length >= 4} // Limita a 4
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        if (selectedPilotsForChart.length < 4) {
                                          setSelectedPilotsForChart(prev => [...prev, lapTime.userId]);
                                        }
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
                            })
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <div className="text-2xl mb-2">⏱️</div>
                            <div className="text-sm">
                              {!selectedCategory ? 'Selecione uma categoria para ver os pilotos' : 'Nenhum tempo volta a volta encontrado'}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {/* Botão para mostrar sidebar quando escondido: fixo no canto esquerdo da tela, só ícone */}
          {!sidebarVisible && (
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-0 top-1/2 -translate-y-1/2 z-20 border border-gray-100 bg-white/80 rounded-l-[2px] h-16 w-10 px-2 opacity-80 hover:opacity-100 transition-all flex items-center justify-center"
              onClick={() => setSidebarVisible(true)}
              title="Mostrar painel lateral"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Renderizar gráfico */}
          {(() => {
            // Lógica para determinar quando mostrar o gráfico
            const shouldShowChart = !isMobile || (isMobile && showChartMobile && !sidebarVisible);
            
            const shouldShowPortraitWarning = isMobile && isPortrait && !forcarGraficoNoPortrait && showChartMobile && !sidebarVisible;
            
            // Se não deve mostrar o gráfico, mostrar mensagem para abrir o filtro
            if (!shouldShowChart) {
              return (
                <div className="w-full pt-6 px-4 flex flex-col items-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-lg font-medium mb-2">Configure os filtros</div>
                    <div className="text-sm text-gray-500 mb-4">Abra o painel lateral para selecionar temporada, etapa, categoria e pilotos</div>
                    <Button 
                      onClick={() => setSidebarVisible(true)}
                      className="mx-auto"
                    >
                      Abrir Filtros
                    </Button>
                  </div>
                </div>
              );
            }
            

            
            if (shouldShowPortraitWarning) {
              return (
                <div className="w-full pt-6 px-4 flex flex-col items-center">
                  <div className="flex items-center justify-center mb-2 w-full">
                    <img src="/landscape-phone.svg" alt="Gire o celular" className="w-14 h-14" />
                  </div>
                  <div className="text-sm text-gray-500 text-center mb-4">Vire o celular para ver o gráfico volta a volta</div>
                  <Button onClick={() => setForcarGraficoNoPortrait(true)} className="mx-auto">Ver assim mesmo</Button>
                </div>
              );
            }
            
            return (
              <div className={sidebarVisible ? "lg:col-span-3" : "lg:col-span-4"}>
                <Card 
                  ref={chartCardRef} 
                  className={`h-full min-h-0 flex flex-col relative ${
                    isFullscreen ? 'ring-2 ring-orange-500 ring-opacity-50 shadow-lg' : ''
                  }`}
                >
                  {/* Indicador de modo maximizado quando fullscreen não está disponível */}
                  {isFullscreen && (
                    <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      Modo Maximizado
                    </div>
                  )}
                  {/* Botão de fullscreen/maximizar no canto superior direito */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={fullscreenSupported ? handleToggleFullscreen : handleToggleMaximized}
                    title={
                      (() => {
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
                        return isIOS && isSafari
                          ? (isFullscreen ? 'Sair do modo maximizado' : 'Maximizar gráfico')
                          : fullscreenSupported 
                            ? (isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia')
                            : (isFullscreen ? 'Sair do modo maximizado' : 'Maximizar gráfico');
                      })()
                    }
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </Button>
                  <CardContent className="h-full min-h-0 flex-1 flex flex-col p-4">
                    {lapTimesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-600">Carregando tempos volta a volta...</span>
                      </div>
                    ) : selectedPilotsForChart.length > 0 ? (
                      <div className="h-full">
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
                            {/* Legenda dos pilotos */}
                            <Legend wrapperStyle={{ marginLeft: 32, marginTop: 24 }}/>
                            {/* Tooltip customizado */}
                            <RechartsTooltip 
                              content={CustomTooltip}
                            />
                            {selectedPilotsForChart.map((pilotId, idx) => {
                              const lapTime = lapTimes[selectedCategory]?.find(
                                lt => lt.userId === pilotId && lt.batteryIndex === selectedBatteryIndex
                              );
                              if (!lapTime) return null;

                              const data = lapTime.lapTimes.map(lt => ({
                                lap: lt.lap,
                                timeMs: lt.timeMs,
                                time: lt.time
                              }));

                              // Usar cor distinta para até 4 pilotos
                              const pilotColor = getPilotColor(pilotId, idx);
                              const pilotName = `${lapTime.user?.name ? formatName(lapTime.user.name) : `Piloto ${pilotId}`} (Kart ${lapTime.kartNumber})`;

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
                                  name={pilotName}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <div className="text-4xl mb-4">📊</div>
                          <div className="text-lg font-medium mb-2">Selecione os pilotos</div>
                          <div className="text-sm">Escolha os pilotos na lateral para visualizar o gráfico</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}; 