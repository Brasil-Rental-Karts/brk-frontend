import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Championship } from '@/lib/services/championship.service';
import { Season } from '@/lib/services/season.service';
import { Category } from '@/lib/services/category.service';
import { Stage } from '@/lib/types/stage';
import { SeasonService } from '@/lib/services/season.service';
import { CategoryService } from '@/lib/services/category.service';
import { StageService } from '@/lib/services/stage.service';
import { RaceTrackService } from '@/lib/services/race-track.service';
import { ChampionshipStaffService, StaffMember } from '@/lib/services/championship-staff.service';
import { SeasonRegistrationService, SeasonRegistration } from '@/lib/services/season-registration.service';
import { PenaltyService, Penalty } from '@/lib/services/penalty.service';
import { ChampionshipClassificationService } from '@/lib/services/championship-classification.service';
import { RegulationService, Regulation } from '@/lib/services/regulation.service';
import { ChampionshipService } from '@/lib/services/championship.service';

// Interface para dados de classificação do Redis
interface ClassificationUser {
  id: string;
  name: string;
  nickname: string | null;
}

interface ClassificationPilot {
  totalPoints: number;
  totalStages: number;
  wins: number;
  podiums: number;
  polePositions: number;
  fastestLaps: number;
  bestPosition: number | null;
  averagePosition: string | null;
  lastCalculatedAt: string;
  user: ClassificationUser;
  categoryId?: string;
}

interface RedisClassificationData {
  lastUpdated: string;
  totalCategories: number;
  totalPilots: number;
  classificationsByCategory: {
    [categoryId: string]: {
      pilots: ClassificationPilot[];
    };
  };
}

interface ChampionshipData {
  championshipInfo: Championship | null;
  seasons: Season[];
  categories: Category[];
  stages: Stage[];
  raceTracks: Record<string, any>;
  staff: StaffMember[];
  registrations: SeasonRegistration[];
  penalties: Penalty[];
  classifications: Record<string, RedisClassificationData>;
  regulations: Record<string, Regulation[]>;
  lastUpdated: {
    championshipInfo: Date | null;
    seasons: Date | null;
    categories: Date | null;
    stages: Date | null;
    raceTracks: Date | null;
    staff: Date | null;
    registrations: Date | null;
    penalties: Date | null;
    classifications: Date | null;
    regulations: Date | null;
  };
}

interface ChampionshipContextType {
  championshipId: string | null;
  championshipData: ChampionshipData;
  loading: {
    championshipInfo: boolean;
    seasons: boolean;
    categories: boolean;
    stages: boolean;
    raceTracks: boolean;
    staff: boolean;
    registrations: boolean;
    penalties: boolean;
    classifications: boolean;
    regulations: boolean;
  };
  error: {
    championshipInfo: string | null;
    seasons: string | null;
    categories: string | null;
    stages: string | null;
    raceTracks: string | null;
    staff: string | null;
    registrations: string | null;
    penalties: string | null;
    classifications: string | null;
    regulations: string | null;
  };
  
  // Funções de busca
  fetchSeasons: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchStages: () => Promise<void>;
  fetchRaceTracks: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchRegistrations: () => Promise<void>;
  fetchPenalties: () => Promise<void>;
  fetchClassification: (seasonId: string) => Promise<void>;
  fetchRegulations: (seasonId: string) => Promise<void>;
  fetchChampionshipInfo: () => Promise<void>;
  
  // Funções de atualização
  refreshSeasons: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshStages: () => Promise<void>;
  refreshRaceTracks: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  refreshRegistrations: () => Promise<void>;
  refreshPenalties: () => Promise<void>;
  refreshClassification: (seasonId: string) => Promise<void>;
  refreshRegulations: (seasonId: string) => Promise<void>;
  
  // Funções de cache
  getSeasons: () => Season[];
  getCategories: () => Category[];
  getStages: () => Stage[];
  getRaceTracks: () => Record<string, any>;
  getStaff: () => StaffMember[];
  getRegistrations: () => SeasonRegistration[];
  getPenalties: () => Penalty[];
  getClassification: (seasonId: string) => RedisClassificationData | null;
  getRegulations: (seasonId: string) => Regulation[];
  getChampionshipInfo: () => Championship | null;
  
