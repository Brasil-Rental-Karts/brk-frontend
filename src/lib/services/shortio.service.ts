import api from '../axios';

export interface ShortioResponse {
  shortURL: string;
  originalURL: string;
  title?: string;
  tags?: string[];
}

export interface ShortenUrlRequest {
  url: string;
  title?: string;
  tags?: string[];
}

export interface ShortenMultipleUrlsRequest {
  urls: Array<{
    url: string;
    title?: string;
    tags?: string[];
  }>;
}

export const ShortioService = {
  /**
   * Encurta uma única URL
   */
  shortenUrl: async (data: ShortenUrlRequest): Promise<ShortioResponse> => {
    const response = await api.post<ShortioResponse>('/shortio/shorten', data);
    return response.data;
  },

  /**
   * Encurta uma única URL com verificação de duplicatas
   */
  shortenUrlWithDuplicateCheck: async (data: ShortenUrlRequest): Promise<ShortioResponse> => {
    const response = await api.post<ShortioResponse>('/shortio/shorten', {
      ...data,
      checkDuplicates: true
    });
    return response.data;
  },

  /**
   * Busca um link existente por URL original
   */
  findExistingLink: async (url: string): Promise<ShortioResponse | null> => {
    try {
      const response = await api.get<ShortioResponse>(`/shortio/find?url=${encodeURIComponent(url)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Encurta múltiplas URLs
   */
  shortenMultipleUrls: async (data: ShortenMultipleUrlsRequest): Promise<ShortioResponse[]> => {
    const response = await api.post<ShortioResponse[]>('/shortio/shorten-multiple', data);
    return response.data;
  },

  /**
   * Testa a conectividade com o short.io
   */
  testConnection: async (): Promise<{ connected: boolean; message: string }> => {
    const response = await api.get<{ connected: boolean; message: string }>('/shortio/test');
    return response.data;
  },
}; 