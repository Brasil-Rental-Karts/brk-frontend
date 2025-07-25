import React, { createContext, useContext, useEffect, useState } from "react";

import { Sentry } from "@/lib/sentry";
import { AuthService, LoginRequest, RegisterRequest } from "@/lib/services";

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
  login: (data: LoginRequest) => Promise<{ firstLogin: boolean }>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if user is authenticated via /auth/me
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const userInfo = await AuthService.me();
        setUser(userInfo);

        // Set user context in Sentry
        if (userInfo) {
          Sentry.setUser({
            id: userInfo.id || "",
            email: userInfo.email,
            username: userInfo.email, // Use email as username since name is not available
          });
        }
      } catch (error) {
        setUser(null);
        Sentry.setUser(null);

        // Capture authentication check errors
        Sentry.captureException(error as Error, {
          tags: { action: "auth_check" },
          extra: { context: "AuthProvider.checkAuth" },
        });
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
      // After login, fetch user info
      const userInfo = await AuthService.me();
      setUser(userInfo);

      // Set user context in Sentry
      if (userInfo) {
        Sentry.setUser({
          id: userInfo.id || "",
          email: userInfo.email,
          username: userInfo.email, // Use email as username since name is not available
        });
      }

      // Add breadcrumb for successful login
      Sentry.addBreadcrumb({
        message: "User logged in successfully",
        category: "auth",
        level: "info",
        data: { email: data.email },
      });

      return { firstLogin: false };
    } catch (error) {
      // Capture login errors
      Sentry.captureException(error as Error, {
        tags: { action: "login" },
        extra: {
          context: "AuthProvider.login",
          email: data.email,
        },
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      await AuthService.register(data);

      // Add breadcrumb for successful registration
      Sentry.addBreadcrumb({
        message: "User registered successfully",
        category: "auth",
        level: "info",
        data: { email: data.email },
      });
    } catch (error) {
      // Capture registration errors
      Sentry.captureException(error as Error, {
        tags: { action: "register" },
        extra: {
          context: "AuthProvider.register",
          email: data.email,
        },
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      Sentry.setUser(null);

      // Add breadcrumb for logout
      Sentry.addBreadcrumb({
        message: "User logged out",
        category: "auth",
        level: "info",
      });
    } catch (error) {
      // Capture logout errors
      Sentry.captureException(error as Error, {
        tags: { action: "logout" },
        extra: { context: "AuthProvider.logout" },
      });
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { url } = await AuthService.getGoogleAuthUrl();

      // Add breadcrumb for Google login attempt
      Sentry.addBreadcrumb({
        message: "User initiated Google login",
        category: "auth",
        level: "info",
      });

      window.location.href = url;
    } catch (error) {
      // Capture Google login errors
      Sentry.captureException(error as Error, {
        tags: { action: "google_login" },
        extra: { context: "AuthProvider.loginWithGoogle" },
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