  // Funções de atualização específicas
  addSeason: (season: Season) => void;
  updateSeason: (seasonId: string, updatedSeason: Partial<Season>) => void;
  removeSeason: (seasonId: string) => void;
  
  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, updatedCategory: Partial<Category>) => void;
  removeCategory: (categoryId: string) => void;
  
  addStage: (stage: Stage) => void;
  updateStage: (stageId: string, updatedStage: Partial<Stage>) => void;
  removeStage: (stageId: string) => void;
  
  addStaff: (staff: StaffMember) => void;
  updateStaff: (staffId: string, updatedStaff: Partial<StaffMember>) => void;
  removeStaff: (staffId: string) => void;
  
  addRegistration: (registration: SeasonRegistration) => void;
  updateRegistration: (registrationId: string, updatedRegistration: Partial<SeasonRegistration>) => void;
  removeRegistration: (registrationId: string) => void;
  
  addPenalty: (penalty: Penalty) => void;
  updatePenalty: (penaltyId: string, updatedPenalty: Partial<Penalty>) => void;
  removePenalty: (penaltyId: string) => void;
  
  updateClassification: (seasonId: string, classification: RedisClassificationData) => void;
  removeClassification: (seasonId: string) => void;
  
  addRegulation: (seasonId: string, regulation: Regulation) => void;
  updateRegulation: (seasonId: string, regulationId: string, updatedRegulation: Partial<Regulation>) => void;
  removeRegulation: (seasonId: string, regulationId: string) => void;
  updateRegulationsOrder: (seasonId: string, regulations: Regulation[]) => void;
  
  // Funções de limpeza
  clearCache: () => void;
  setChampionshipId: (id: string | null) => void;
}

const ChampionshipContext = createContext<ChampionshipContextType | undefined>(undefined);

interface ChampionshipProviderProps {
  children: React.ReactNode;
}

