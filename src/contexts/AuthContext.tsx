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
  isFirstLogin: boolean;
  login: (data: LoginRequest) => Promise<{ firstLogin: boolean }>;
  loginWithTokens: (accessToken: string, refreshToken: string, firstLogin?: boolean) => void;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACCESS_TOKEN_KEY = '@brk:accessToken';
const LOCAL_STORAGE_REFRESH_TOKEN_KEY = '@brk:refreshToken';

const AUTH_URLS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh-token', '/auth/google', '/auth/google/url', '/auth/google/callback'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

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
      const interceptor = api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          
          const isAuthRequest = AUTH_URLS.some(url => originalRequest.url?.includes(url));
          
          if (
            error.response?.status === 401 && 
            !originalRequest._retry && 
            !isAuthRequest && 
            refreshToken &&
            !isRefreshing
          ) {
            originalRequest._retry = true;
            
            try {
              setIsRefreshing(true);
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
              
              setIsRefreshing(false);
              // Retry original request
              return api(originalRequest);
            } catch (refreshError) {
              // If refresh fails, logout
              setIsRefreshing(false);
              logout();
              return Promise.reject(refreshError);
            }
          }
          
          return Promise.reject(error);
        }
      );
      
      return () => {
        api.interceptors.response.eject(interceptor);
      };
    };
    
    const cleanupInterceptor = setupTokenRefresh();
    
    return cleanupInterceptor;
  }, [refreshToken, isRefreshing]);

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
      // Clear any existing tokens before attempting login
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY);
      localStorage.removeItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY);
      
      const response = await AuthService.login(data);
      
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      
      // Extract user info from access token
      const userInfo = getUserFromToken(response.accessToken);
      setUser(userInfo);
      
      // Set firstLogin state based on response
      const firstLogin = response.firstLogin || false;
      setIsFirstLogin(firstLogin);
      
      localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, response.refreshToken);
      
      return { firstLogin };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithTokens = (newAccessToken: string, newRefreshToken: string, firstLogin = false) => {
    // Clear any existing tokens
    localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY);
    
    // Set new tokens
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    
    // Extract user info from access token
    const userInfo = getUserFromToken(newAccessToken);
    setUser(userInfo);
    
    // Set firstLogin state
    setIsFirstLogin(firstLogin);
    
    // Save tokens to localStorage
    localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY, newAccessToken);
    localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, newRefreshToken);
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
    setIsFirstLogin(false);
    localStorage.removeItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY);
  };

  const loginWithGoogle = async () => {
    try {
      const { url } = await AuthService.getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
    }
  };

  const handleGoogleCallback = async () => {
    setIsLoading(true);
    try {
      // The backend will handle the OAuth code exchange and redirect back with tokens
      // We don't need to make a direct API call here as the redirect will handle it
      
      // Parse tokens from URL if they're in the query params
      const urlParams = new URLSearchParams(window.location.search);
      const accessTokenFromUrl = urlParams.get('access_token');
      const refreshTokenFromUrl = urlParams.get('refresh_token');
      const firstLoginFromUrl = urlParams.get('first_login') === 'true';
      
      if (accessTokenFromUrl && refreshTokenFromUrl) {
        setAccessToken(accessTokenFromUrl);
        setRefreshToken(refreshTokenFromUrl);
        setIsFirstLogin(firstLoginFromUrl);
        
        // Extract user info from access token
        const userInfo = getUserFromToken(accessTokenFromUrl);
        setUser(userInfo);
        
        localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN_KEY, accessTokenFromUrl);
        localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, refreshTokenFromUrl);
        
        // Clear URL params to avoid token exposure
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        isLoading,
        isFirstLogin,
        login,
        loginWithTokens,
        register,
        logout,
        loginWithGoogle,
        handleGoogleCallback
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