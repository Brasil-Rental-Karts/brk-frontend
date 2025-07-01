import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";

export const GoogleCallback = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processedRef = useRef(false);

  useEffect(() => {
    // Function to handle the Google callback
    const processCallback = async () => {
      // Prevent this from running multiple times
      if (processedRef.current) return;
      processedRef.current = true;

      // Check for error in the URL
      const errorParam = searchParams.get("error");
      if (errorParam) {
        if (errorParam === "access_denied") {
          // For access_denied errors, redirect directly to login page with an error message
          navigate("/login", { 
            replace: true,
            state: { 
              error: "Você não permitiu o acesso à sua conta do Google. Por favor, tente novamente."
            }
          });
        } else {
          // For other errors, also redirect to login page with a generic error
          navigate("/login", { 
            replace: true,
            state: { 
              error: `Falha na autenticação com Google: ${errorParam}. Por favor, tente novamente.`
            }
          });
        }
        return;
      }

      // Get the authorization code
      const code = searchParams.get("code");
      if (!code) {
        navigate("/login", { 
          replace: true,
          state: { 
            error: "Código de autorização não recebido do Google. Por favor, tente novamente."
          }
        });
        return;
      }

      try {
        // TODO: Implement handleGoogleCallback in AuthContext or handle Google callback here.
        throw new Error('handleGoogleCallback is not implemented.');
      } catch (err) {
        console.error("Error during Google authentication:", err);
        navigate("/login", { 
          replace: true,
          state: { 
            error: "Falha durante o processo de autenticação. Por favor, tente novamente."
          }
        });
      }
    };

    // Only process the callback if not already authenticated
    if (!isAuthenticated) {
      processCallback();
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, []); // Empty dependency array to run only once

  // Display loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-md text-center">
        <h1 className="text-xl font-bold mb-2">Autenticando...</h1>
        <p className="mb-4">Aguarde enquanto completamos seu login com Google.</p>
        <Loading type="spinner" size="sm" />
      </div>
    </div>
  );
};

export default GoogleCallback; 