export const ChampionshipProvider: React.FC<ChampionshipProviderProps> = ({ children }) => {
  const [championshipId, setChampionshipId] = useState<string | null>(null);
  const [championshipData, setChampionshipData] = useState<ChampionshipData>({
    championshipInfo: null,
    seasons: [],
    categories: [],
    stages: [],
    raceTracks: {},
    staff: [],
    registrations: [],
    penalties: [],
    classifications: {},
    regulations: {},
    lastUpdated: {
      championshipInfo: null,
      seasons: null,
      categories: null,
      stages: null,
      raceTracks: null,
      staff: null,
      registrations: null,
      penalties: null,
      classifications: null,
      regulations: null,
    },
  });
  
  const [loading, setLoading] = useState({
    championshipInfo: false,
    seasons: false,
    categories: false,
    stages: false,
    raceTracks: false,
    staff: false,
    registrations: false,
    penalties: false,
    classifications: false,
    regulations: false,
  });
  
  const [error, setError] = useState({
    championshipInfo: null,
    seasons: null,
    categories: null,
    stages: null,
    raceTracks: null,
    staff: null,
    registrations: null,
    penalties: null,
    classifications: null,
    regulations: null,
  });

  // Usar refs para controlar o estado de loading sem causar re-renders
  const loadingRef = useRef({
    seasons: false,
    categories: false,
    stages: false,
    raceTracks: false,
    staff: false,
    registrations: false,
    penalties: false,
    classifications: false,
    regulations: false,
  });

  // Ref para controlar se já buscamos as temporadas
  const hasFetchedSeasons = useRef(false);
  const hasFetchedCategories = useRef(false);
  const hasFetchedStages = useRef(false);
  const hasFetchedRaceTracks = useRef(false);
  const hasFetchedStaff = useRef(false);
  const hasFetchedRegistrations = useRef(false);
  const hasFetchedPenalties = useRef(false);

  // Função para buscar temporadas
  const fetchSeasons = useCallback(async () => {
    if (!championshipId || loadingRef.current.seasons || hasFetchedSeasons.current) return;
    
    loadingRef.current.seasons = true;
    setLoading(prev => ({ ...prev, seasons: true }));
    setError(prev => ({ ...prev, seasons: null }));
    
    try {
      const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
      
      setChampionshipData(prev => ({
        ...prev,
        seasons: seasonsData.data,
        lastUpdated: {
          ...prev.lastUpdated,
          seasons: new Date(),
        },
      }));
      hasFetchedSeasons.current = true;
    } catch (err: any) {
      setError(prev => ({ ...prev, seasons: err.message || 'Erro ao carregar temporadas' }));
    } finally {
      loadingRef.current.seasons = false;
      setLoading(prev => ({ ...prev, seasons: false }));
    }
  }, [championshipId]);

  // Função para buscar categorias
  const fetchCategories = useCallback(async () => {
    if (!championshipId || loadingRef.current.categories || hasFetchedCategories.current) return;
    
    loadingRef.current.categories = true;
    setLoading(prev => ({ ...prev, categories: true }));
    setError(prev => ({ ...prev, categories: null }));
    
    try {
      const allCategories: Category[] = [];
      
      // Buscar categorias de todas as temporadas com contagem de inscritos
      for (const season of championshipData.seasons) {
        try {
          const categories = await CategoryService.getBySeasonId(season.id);
          allCategories.push(...categories);
        } catch (err) {
          console.error(`Erro ao buscar categorias da temporada ${season.id}:`, err);
        }
      }
      
      // Remover duplicatas baseado no ID
      const uniqueCategories = allCategories.filter((category, index, self) => 
        index === self.findIndex(c => c.id === category.id)
      );
      
      setChampionshipData(prev => ({
        ...prev,
        categories: uniqueCategories,
        lastUpdated: {
          ...prev.lastUpdated,
          categories: new Date(),
        },
      }));
      hasFetchedCategories.current = true;
    } catch (err: any) {
      setError(prev => ({ ...prev, categories: err.message || 'Erro ao carregar categorias' }));
    } finally {
      loadingRef.current.categories = false;
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, [championshipId, championshipData.seasons]);

  // Função para buscar etapas
  const fetchStages = useCallback(async () => {
    if (!championshipId || loadingRef.current.stages || hasFetchedStages.current) {
      console.log('🔍 ChampionshipContext: fetchStages ignorado', {
        championshipId,
        loadingStages: loadingRef.current.stages,
        hasFetchedStages: hasFetchedStages.current
      });
      return;
    }
    
    console.log('🔍 ChampionshipContext: Iniciando busca de etapas...');
    loadingRef.current.stages = true;
    setLoading(prev => ({ ...prev, stages: true }));
    setError(prev => ({ ...prev, stages: null }));
    
    try {
      const allStages: Stage[] = [];
      
      // Buscar etapas de todas as temporadas
      for (const season of championshipData.seasons) {
        try {
          console.log(`🔍 ChampionshipContext: Buscando etapas da temporada ${season.id}...`);
          const stages = await StageService.getBySeasonId(season.id);
          allStages.push(...stages);
          console.log(`✅ ChampionshipContext: ${stages.length} etapas encontradas para temporada ${season.id}`);
        } catch (err) {
          console.error(`Erro ao buscar etapas da temporada ${season.id}:`, err);
        }
      }
      
      console.log(`✅ ChampionshipContext: Total de ${allStages.length} etapas carregadas`);
      
      setChampionshipData(prev => ({
        ...prev,
        stages: allStages,
        lastUpdated: {
          ...prev.lastUpdated,
          stages: new Date(),
        },
      }));
      hasFetchedStages.current = true;
    } catch (err: any) {
      setError(prev => ({ ...prev, stages: err.message || 'Erro ao carregar etapas' }));
    } finally {
      loadingRef.current.stages = false;
      setLoading(prev => ({ ...prev, stages: false }));
    }
  }, [championshipId, championshipData.seasons]);

  // Função para buscar kartódromos
  const fetchRaceTracks = useCallback(async () => {
    if (!championshipId || loadingRef.current.raceTracks || hasFetchedRaceTracks.current) return;
    
    loadingRef.current.raceTracks = true;
    setLoading(prev => ({ ...prev, raceTracks: true }));
    setError(prev => ({ ...prev, raceTracks: null }));
    
    try {
      // Buscar todos os kartódromos ativos em vez de apenas os associados às etapas
      const allRaceTracks = await RaceTrackService.getActive();
      const raceTracksData: Record<string, any> = {};
      
      // Converter array para objeto com ID como chave
      allRaceTracks.forEach(raceTrack => {
        raceTracksData[raceTrack.id] = raceTrack;
      });
      
      setChampionshipData(prev => ({
        ...prev,
        raceTracks: raceTracksData,
        lastUpdated: {
          ...prev.lastUpdated,
          raceTracks: new Date(),
        },
      }));
      hasFetchedRaceTracks.current = true;
    } catch (err: any) {
      setError(prev => ({ ...prev, raceTracks: err.message || 'Erro ao carregar kartódromos' }));
    } finally {
      loadingRef.current.raceTracks = false;
      setLoading(prev => ({ ...prev, raceTracks: false }));
    }
  }, [championshipId]);

  // Função para buscar staff
  const fetchStaff = useCallback(async () => {
    if (!championshipId || loadingRef.current.staff || hasFetchedStaff.current) return;
    
    loadingRef.current.staff = true;
    setLoading(prev => ({ ...prev, staff: true }));
    setError(prev => ({ ...prev, staff: null }));
    
    try {
      const staffData = await ChampionshipStaffService.getStaffMembers(championshipId);
      setChampionshipData(prev => ({
        ...prev,
        staff: staffData,
        lastUpdated: {
          ...prev.lastUpdated,
          staff: new Date(),
        },
      }));
      hasFetchedStaff.current = true;
    } catch (err: any) {
      setError(prev => ({ ...prev, staff: err.message || 'Erro ao carregar staff' }));
    } finally {
      loadingRef.current.staff = false;
      setLoading(prev => ({ ...prev, staff: false }));
    }
  }, [championshipId]);

  // Função para buscar inscrições
  const fetchRegistrations = useCallback(async () => {
    if (!championshipId || loadingRef.current.registrations || hasFetchedRegistrations.current) return;
    
    loadingRef.current.registrations = true;
    setLoading(prev => ({ ...prev, registrations: true }));
    setError(prev => ({ ...prev, registrations: null }));
    
    try {
      const registrationsData = await SeasonRegistrationService.getByChampionshipId(championshipId);
      
      setChampionshipData(prev => ({
        ...prev,
        registrations: registrationsData,
        lastUpdated: {
          ...prev.lastUpdated,
          registrations: new Date(),
        },
      }));
      hasFetchedRegistrations.current = true;
    } catch (err: any) {
      setError(prev => ({ ...prev, registrations: err.message || 'Erro ao carregar inscrições' }));
    } finally {
      loadingRef.current.registrations = false;
      setLoading(prev => ({ ...prev, registrations: false }));
    }
  }, [championshipId]);

  // Função para buscar penalidades
  const fetchPenalties = useCallback(async () => {
    if (!championshipId || loadingRef.current.penalties || hasFetchedPenalties.current) return;
    
    loadingRef.current.penalties = true;
    setLoading(prev => ({ ...prev, penalties: true }));
    setError(prev => ({ ...prev, penalties: null }));
    
    try {
      const penaltiesData = await PenaltyService.getPenaltiesByChampionshipId(championshipId);
      setChampionshipData(prev => ({
        ...prev,
        penalties: penaltiesData,
        lastUpdated: {
          ...prev.lastUpdated,
          penalties: new Date(),
        },
      }));
      hasFetchedPenalties.current = true;
    } catch (err: any) {
      setError(prev => ({ ...prev, penalties: err.message || 'Erro ao carregar penalidades' }));
    } finally {
      loadingRef.current.penalties = false;
      setLoading(prev => ({ ...prev, penalties: false }));
    }
  }, [championshipId]);

  // Função para buscar classificações
  const fetchClassification = useCallback(async (seasonId: string) => {
    if (!championshipId || loadingRef.current.classifications) return;
    
    loadingRef.current.classifications = true;
    setLoading(prev => ({ ...prev, classifications: true }));
    setError(prev => ({ ...prev, classifications: null }));
    
    try {
      const classificationData = await ChampionshipClassificationService.getSeasonClassificationFromRedis(seasonId);
      setChampionshipData(prev => ({
        ...prev,
        classifications: {
          ...prev.classifications,
          [seasonId]: classificationData,
        },
        lastUpdated: {
          ...prev.lastUpdated,
          classifications: new Date(),
        },
      }));
    } catch (err: any) {
      setError(prev => ({ ...prev, classifications: err.message || 'Erro ao carregar classificação' }));
    } finally {
      loadingRef.current.classifications = false;
      setLoading(prev => ({ ...prev, classifications: false }));
    }
  }, [championshipId]);

  // Função para buscar regulamentos
  const fetchRegulations = useCallback(async (seasonId: string) => {
    if (!championshipId || loadingRef.current.regulations) return;

    loadingRef.current.regulations = true;
    setLoading(prev => ({ ...prev, regulations: true }));
    setError(prev => ({ ...prev, regulations: null }));

    try {
      const regulationsData = await RegulationService.getBySeasonId(seasonId);
      setChampionshipData(prev => ({
        ...prev,
        regulations: {
          ...prev.regulations,
          [seasonId]: regulationsData,
        },
        lastUpdated: {
          ...prev.lastUpdated,
          regulations: new Date(),
        },
      }));
    } catch (err: any) {
      setError(prev => ({ ...prev, regulations: err.message || 'Erro ao carregar regulamentos' }));
    } finally {
      loadingRef.current.regulations = false;
      setLoading(prev => ({ ...prev, regulations: false }));
    }
  }, [championshipId]);

  // Função para buscar dados do campeonato
  const fetchChampionshipInfo = useCallback(async () => {
    if (!championshipId) return;
    // Só busca se ainda não carregou
    if (championshipData.championshipInfo && championshipData.championshipInfo.id === championshipId) return;
    setLoading(prev => ({ ...prev, championshipInfo: true }));
    setError(prev => ({ ...prev, championshipInfo: null }));
    try {
      const info = await ChampionshipService.getById(championshipId);
      setChampionshipData(prev => ({
        ...prev,
        championshipInfo: info,
        lastUpdated: {
          ...prev.lastUpdated,
          championshipInfo: new Date(),
        },
      }));
    } catch (err: any) {
      setError(prev => ({ ...prev, championshipInfo: err.message || 'Erro ao carregar campeonato' }));
    } finally {
      setLoading(prev => ({ ...prev, championshipInfo: false }));
    }
  }, [championshipId, championshipData.championshipInfo]);

  const getChampionshipInfo = useCallback(() => {
    return championshipData.championshipInfo;
  }, [championshipData.championshipInfo]);

  // Funções de refresh (força atualização)
  const refreshSeasons = useCallback(async () => {
    await fetchSeasons();
  }, [fetchSeasons]);

  const refreshCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  const refreshStages = useCallback(async () => {
    await fetchStages();
  }, [fetchStages]);

  const refreshRaceTracks = useCallback(async () => {
    await fetchRaceTracks();
  }, [fetchRaceTracks]);

  const refreshStaff = useCallback(async () => {
    await fetchStaff();
  }, [fetchStaff]);

  const refreshRegistrations = useCallback(async () => {
    await fetchRegistrations();
  }, [fetchRegistrations]);

  const refreshPenalties = useCallback(async () => {
    await fetchPenalties();
  }, [fetchPenalties]);

  const refreshClassification = useCallback(async (seasonId: string) => {
    await fetchClassification(seasonId);
  }, [fetchClassification]);

  const refreshRegulations = useCallback(async (seasonId: string) => {
    await fetchRegulations(seasonId);
  }, [fetchRegulations]);

  // Funções de cache (retornam dados em cache)
  const getSeasons = useCallback(() => {
    return championshipData.seasons;
  }, [championshipData.seasons]);

  const getCategories = useCallback(() => {
    return championshipData.categories;
  }, [championshipData.categories]);

  const getStages = useCallback(() => {
    return championshipData.stages;
  }, [championshipData.stages]);

  const getRaceTracks = useCallback(() => {
    return championshipData.raceTracks;
  }, [championshipData.raceTracks]);

  const getStaff = useCallback(() => {
    return championshipData.staff;
  }, [championshipData.staff]);

  const getRegistrations = useCallback(() => {
    return championshipData.registrations;
  }, [championshipData.registrations]);

  const getPenalties = useCallback(() => {
    return championshipData.penalties;
  }, [championshipData.penalties]);

  const getClassification = useCallback((seasonId: string) => {
    return championshipData.classifications[seasonId] || null;
  }, [championshipData.classifications]);

  const getRegulations = useCallback((seasonId: string) => {
    return championshipData.regulations[seasonId] || [];
  }, [championshipData.regulations]);

  // Funções de atualização específicas para temporadas
  const addSeason = useCallback((season: Season) => {
    setChampionshipData(prev => ({
      ...prev,
      seasons: [...prev.seasons, season],
      lastUpdated: {
        ...prev.lastUpdated,
        seasons: new Date(),
      },
    }));
  }, []);

  const updateSeason = useCallback((seasonId: string, updatedSeason: Partial<Season>) => {
    setChampionshipData(prev => ({
      ...prev,
      seasons: prev.seasons.map(season => 
        season.id === seasonId ? { ...season, ...updatedSeason } : season
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        seasons: new Date(),
      },
    }));
  }, []);

  const removeSeason = useCallback((seasonId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      seasons: prev.seasons.filter(season => season.id !== seasonId),
      lastUpdated: {
        ...prev.lastUpdated,
        seasons: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para categorias
  const addCategory = useCallback((category: Category) => {
    setChampionshipData(prev => ({
      ...prev,
      categories: [...prev.categories, category],
      lastUpdated: {
        ...prev.lastUpdated,
        categories: new Date(),
      },
    }));
  }, []);

  const updateCategory = useCallback((categoryId: string, updatedCategory: Partial<Category>) => {
    setChampionshipData(prev => ({
      ...prev,
      categories: prev.categories.map(category => 
        category.id === categoryId ? { ...category, ...updatedCategory } : category
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        categories: new Date(),
      },
    }));
  }, []);

  const removeCategory = useCallback((categoryId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== categoryId),
      lastUpdated: {
        ...prev.lastUpdated,
        categories: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para etapas
  const addStage = useCallback((stage: Stage) => {
    setChampionshipData(prev => ({
      ...prev,
      stages: [...prev.stages, stage],
      lastUpdated: {
        ...prev.lastUpdated,
        stages: new Date(),
      },
    }));
  }, []);

  const updateStage = useCallback((stageId: string, updatedStage: Partial<Stage>) => {
    setChampionshipData(prev => ({
      ...prev,
      stages: prev.stages.map(stage => 
        stage.id === stageId ? { ...stage, ...updatedStage } : stage
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        stages: new Date(),
      },
    }));
  }, []);

  const removeStage = useCallback((stageId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      stages: prev.stages.filter(stage => stage.id !== stageId),
      lastUpdated: {
        ...prev.lastUpdated,
        stages: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para staff
  const addStaff = useCallback((staff: StaffMember) => {
    setChampionshipData(prev => ({
      ...prev,
      staff: [...prev.staff, staff],
      lastUpdated: {
        ...prev.lastUpdated,
        staff: new Date(),
      },
    }));
  }, []);

  const updateStaff = useCallback((staffId: string, updatedStaff: Partial<StaffMember>) => {
    setChampionshipData(prev => ({
      ...prev,
      staff: prev.staff.map(staff => 
        staff.id === staffId ? { ...staff, ...updatedStaff } : staff
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        staff: new Date(),
      },
    }));
  }, []);

  const removeStaff = useCallback((staffId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      staff: prev.staff.filter(staff => staff.id !== staffId),
      lastUpdated: {
        ...prev.lastUpdated,
        staff: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para inscrições
  const addRegistration = useCallback((registration: SeasonRegistration) => {
    setChampionshipData(prev => ({
      ...prev,
      registrations: [...prev.registrations, registration],
      lastUpdated: {
        ...prev.lastUpdated,
        registrations: new Date(),
      },
    }));
  }, []);

  const updateRegistration = useCallback((registrationId: string, updatedRegistration: Partial<SeasonRegistration>) => {
    setChampionshipData(prev => ({
      ...prev,
      registrations: prev.registrations.map(registration => 
        registration.id === registrationId ? { ...registration, ...updatedRegistration } : registration
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        registrations: new Date(),
      },
    }));
  }, []);

  const removeRegistration = useCallback((registrationId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      registrations: prev.registrations.filter(registration => registration.id !== registrationId),
      lastUpdated: {
        ...prev.lastUpdated,
        registrations: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para penalidades
  const addPenalty = useCallback((penalty: Penalty) => {
    setChampionshipData(prev => ({
      ...prev,
      penalties: [...prev.penalties, penalty],
      lastUpdated: {
        ...prev.lastUpdated,
        penalties: new Date(),
      },
    }));
  }, []);

  const updatePenalty = useCallback((penaltyId: string, updatedPenalty: Partial<Penalty>) => {
    setChampionshipData(prev => ({
      ...prev,
      penalties: prev.penalties.map(penalty => 
        penalty.id === penaltyId ? { ...penalty, ...updatedPenalty } : penalty
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        penalties: new Date(),
      },
    }));
  }, []);

  const removePenalty = useCallback((penaltyId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      penalties: prev.penalties.filter(penalty => penalty.id !== penaltyId),
      lastUpdated: {
        ...prev.lastUpdated,
        penalties: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para classificações
  const updateClassification = useCallback((seasonId: string, classification: RedisClassificationData) => {
    setChampionshipData(prev => ({
      ...prev,
      classifications: {
        ...prev.classifications,
        [seasonId]: classification,
      },
      lastUpdated: {
        ...prev.lastUpdated,
        classifications: new Date(),
      },
    }));
  }, []);

  const removeClassification = useCallback((seasonId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      classifications: Object.keys(prev.classifications).reduce((acc, key) => {
        if (key !== seasonId) {
          acc[key] = prev.classifications[key];
        }
        return acc;
      }, {} as Record<string, RedisClassificationData>),
      lastUpdated: {
        ...prev.lastUpdated,
        classifications: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para regulamentos
  const addRegulation = useCallback((seasonId: string, regulation: Regulation) => {
    setChampionshipData(prev => ({
      ...prev,
      regulations: {
        ...prev.regulations,
        [seasonId]: [...(prev.regulations[seasonId] || []), regulation],
      },
      lastUpdated: {
        ...prev.lastUpdated,
        regulations: new Date(),
      },
    }));
  }, []);

  const updateRegulation = useCallback((seasonId: string, regulationId: string, updatedRegulation: Partial<Regulation>) => {
    setChampionshipData(prev => ({
      ...prev,
      regulations: {
        ...prev.regulations,
        [seasonId]: prev.regulations[seasonId]?.map(reg =>
          reg.id === regulationId ? { ...reg, ...updatedRegulation } : reg
        ) || [],
      },
      lastUpdated: {
        ...prev.lastUpdated,
        regulations: new Date(),
      },
    }));
  }, []);

  const removeRegulation = useCallback((seasonId: string, regulationId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      regulations: {
        ...prev.regulations,
        [seasonId]: prev.regulations[seasonId]?.filter(reg => reg.id !== regulationId) || [],
      },
      lastUpdated: {
        ...prev.lastUpdated,
        regulations: new Date(),
      },
    }));
  }, []);

  const updateRegulationsOrder = useCallback((seasonId: string, regulations: Regulation[]) => {
    setChampionshipData(prev => ({
      ...prev,
      regulations: {
        ...prev.regulations,
        [seasonId]: regulations,
      },
      lastUpdated: {
        ...prev.lastUpdated,
        regulations: new Date(),
      },
    }));
  }, []);

  // Função para limpar cache
  const clearCache = useCallback(() => {
    setChampionshipData({
      championshipInfo: null,
      seasons: [],
      categories: [],
      stages: [],
      raceTracks: {},
      staff: [],
      registrations: [],
      penalties: [],
      classifications: {},
      regulations: {},
      lastUpdated: {
        championshipInfo: null,
        seasons: null,
        categories: null,
        stages: null,
        raceTracks: null,
        staff: null,
        registrations: null,
        penalties: null,
        classifications: null,
        regulations: null,
      },
    });
    setError({
      championshipInfo: null,
      seasons: null,
      categories: null,
      stages: null,
      raceTracks: null,
      staff: null,
      registrations: null,
      penalties: null,
      classifications: null,
      regulations: null,
    });
    
    // Resetar os refs de controle
    hasFetchedSeasons.current = false;
    hasFetchedCategories.current = false;
    hasFetchedStages.current = false;
    hasFetchedRaceTracks.current = false;
    hasFetchedStaff.current = false;
    hasFetchedRegistrations.current = false;
    hasFetchedPenalties.current = false;
  }, []);

  // Carregar dados quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      fetchSeasons();
    } else {
      clearCache();
    }
  }, [championshipId]);

  // Carregar categorias e etapas quando as temporadas mudarem
  useEffect(() => {
    if (championshipData.seasons.length > 0) {
      // Só buscar categorias e etapas se ainda não foram carregadas
      const shouldFetchCategories = championshipData.categories.length === 0;
      const shouldFetchStages = championshipData.stages.length === 0;

      console.log('🔍 ChampionshipContext: Verificando busca de dados...', {
        seasonsCount: championshipData.seasons.length,
        categoriesCount: championshipData.categories.length,
        stagesCount: championshipData.stages.length,
        shouldFetchCategories,
        shouldFetchStages
      });

      if (shouldFetchCategories) {
        console.log('🔍 ChampionshipContext: Buscando categorias...');
        fetchCategories();
      }
      if (shouldFetchStages) {
        console.log('🔍 ChampionshipContext: Buscando etapas...');
        fetchStages();
      }
    }
  }, [championshipData.seasons.length]);

  // Carregar kartódromos quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchRaceTracks = Object.keys(championshipData.raceTracks).length === 0;
      if (shouldFetchRaceTracks) {
        fetchRaceTracks();
      }
    }
  }, [championshipId, championshipData.raceTracks]);

  // Carregar staff quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchStaff = championshipData.staff.length === 0;
      if (shouldFetchStaff) {
        fetchStaff();
      }
    }
  }, [championshipId, championshipData.staff]);

  // Carregar inscrições quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchRegistrations = championshipData.registrations.length === 0;
      if (shouldFetchRegistrations) {
        fetchRegistrations();
      }
    }
  }, [championshipId, fetchRegistrations]);

  // Carregar penalidades quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchPenalties = championshipData.penalties.length === 0;
      if (shouldFetchPenalties) {
        fetchPenalties();
      }
    }
  }, [championshipId, fetchPenalties]);

  // Carregar classificações quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      championshipData.seasons.forEach(season => {
        const shouldFetchClassification = !getClassification(season.id);
        if (shouldFetchClassification) {
          refreshClassification(season.id);
        }
      });
    }
  }, [championshipId, championshipData.seasons, refreshClassification, getClassification]);

  // Carregar regulamentos quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      championshipData.seasons.forEach(season => {
        const shouldFetchRegulations = !getRegulations(season.id).length;
        if (shouldFetchRegulations) {
          refreshRegulations(season.id);
        }
      });
    }
  }, [championshipId, championshipData.seasons, refreshRegulations, getRegulations]);

  // Carregar dados do campeonato quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      fetchChampionshipInfo();
    }
  }, [championshipId, fetchChampionshipInfo]);

  const value: ChampionshipContextType = {
    championshipId,
    championshipData,
    loading,
    error,
    fetchSeasons,
    fetchCategories,
    fetchStages,
    fetchRaceTracks,
    fetchStaff,
    fetchRegistrations,
    fetchPenalties,
    fetchClassification,
    fetchRegulations,
    fetchChampionshipInfo,
    getChampionshipInfo,
    refreshSeasons,
    refreshCategories,
    refreshStages,
    refreshRaceTracks,
    refreshStaff,
    refreshRegistrations,
    refreshPenalties,
    refreshClassification,
    refreshRegulations,
    getSeasons,
    getCategories,
    getStages,
    getRaceTracks,
    getStaff,
    getRegistrations,
    getPenalties,
    getClassification,
    getRegulations,
    addSeason,
    updateSeason,
    removeSeason,
    addCategory,
    updateCategory,
    removeCategory,
    addStage,
    updateStage,
    removeStage,
    addStaff,
    updateStaff,
    removeStaff,
    addRegistration,
    updateRegistration,
    removeRegistration,
    addPenalty,
    updatePenalty,
    removePenalty,
    updateClassification,
    removeClassification,
    addRegulation,
    updateRegulation,
    removeRegulation,
    updateRegulationsOrder,
    clearCache,
    setChampionshipId,
  };

  return (
    <ChampionshipContext.Provider value={value}>
      {children}
    </ChampionshipContext.Provider>
  );
};

export const useChampionshipData = () => {
  const context = useContext(ChampionshipContext);
  if (context === undefined) {
    throw new Error('useChampionshipData must be used within a ChampionshipProvider');
  }
  return context;
}; 