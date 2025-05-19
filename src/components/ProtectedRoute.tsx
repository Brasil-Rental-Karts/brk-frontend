import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";

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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated, render the children or outlet
  return children ? <>{children}</> : <Outlet />;
}; 