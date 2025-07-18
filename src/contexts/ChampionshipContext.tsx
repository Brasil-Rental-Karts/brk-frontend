import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Championship, Sponsor, AsaasStatus } from '@/lib/services/championship.service';
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
import { StageParticipationService, StageParticipation } from '@/lib/services/stage-participation.service';
import { GridTypeService } from '@/lib/services/grid-type.service';
import { GridType } from '@/lib/types/grid-type';
import { ScoringSystemService, ScoringSystem } from '@/lib/services/scoring-system.service';

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
  stageParticipations: Record<string, StageParticipation[]>;
  classifications: Record<string, RedisClassificationData>;
  regulations: Record<string, Regulation[]>;
  gridTypes: GridType[];
  scoringSystems: ScoringSystem[];
  asaasStatus: AsaasStatus | null;
  lastUpdated: {
    championshipInfo: Date | null;
    seasons: Date | null;
    categories: Date | null;
    stages: Date | null;
    raceTracks: Date | null;
    staff: Date | null;
    registrations: Date | null;
    penalties: Date | null;
    stageParticipations: Date | null;
    classifications: Date | null;
    regulations: Date | null;
    gridTypes: Date | null;
    scoringSystems: Date | null;
    asaasStatus: Date | null;
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
    stageParticipations: boolean;
    classifications: boolean;
    regulations: boolean;
    gridTypes: boolean;
    scoringSystems: boolean;
    asaasStatus: boolean;
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
    stageParticipations: string | null;
    classifications: string | null;
    regulations: string | null;
    gridTypes: string | null;
    scoringSystems: string | null;
    asaasStatus: string | null;
  };
  
  // Funções de busca
  fetchSeasons: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchStages: () => Promise<void>;
  fetchRaceTracks: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchRegistrations: () => Promise<void>;
  fetchPenalties: () => Promise<void>;
  fetchStageParticipations: (stageId?: string) => Promise<void>;
  fetchClassification: (seasonId: string) => Promise<void>;
  fetchRegulations: (seasonId: string) => Promise<void>;
  fetchGridTypes: () => Promise<void>;
  fetchScoringSystems: () => Promise<void>;
  fetchChampionshipInfo: () => Promise<void>;
  fetchAsaasStatus: () => Promise<void>;
  
  // Funções de atualização
  refreshSeasons: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshStages: () => Promise<void>;
  refreshRaceTracks: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  refreshRegistrations: () => Promise<void>;
  refreshPenalties: () => Promise<void>;
  refreshStageParticipations: (stageId?: string) => Promise<void>;
  refreshClassification: (seasonId: string) => Promise<void>;
  refreshRegulations: (seasonId: string) => Promise<void>;
  refreshGridTypes: () => Promise<void>;
  refreshScoringSystems: () => Promise<void>;
  refreshAsaasStatus: () => Promise<void>;
  
  // Funções de cache
  getSeasons: () => Season[];
  getCategories: () => Category[];
  getStages: () => Stage[];
  getRaceTracks: () => Record<string, any>;
  getStaff: () => StaffMember[];
  getRegistrations: () => SeasonRegistration[];
  getPenalties: () => Penalty[];
  getStageParticipations: (stageId: string) => StageParticipation[];
  getClassification: (seasonId: string) => RedisClassificationData | null;
  getRegulations: (seasonId: string) => Regulation[];
  getGridTypes: () => GridType[];
  getScoringSystems: () => ScoringSystem[];
  getChampionshipInfo: () => Championship | null;
  getAsaasStatus: () => AsaasStatus | null;
  
  // Funções de atualização específicas para campeonato
  updateChampionship: (championshipId: string, updatedChampionship: Championship) => void;
  updateAsaasStatus: (asaasStatus: AsaasStatus) => void;
  
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
  
  // Funções de atualização específicas para patrocinadores
  addSponsor: (sponsor: Sponsor) => void;
  updateSponsor: (sponsorId: string, updatedSponsor: Partial<Sponsor>) => void;
  removeSponsor: (sponsorId: string) => void;
  updateSponsors: (sponsors: Sponsor[]) => void;
  
  // Funções de atualização específicas para grid types
  addGridType: (gridType: GridType) => void;
  updateGridType: (gridTypeId: string, updatedGridType: Partial<GridType>) => void;
  removeGridType: (gridTypeId: string) => void;
  updateAllGridTypes: (gridTypes: GridType[]) => void;
  
  // Funções de atualização específicas para scoring systems
  addScoringSystem: (scoringSystem: ScoringSystem) => void;
  updateScoringSystem: (scoringSystemId: string, updatedScoringSystem: Partial<ScoringSystem>) => void;
  removeScoringSystem: (scoringSystemId: string) => void;
  
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
    stageParticipations: {},
    classifications: {},
    regulations: {},
    gridTypes: [],
    scoringSystems: [],
    asaasStatus: null,
    lastUpdated: {
      championshipInfo: null,
      seasons: null,
      categories: null,
      stages: null,
      raceTracks: null,
      staff: null,
      registrations: null,
      penalties: null,
      stageParticipations: null,
      classifications: null,
      regulations: null,
      gridTypes: null,
      scoringSystems: null,
      asaasStatus: null,
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
    stageParticipations: false,
    classifications: false,
    regulations: false,
    gridTypes: false,
    scoringSystems: false,
    asaasStatus: false,
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
    stageParticipations: null,
    classifications: null,
    regulations: null,
    gridTypes: null,
    scoringSystems: null,
    asaasStatus: null,
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
    stageParticipations: false,
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

  // Ref para guardar temporadas já buscadas para classificação
  const fetchedClassificationSeasons = useRef(new Set<string>());

  // Função para buscar temporadas
  const fetchSeasons = useCallback(async () => {
    if (!championshipId || loadingRef.current.seasons) return;
    

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
      console.error('❌ ChampionshipContext: Erro ao carregar temporadas:', err);
      setError(prev => ({ ...prev, seasons: err.message || 'Erro ao carregar temporadas' }));
    } finally {
      loadingRef.current.seasons = false;
      setLoading(prev => ({ ...prev, seasons: false }));
    }
  }, [championshipId]);

  // Função para buscar categorias
  const fetchCategories = useCallback(async () => {
    if (!championshipId || loadingRef.current.categories) return;
    

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
      console.error('❌ ChampionshipContext: Erro ao carregar categorias:', err);
      setError(prev => ({ ...prev, categories: err.message || 'Erro ao carregar categorias' }));
    } finally {
      loadingRef.current.categories = false;
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, [championshipId, championshipData.seasons]);

  // Função para buscar etapas
  const fetchStages = useCallback(async () => {
    if (!championshipId || loadingRef.current.stages) {
      
      return;
    }
    

    loadingRef.current.stages = true;
    setLoading(prev => ({ ...prev, stages: true }));
    setError(prev => ({ ...prev, stages: null }));
    
    try {
      const allStages: Stage[] = [];
      
      // Buscar etapas de todas as temporadas
      for (const season of championshipData.seasons) {
        try {
  
          const stages = await StageService.getBySeasonId(season.id);
          allStages.push(...stages);
          
        } catch (err) {
          console.error(`Erro ao buscar etapas da temporada ${season.id}:`, err);
        }
      }
      

      
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
      console.error('❌ ChampionshipContext: Erro ao carregar etapas:', err);
      setError(prev => ({ ...prev, stages: err.message || 'Erro ao carregar etapas' }));
    } finally {
      loadingRef.current.stages = false;
      setLoading(prev => ({ ...prev, stages: false }));
    }
  }, [championshipId, championshipData.seasons]);

  // Função para buscar kartódromos
  const fetchRaceTracks = useCallback(async () => {
    if (!championshipId || loadingRef.current.raceTracks) return;
    

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
      console.error('❌ ChampionshipContext: Erro ao carregar kartódromos:', err);
      setError(prev => ({ ...prev, raceTracks: err.message || 'Erro ao carregar kartódromos' }));
    } finally {
      loadingRef.current.raceTracks = false;
      setLoading(prev => ({ ...prev, raceTracks: false }));
    }
  }, [championshipId]);

  // Função para buscar staff
  const fetchStaff = useCallback(async () => {
    if (!championshipId || loadingRef.current.staff) return;
    

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
      console.error('❌ ChampionshipContext: Erro ao carregar staff:', err);
      setError(prev => ({ ...prev, staff: err.message || 'Erro ao carregar staff' }));
    } finally {
      loadingRef.current.staff = false;
      setLoading(prev => ({ ...prev, staff: false }));
    }
  }, [championshipId]);

  // Função para buscar inscrições
  const fetchRegistrations = useCallback(async () => {
    if (!championshipId || loadingRef.current.registrations) return;
    

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
      console.error('❌ ChampionshipContext: Erro ao carregar inscrições:', err);
      setError(prev => ({ ...prev, registrations: err.message || 'Erro ao carregar inscrições' }));
    } finally {
      loadingRef.current.registrations = false;
      setLoading(prev => ({ ...prev, registrations: false }));
    }
  }, [championshipId]);

  // Função para buscar penalidades
  const fetchPenalties = useCallback(async () => {
    if (!championshipId || loadingRef.current.penalties) return;
    

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
      console.error('❌ ChampionshipContext: Erro ao carregar penalidades:', err);
      setError(prev => ({ ...prev, penalties: err.message || 'Erro ao carregar penalidades' }));
    } finally {
      loadingRef.current.penalties = false;
      setLoading(prev => ({ ...prev, penalties: false }));
    }
  }, [championshipId]);

  // Função para buscar participações de etapas
  const fetchStageParticipations = useCallback(async (stageId?: string) => {
    if (!championshipId || loadingRef.current.stageParticipations) return;
    
    loadingRef.current.stageParticipations = true;
    setLoading(prev => ({ ...prev, stageParticipations: true }));
    setError(prev => ({ ...prev, stageParticipations: null }));
    
    try {
      let allParticipations: Record<string, StageParticipation[]> = {};
      
      if (stageId) {
        // Buscar participações de uma etapa específica
        const participationsData = await StageParticipationService.getStageParticipations(stageId);
        allParticipations[stageId] = participationsData;
      } else {
        // Buscar participações de todas as etapas
        for (const stage of championshipData.stages) {
          try {
            const participationsData = await StageParticipationService.getStageParticipations(stage.id);
            allParticipations[stage.id] = participationsData;
          } catch (err) {
            console.error(`Erro ao buscar participações da etapa ${stage.id}:`, err);
          }
        }
      }
      
      setChampionshipData(prev => ({
        ...prev,
        stageParticipations: {
          ...prev.stageParticipations,
          ...allParticipations,
        },
        lastUpdated: {
          ...prev.lastUpdated,
          stageParticipations: new Date(),
        },
      }));
    } catch (err: any) {
      setError(prev => ({ ...prev, stageParticipations: err.message || 'Erro ao carregar participações das etapas' }));
    } finally {
      loadingRef.current.stageParticipations = false;
      setLoading(prev => ({ ...prev, stageParticipations: false }));
    }
  }, [championshipId, championshipData.stages]);

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
          [seasonId]: classificationData || { _empty: true },
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

  // Função para buscar tipos de grid
  const fetchGridTypes = useCallback(async () => {
    if (!championshipId) return;
    
    setLoading(prev => ({ ...prev, gridTypes: true }));
    setError(prev => ({ ...prev, gridTypes: null }));
    
    try {
      const gridTypesData = await GridTypeService.getByChampionship(championshipId);
      setChampionshipData(prev => ({
        ...prev,
        gridTypes: gridTypesData,
        lastUpdated: {
          ...prev.lastUpdated,
          gridTypes: new Date(),
        },
      }));
    } catch (err: any) {
      setError(prev => ({ ...prev, gridTypes: err.message || 'Erro ao carregar tipos de grid' }));
    } finally {
      setLoading(prev => ({ ...prev, gridTypes: false }));
    }
  }, [championshipId]);

  // Função para buscar sistemas de pontuação
  const fetchScoringSystems = useCallback(async () => {
    if (!championshipId) return;
    
    setLoading(prev => ({ ...prev, scoringSystems: true }));
    setError(prev => ({ ...prev, scoringSystems: null }));
    
    try {
      const scoringSystemsData = await ScoringSystemService.getByChampionshipId(championshipId);
      setChampionshipData(prev => ({
        ...prev,
        scoringSystems: scoringSystemsData,
        lastUpdated: {
          ...prev.lastUpdated,
          scoringSystems: new Date(),
        },
      }));
    } catch (err: any) {
      setError(prev => ({ ...prev, scoringSystems: err.message || 'Erro ao carregar sistemas de pontuação' }));
    } finally {
      setLoading(prev => ({ ...prev, scoringSystems: false }));
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

  // Função para buscar status do Asaas
  const fetchAsaasStatus = useCallback(async () => {
    if (!championshipId) return;
    setLoading(prev => ({ ...prev, asaasStatus: true }));
    setError(prev => ({ ...prev, asaasStatus: null }));
    try {
      const status = await ChampionshipService.getAsaasStatus(championshipId);
      setChampionshipData(prev => ({
        ...prev,
        asaasStatus: status,
        lastUpdated: {
          ...prev.lastUpdated,
          asaasStatus: new Date(),
        },
      }));
    } catch (err: any) {
      setError(prev => ({ ...prev, asaasStatus: err.message || 'Erro ao carregar status do Asaas' }));
    } finally {
      setLoading(prev => ({ ...prev, asaasStatus: false }));
    }
  }, [championshipId]);

  const getChampionshipInfo = useCallback(() => {
    return championshipData.championshipInfo;
  }, [championshipData.championshipInfo]);

  const getAsaasStatus = useCallback(() => {
    return championshipData.asaasStatus;
  }, [championshipData.asaasStatus]);

  // Função para atualizar dados do campeonato
  const updateChampionship = useCallback((championshipId: string, updatedChampionship: Championship) => {
    setChampionshipData(prev => ({
      ...prev,
      championshipInfo: updatedChampionship,
      lastUpdated: {
        ...prev.lastUpdated,
        championshipInfo: new Date(),
      },
    }));
  }, []);

  // Função para atualizar status do Asaas
  const updateAsaasStatus = useCallback((asaasStatus: AsaasStatus) => {
    setChampionshipData(prev => ({
      ...prev,
      asaasStatus: asaasStatus,
      lastUpdated: {
        ...prev.lastUpdated,
        asaasStatus: new Date(),
      },
    }));
  }, []);

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

  const refreshStageParticipations = useCallback(async (stageId?: string) => {
    await fetchStageParticipations(stageId);
  }, [fetchStageParticipations]);

  const refreshClassification = useCallback(async (seasonId: string) => {
    await fetchClassification(seasonId);
  }, [fetchClassification]);

  const refreshRegulations = useCallback(async (seasonId: string) => {
    await fetchRegulations(seasonId);
  }, [fetchRegulations]);

  const refreshGridTypes = useCallback(async () => {
    await fetchGridTypes();
  }, [fetchGridTypes]);

  const refreshScoringSystems = useCallback(async () => {
    await fetchScoringSystems();
  }, [fetchScoringSystems]);

  const refreshAsaasStatus = useCallback(async () => {
    await fetchAsaasStatus();
  }, [fetchAsaasStatus]);

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

  const getStageParticipations = useCallback((stageId: string) => {
    return championshipData.stageParticipations[stageId] || [];
  }, [championshipData.stageParticipations]);

  const getClassification = useCallback((seasonId: string) => {
    return championshipData.classifications[seasonId] || null;
  }, [championshipData.classifications]);

  const getRegulations = useCallback((seasonId: string) => {
    return championshipData.regulations[seasonId] || [];
  }, [championshipData.regulations]);

  const getGridTypes = useCallback(() => {
    return championshipData.gridTypes;
  }, [championshipData.gridTypes]);

  const getScoringSystems = useCallback(() => {
    return championshipData.scoringSystems;
  }, [championshipData.scoringSystems]);

  // Funções de atualização específicas para temporadas
  const addSeason = useCallback((season: Season) => {

    setChampionshipData(prev => {
      const newData = {
        ...prev,
        seasons: [...prev.seasons, season],
        lastUpdated: {
          ...prev.lastUpdated,
          seasons: new Date(),
        },
      };
      
      return newData;
    });
  }, []);

  const updateSeason = useCallback((seasonId: string, updatedSeason: Partial<Season>) => {

    setChampionshipData(prev => {
      const newData = {
        ...prev,
        seasons: prev.seasons.map(season => 
          season.id === seasonId ? { ...season, ...updatedSeason } : season
        ),
        lastUpdated: {
          ...prev.lastUpdated,
          seasons: new Date(),
        },
      };
      
      return newData;
    });
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
    setChampionshipData(prev => {
      const newData = {
        ...prev,
        categories: [...prev.categories, category],
        lastUpdated: {
          ...prev.lastUpdated,
          categories: new Date(),
        },
      };
      return newData;
    });
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

  // Funções de atualização específicas para patrocinadores
  const addSponsor = useCallback((sponsor: Sponsor) => {
    setChampionshipData(prev => ({
      ...prev,
      championshipInfo: prev.championshipInfo ? {
        ...prev.championshipInfo,
        sponsors: [...(prev.championshipInfo.sponsors || []), sponsor],
      } : null,
      lastUpdated: {
        ...prev.lastUpdated,
        championshipInfo: new Date(),
      },
    }));
  }, []);

  const updateSponsor = useCallback((sponsorId: string, updatedSponsor: Partial<Sponsor>) => {
    setChampionshipData(prev => ({
      ...prev,
      championshipInfo: prev.championshipInfo ? {
        ...prev.championshipInfo,
        sponsors: prev.championshipInfo.sponsors?.map(sp =>
          sp.id === sponsorId ? { ...sp, ...updatedSponsor } : sp
        ) || [],
      } : null,
      lastUpdated: {
        ...prev.lastUpdated,
        championshipInfo: new Date(),
      },
    }));
  }, []);

  const removeSponsor = useCallback((sponsorId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      championshipInfo: prev.championshipInfo ? {
        ...prev.championshipInfo,
        sponsors: prev.championshipInfo.sponsors?.filter(sp => sp.id !== sponsorId) || [],
      } : null,
      lastUpdated: {
        ...prev.lastUpdated,
        championshipInfo: new Date(),
      },
    }));
  }, []);

  const updateSponsors = useCallback((sponsors: Sponsor[]) => {
    setChampionshipData(prev => ({
      ...prev,
      championshipInfo: prev.championshipInfo ? {
        ...prev.championshipInfo,
        sponsors: sponsors,
      } : null,
      lastUpdated: {
        ...prev.lastUpdated,
        championshipInfo: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para grid types
  const addGridType = useCallback((gridType: GridType) => {
    setChampionshipData(prev => ({
      ...prev,
      gridTypes: [...prev.gridTypes, gridType],
      lastUpdated: {
        ...prev.lastUpdated,
        gridTypes: new Date(),
      },
    }));
  }, []);

  const updateGridType = useCallback((gridTypeId: string, updatedGridType: Partial<GridType>) => {
    setChampionshipData(prev => ({
      ...prev,
      gridTypes: prev.gridTypes.map(gridType => 
        gridType.id === gridTypeId ? { ...gridType, ...updatedGridType } : gridType
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        gridTypes: new Date(),
      },
    }));
  }, []);

  const removeGridType = useCallback((gridTypeId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      gridTypes: prev.gridTypes.filter(gridType => gridType.id !== gridTypeId),
      lastUpdated: {
        ...prev.lastUpdated,
        gridTypes: new Date(),
      },
    }));
  }, []);

  const updateAllGridTypes = useCallback((gridTypes: GridType[]) => {
    setChampionshipData(prev => ({
      ...prev,
      gridTypes: gridTypes,
      lastUpdated: {
        ...prev.lastUpdated,
        gridTypes: new Date(),
      },
    }));
  }, []);

  // Funções de atualização específicas para scoring systems
  const addScoringSystem = useCallback((scoringSystem: ScoringSystem) => {
    setChampionshipData(prev => ({
      ...prev,
      scoringSystems: [...prev.scoringSystems, scoringSystem],
      lastUpdated: {
        ...prev.lastUpdated,
        scoringSystems: new Date(),
      },
    }));
  }, []);

  const updateScoringSystem = useCallback((scoringSystemId: string, updatedScoringSystem: Partial<ScoringSystem>) => {
    setChampionshipData(prev => ({
      ...prev,
      scoringSystems: prev.scoringSystems.map(system => 
        system.id === scoringSystemId ? { ...system, ...updatedScoringSystem } : system
      ),
      lastUpdated: {
        ...prev.lastUpdated,
        scoringSystems: new Date(),
      },
    }));
  }, []);

  const removeScoringSystem = useCallback((scoringSystemId: string) => {
    setChampionshipData(prev => ({
      ...prev,
      scoringSystems: prev.scoringSystems.filter(system => system.id !== scoringSystemId),
      lastUpdated: {
        ...prev.lastUpdated,
        scoringSystems: new Date(),
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
      stageParticipations: {},
      classifications: {},
      regulations: {},
      gridTypes: [],
      scoringSystems: [],
      asaasStatus: null,
      lastUpdated: {
        championshipInfo: null,
        seasons: null,
        categories: null,
        stages: null,
        raceTracks: null,
        staff: null,
        registrations: null,
        penalties: null,
        stageParticipations: null,
        classifications: null,
        regulations: null,
        gridTypes: null,
        scoringSystems: null,
        asaasStatus: null,
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
      stageParticipations: null,
      classifications: null,
      regulations: null,
      gridTypes: null,
      scoringSystems: null,
      asaasStatus: null,
    });
    
    // Resetar loading states
    setLoading({
      championshipInfo: false,
      seasons: false,
      categories: false,
      stages: false,
      raceTracks: false,
      staff: false,
      registrations: false,
      penalties: false,
      stageParticipations: false,
      classifications: false,
      regulations: false,
      gridTypes: false,
      scoringSystems: false,
      asaasStatus: false,
    });
    
    // Resetar os refs de controle
    hasFetchedSeasons.current = false;
    hasFetchedCategories.current = false;
    hasFetchedStages.current = false;
    hasFetchedRaceTracks.current = false;
    hasFetchedStaff.current = false;
    hasFetchedRegistrations.current = false;
    hasFetchedPenalties.current = false;
    fetchedClassificationSeasons.current.clear(); // Limpar temporadas já buscadas
    
    
  }, []);

  // Função para definir o championshipId
  const setChampionshipIdHandler = useCallback((id: string | null) => {

    if (id !== championshipId) {
      
      setChampionshipId(id);
    } else {
      
    }
  }, [championshipId]);

  // Carregar dados quando o championshipId mudar
  useEffect(() => {

    
    if (championshipId) {
      // Limpar cache antes de buscar novos dados
      clearCache();
      // Buscar dados do novo campeonato
      fetchSeasons();
    } else {
      clearCache();
    }
  }, [championshipId]); // Remover clearCache e fetchSeasons das dependências para evitar loops

  // Carregar categorias e etapas quando as temporadas mudarem
  useEffect(() => {
    if (championshipData.seasons.length > 0) {
      // Só buscar categorias e etapas se ainda não foram carregadas
      const shouldFetchCategories = championshipData.categories.length === 0;
      const shouldFetchStages = championshipData.stages.length === 0;



      if (shouldFetchCategories) {

        fetchCategories();
      }
      if (shouldFetchStages) {

        fetchStages();
      }
    }
  }, [championshipData.seasons.length]);

  // Carregar kartódromos quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchRaceTracks = Object.keys(championshipData.raceTracks).length === 0 && !hasFetchedRaceTracks.current;
      if (shouldFetchRaceTracks) {
        fetchRaceTracks();
      }
    }
  }, [championshipId, Object.keys(championshipData.raceTracks).length]);

  // Carregar staff quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchStaff = championshipData.staff.length === 0 && !hasFetchedStaff.current;
      if (shouldFetchStaff) {
        fetchStaff();
      }
    }
  }, [championshipId, championshipData.staff.length]);

  // Carregar inscrições quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchRegistrations = championshipData.registrations.length === 0 && !hasFetchedRegistrations.current;
      if (shouldFetchRegistrations) {
        fetchRegistrations();
      }
    }
  }, [championshipId, championshipData.registrations.length]);

  // Carregar penalidades quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchPenalties = championshipData.penalties.length === 0 && !hasFetchedPenalties.current;
      if (shouldFetchPenalties) {
        fetchPenalties();
      }
    }
  }, [championshipId, championshipData.penalties.length]);

  // Carregar classificações quando o championshipId mudar ou seasons mudar
  useEffect(() => {
    if (championshipId && championshipData.seasons.length > 0) {
      championshipData.seasons.forEach(season => {
        if (!championshipData.classifications[season.id] && !fetchedClassificationSeasons.current.has(season.id)) {
          fetchedClassificationSeasons.current.add(season.id);
          fetchClassification(season.id);
        }
      });
    }
  }, [championshipId, championshipData.seasons]);

  // Carregar regulamentos quando o championshipId mudar
  useEffect(() => {
    if (championshipId && championshipData.seasons.length > 0) {
      championshipData.seasons.forEach(season => {
        // Só buscar regulamentos se a temporada ainda existe e não tem dados carregados
        const shouldFetchRegulations = !championshipData.regulations[season.id] || championshipData.regulations[season.id].length === 0;
        if (shouldFetchRegulations) {
          fetchRegulations(season.id);
        }
      });
    }
  }, [championshipId, championshipData.seasons.length]);

  // Carregar participações de etapas quando as etapas mudarem
  useEffect(() => {
    if (championshipId && championshipData.stages.length > 0) {
      // Verificar se já temos participações carregadas para todas as etapas
      const hasAllParticipations = championshipData.stages.every(stage => 
        championshipData.stageParticipations[stage.id] && championshipData.stageParticipations[stage.id].length >= 0
      );
      
      if (!hasAllParticipations) {
        // Carregar todas as participações de uma vez
        fetchStageParticipations();
      }
    }
  }, [championshipId, championshipData.stages.length]);

  // Carregar dados do campeonato quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      fetchChampionshipInfo();
    }
  }, [championshipId]);

  // Carregar grid types e scoring systems quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchGridTypes = championshipData.gridTypes.length === 0;
      const shouldFetchScoringSystems = championshipData.scoringSystems.length === 0;
      
      if (shouldFetchGridTypes) {
        fetchGridTypes();
      }
      if (shouldFetchScoringSystems) {
        fetchScoringSystems();
      }
    }
  }, [championshipId, championshipData.gridTypes.length, championshipData.scoringSystems.length]);

  // Carregar status do Asaas quando o championshipId mudar
  useEffect(() => {
    if (championshipId) {
      const shouldFetchAsaasStatus = championshipData.asaasStatus === null;
      if (shouldFetchAsaasStatus) {
        fetchAsaasStatus();
      }
    }
  }, [championshipId, championshipData.asaasStatus]);

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
    fetchStageParticipations,
    fetchClassification,
    fetchRegulations,
    fetchGridTypes,
    fetchScoringSystems,
    fetchChampionshipInfo,
    fetchAsaasStatus,
    getChampionshipInfo,
    updateChampionship,
    updateAsaasStatus,
    refreshSeasons,
    refreshCategories,
    refreshStages,
    refreshRaceTracks,
    refreshStaff,
    refreshRegistrations,
    refreshPenalties,
    refreshStageParticipations,
    refreshClassification,
    refreshRegulations,
    refreshGridTypes,
    refreshScoringSystems,
    refreshAsaasStatus,
    getSeasons,
    getCategories,
    getStages,
    getRaceTracks,
    getStaff,
    getRegistrations,
    getPenalties,
    getStageParticipations,
    getClassification,
    getRegulations,
    getGridTypes,
    getScoringSystems,
    getAsaasStatus,
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
    addSponsor,
    updateSponsor,
    removeSponsor,
    updateSponsors,
    addGridType,
    updateGridType,
    removeGridType,
    updateAllGridTypes,
    addScoringSystem,
    updateScoringSystem,
    removeScoringSystem,
    clearCache,
    setChampionshipId: setChampionshipIdHandler,
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