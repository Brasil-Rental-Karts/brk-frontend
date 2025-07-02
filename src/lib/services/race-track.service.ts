import api from '../axios';

export interface TrackLayout {
  name: string;
  length: number;
  description?: string;
}

export interface DefaultFleet {
  name: string;
  kartQuantity: number;
}

export interface RaceTrack {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  trackLayouts: TrackLayout[];
  defaultFleets: DefaultFleet[];
  generalInfo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRaceTrackRequest {
  name: string;
  city: string;
  state: string;
  address: string;
  trackLayouts: TrackLayout[];
  defaultFleets: DefaultFleet[];
  generalInfo?: string;
  isActive?: boolean;
}

export interface UpdateRaceTrackRequest extends CreateRaceTrackRequest {}

export interface RaceTrackResponse {
  success: boolean;
  message: string;
  data: RaceTrack;
}

export interface RaceTracksResponse {
  success: boolean;
  message: string;
  data: RaceTrack[];
}

export const RaceTrackService = {
  // Buscar todos os kartódromos
  getAll: async (): Promise<RaceTrack[]> => {
    const response = await api.get<RaceTracksResponse>('/race-tracks');
    return response.data.data;
  },

  // Buscar apenas kartódromos ativos
  getActive: async (): Promise<RaceTrack[]> => {
    const response = await api.get<RaceTracksResponse>('/race-tracks/active');
    return response.data.data;
  },

  // Buscar kartódromo por ID
  getById: async (id: string): Promise<RaceTrack> => {
    const response = await api.get<RaceTrackResponse>(`/race-tracks/${id}`);
    return response.data.data;
  },

  // Buscar kartódromo por nome
  getByName: async (name: string): Promise<RaceTrack | null> => {
    try {
      const response = await api.get<RaceTrackResponse>(`/race-tracks/name/${name}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Buscar kartódromos por cidade
  getByCity: async (city: string): Promise<RaceTrack[]> => {
    const response = await api.get<RaceTracksResponse>(`/race-tracks/city/${city}`);
    return response.data.data;
  },

  // Buscar kartódromos por estado
  getByState: async (state: string): Promise<RaceTrack[]> => {
    const response = await api.get<RaceTracksResponse>(`/race-tracks/state/${state}`);
    return response.data.data;
  },

  // Criar novo kartódromo
  create: async (data: CreateRaceTrackRequest): Promise<RaceTrack> => {
    const response = await api.post<RaceTrackResponse>('/race-tracks', data);
    return response.data.data;
  },

  // Atualizar kartódromo
  update: async (id: string, data: UpdateRaceTrackRequest): Promise<RaceTrack> => {
    const response = await api.put<RaceTrackResponse>(`/race-tracks/${id}`, data);
    return response.data.data;
  },

  // Excluir kartódromo
  delete: async (id: string): Promise<void> => {
    await api.delete(`/race-tracks/${id}`);
  },

  // Ativar/desativar kartódromo
  toggleActive: async (id: string): Promise<RaceTrack> => {
    const response = await api.patch<RaceTrackResponse>(`/race-tracks/${id}/toggle-active`);
    return response.data.data;
  }
}; 