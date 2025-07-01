import api from '../axios';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserService {
  private static readonly BASE_URL = '/users';

  /**
   * Listar todos os usuários
   */
  static async getAll(page: number = 1, limit: number = 100): Promise<PaginatedUsers> {
    try {
      const response = await api.get<User[]>(`${UserService.BASE_URL}`);
      // O backend retorna um array simples, então criamos a estrutura paginada
      return {
        data: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar usuários.'
      );
    }
  }

  /**
   * Buscar usuário por ID
   */
  static async getById(id: string): Promise<User> {
    try {
      const response = await api.get<User>(`${UserService.BASE_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar usuário.'
      );
    }
  }

  /**
   * Buscar usuário por email
   */
  static async getByEmail(email: string): Promise<User> {
    try {
      const response = await api.get<User>(`${UserService.BASE_URL}/email/${email}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user by email:', error);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar usuário por email.'
      );
    }
  }
} 