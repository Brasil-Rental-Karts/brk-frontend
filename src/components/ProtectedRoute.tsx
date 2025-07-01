import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";
import { Loading } from "@/components/ui/loading";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: ReactNode;
}

export const ProtectedRoute = ({
  redirectPath = "/",
  children
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // While checking authentication status, we can show a loading spinner
  if (isLoading) {
    return (
      <Loading 
        type="spinner" 
        size="lg" 
        message="Verificando autenticação..."
      />
    );
  }

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated, render the children or outlet
  return children ? <>{children}</> : <Outlet />;
}; 