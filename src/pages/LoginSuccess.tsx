import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    const handleLoginSuccess = async () => {
      // Prevent infinite loop by checking if we've already processed the login
      if (processedRef.current) return;
      processedRef.current = true;

      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      if (accessToken && refreshToken) {
        // Use the new method to set tokens and user in context
        loginWithTokens(accessToken, refreshToken);
        
        // Navigate to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // If tokens are missing, redirect to login page
        navigate("/login", { replace: true });
      }
    };

    handleLoginSuccess();
  }, []);  // Empty dependency array to run only once

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-md text-center">
        <h1 className="text-xl font-bold mb-2">Login Successful</h1>
        <p className="mb-4">Redirecting to your dashboard...</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}; 