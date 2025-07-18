import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loading } from "@/components/ui/loading";

export const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processedRef = useRef(false);

  useEffect(() => {
    const handleLoginSuccess = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      // No need to call login() here! AuthContext will pick up the user from /auth/me on mount

      // Navigate based on firstLogin status
      navigate("/dashboard", { replace: true });
    };

    handleLoginSuccess();
  }, []);  // Empty dependency array to run only once

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-md text-center">
        <h1 className="text-xl font-bold mb-2">Login Successful</h1>
        <p className="mb-4">Redirecting you to the appropriate page...</p>
        <Loading type="spinner" size="sm" />
      </div>
    </div>
  );
};

export default LoginSuccess; 