import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { FullPageLoader } from './RouteLoader';

interface ProtectedRouteProps {
  children?: ReactNode;
  redirectPath?: string;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export const ProtectedRoute = ({
  children,
  redirectPath = '/auth/login',
  requiredRoles = [],
  fallback
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || <FullPageLoader message="Verificando autenticação..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectPath}
        replace
        state={{ 
          from: location.pathname,
          message: 'Você precisa estar logado para acessar esta página.'
        }}
      />
    );
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0 && user?.role) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <Navigate
          to="/dashboard"
          replace
          state={{
            error: 'Você não tem permissão para acessar esta página.'
          }}
        />
      );
    }
  }

  // Note: Profile completion check removed as it's not part of the current User interface
  // This can be added later when the backend supports profile completion status

  // Render children or outlet
  return children ? <>{children}</> : <Outlet />;
}; 