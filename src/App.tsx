import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ResetPassword } from "@/pages/ResetPassword";
import { ResetPasswordSuccess } from "@/pages/ResetPasswordSuccess";
import { ChangePassword } from "@/pages/ChangePassword";
import { CompleteProfile } from "./pages/CompleteProfile";
import { GoogleCallback } from "@/pages/GoogleCallback";
import { LoginSuccess } from "@/pages/LoginSuccess";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

// Handle direct callback URLs with errors
const GoogleCallbackErrorHandler = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const error = searchParams.get("error");

  if (error === "access_denied") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          error:
            "Você não permitiu o acesso à sua conta do Google. Por favor, tente novamente.",
        }}
      />
    );
  }

  if (error) {
    // Instead of redirecting to login-error, redirect to login with a generic error message
    return (
      <Navigate
        to="/login"
        replace
        state={{
          error: `Falha na autenticação com Google: ${error}. Por favor, tente novamente.`,
        }}
      />
    );
  }

  // If no error, continue to the regular GoogleCallback component
  return <GoogleCallback />;
};

// Redirect any LoginError page visits to the Login page with appropriate error
const LoginErrorRedirect = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const error = searchParams.get("error");

  const errorMessage = error
    ? `Falha na autenticação: ${error}. Por favor, tente novamente.`
    : "Falha na autenticação. Por favor, tente novamente.";

  return <Navigate to="/login" replace state={{ error: errorMessage }} />;
};

import { Dashboard } from "@/pages/Dashboard";

// ScrollToTop component to reset scroll position on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="brk-ui-theme">
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/reset-password/success"
              element={<ResetPasswordSuccess />}
            />
            <Route
              path="/auth/google/callback"
              element={<GoogleCallbackErrorHandler />}
            />
            <Route path="/login-success" element={<LoginSuccess />} />
            <Route path="/login-error" element={<LoginErrorRedirect />} />

            {/* Protected routes with MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>

            {/* Protected routes without layout */}
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
