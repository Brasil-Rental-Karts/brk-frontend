import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService, LoginRequest, RegisterRequest } from '@/lib/services';
import api from '@/lib/axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACCESS_TOKEN_KEY = '@brk:accessToken';
const LOCAL_STORAGE_REFRESH_TOKEN_KEY = '@brk:refreshToken';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Parse user from JWT token
  const getUserFromToken = (token: string): User => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return {};
    }
  };

  // Set up an interceptor to refresh the token when needed
  useEffect(() => {
    const setupTokenRefresh = () => {
      api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          
          // If error is 401 and not a retry, try refreshing token
          if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
            originalRequest._retry = true;
            
            try {
              // Call refresh token API
              const refreshResponse = await AuthService.refreshToken(refreshToken);
              
              // Update tokens
              setAccessToken(refreshResponse.accessToken);
              setRefreshToken(refreshResponse.refreshToken);
              
              // Update local storage
              localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY, refreshResponse.accessToken);
              localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, refreshResponse.refreshToken);
              
              // Update user from new token
              setUser(getUserFromToken(refreshResponse.accessToken));
              
              // Update headers for the original request
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`;
              
              // Retry original request
              return api(originalRequest);
            } catch (refreshError) {
              // If refresh fails, logout
              logout();
              return Promise.reject(refreshError);
            }
          }
          
          return Promise.reject(error);
        }
      );
    };
    
    setupTokenRefresh();
  }, [refreshToken]);

  useEffect(() => {
    const loadStoredAuth = async () => {
      const storedAccessToken = localStorage.getItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY);
      
      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(getUserFromToken(storedAccessToken));
      }
      
      setIsLoading(false);
    };
    
    loadStoredAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(data);
      
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      
      // Extract user info from access token
      const userInfo = getUserFromToken(response.accessToken);
      setUser(userInfo);
      
      localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, response.refreshToken);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      await AuthService.register(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 