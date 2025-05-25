import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService, LoginRequest, RegisterRequest } from '@/lib/services';

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (data: LoginRequest) => Promise<{ firstLogin: boolean }>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // On mount, check if user is authenticated via /auth/me
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const userInfo = await AuthService.me();
        setUser(userInfo);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(data);
      setIsFirstLogin(!!response.firstLogin);
      // After login, fetch user info
      const userInfo = await AuthService.me();
      setUser(userInfo);
      return { firstLogin: !!response.firstLogin };
    } catch (error) {
      throw error;
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

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsFirstLogin(false);
  };

  const loginWithGoogle = async () => {
    try {
      const { url } = await AuthService.getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isFirstLogin,
    login,
    register,
    logout,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 