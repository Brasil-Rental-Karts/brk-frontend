import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { ReactNode } from 'react';
import { FullPageLoader } from './RouteLoader';

interface PublicRouteProps {
  children?: ReactNode;
  redirectPath?: string;
  fallback?: ReactNode;
}

export const PublicRoute = ({
  children,
  redirectPath = '/dashboard',
  fallback
}: PublicRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || <FullPageLoader message="Verificando autenticação..." />;
  }

  // Redirect authenticated users to the app
  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render children or outlet for non-authenticated users
  return children ? <>{children}</> : <Outlet />;
}; 