import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const LoginError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>("Authentication failed");

  useEffect(() => {
    // Get error parameter from URL if available
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (message) {
      setErrorMessage(message);
    } else if (error === "access_denied") {
      setErrorMessage("You declined access to your Google account");
    } else if (error) {
      setErrorMessage(`Authentication error: ${error}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-md text-center max-w-md w-full">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-bold text-red-500 mb-2">Login Failed</h1>
        <p className="mb-6 text-muted-foreground">{errorMessage}</p>

        <Button
          onClick={() => navigate("/login")}
          className="w-full"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}; 