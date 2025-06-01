import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { RouteLoader } from './components/RouteLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { ScrollRestoration } from './components/ScrollRestoration';
import { useRouteMetadata } from './hooks/useRouteMetadata';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Lazy load pages for better performance
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('@/pages/Register').then(module => ({ default: module.Register })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const ResetPasswordSuccess = lazy(() => import('@/pages/ResetPasswordSuccess').then(module => ({ default: module.ResetPasswordSuccess })));
const ChangePassword = lazy(() => import('@/pages/ChangePassword').then(module => ({ default: module.ChangePassword })));
const CompleteProfile = lazy(() => import('@/pages/CompleteProfile'));
const CreateChampionship = lazy(() => import('@/pages/CreateChampionship'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const GoogleCallback = lazy(() => import('@/pages/GoogleCallback'));
const LoginSuccess = lazy(() => import('@/pages/LoginSuccess'));
const ConfirmEmailInfo = lazy(() => import('@/pages/ConfirmEmailInfo').then(module => ({ default: module.ConfirmEmailInfo })));
const ConfirmEmail = lazy(() => import('@/pages/ConfirmEmail').then(module => ({ default: module.ConfirmEmail })));

// Route metadata interface
export interface RouteMetadata {
  title?: string;
  description?: string;
  requiresAuth?: boolean;
  requiresGuest?: boolean;
  layout?: 'main' | 'auth' | 'none';
  roles?: string[];
}

// Root layout component that handles global router concerns
const RootLayout = () => {
  useRouteMetadata(); // This will now work because we're inside the router context
  
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};

// Wrapper component for lazy loaded routes
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<RouteLoader />}>
    {children}
  </Suspense>
);

// Google Callback Error Handler
const GoogleCallbackErrorHandler = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");

  if (error === "access_denied") {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{
          error: "Você não permitiu o acesso à sua conta do Google. Por favor, tente novamente.",
        }}
      />
    );
  }

  if (error) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{
          error: `Falha na autenticação com Google: ${error}. Por favor, tente novamente.`,
        }}
      />
    );
  }

  return (
    <LazyWrapper>
      <GoogleCallback />
    </LazyWrapper>
  );
};

// Login Error Redirect Handler
const LoginErrorRedirect = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");

  const errorMessage = error
    ? `Falha na autenticação: ${error}. Por favor, tente novamente.`
    : "Falha na autenticação. Por favor, tente novamente.";

  return <Navigate to="/auth/login" replace state={{ error: errorMessage }} />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      // Root redirect
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      
      // Authentication routes
      {
        path: "auth",
        element: (
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        ),
        children: [
          {
            path: "login",
            element: (
              <LazyWrapper>
                <Login />
              </LazyWrapper>
            ),
          },
          {
            path: "register",
            element: (
              <LazyWrapper>
                <Register />
              </LazyWrapper>
            ),
          },
          {
            path: "reset-password",
            element: (
              <LazyWrapper>
                <ResetPassword />
              </LazyWrapper>
            ),
          },
          {
            path: "reset-password/success",
            element: (
              <LazyWrapper>
                <ResetPasswordSuccess />
              </LazyWrapper>
            ),
          },
          {
            path: "google/callback",
            element: <GoogleCallbackErrorHandler />,
          },
          {
            path: "login-success",
            element: (
              <LazyWrapper>
                <LoginSuccess />
              </LazyWrapper>
            ),
          },
          {
            path: "login-error",
            element: <LoginErrorRedirect />,
          },
          {
            path: "confirm-email-info",
            element: (
              <LazyWrapper>
                <ConfirmEmailInfo />
              </LazyWrapper>
            ),
          },
          {
            path: "confirm-email",
            element: (
              <LazyWrapper>
                <ConfirmEmail />
              </LazyWrapper>
            ),
          },
        ],
      },

      // Protected application routes (without /app prefix)
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <Dashboard />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "create-championship",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <CreateChampionship />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "change-password",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <ChangePassword />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },

      // Special protected routes without main layout
      {
        path: "complete-profile",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <CompleteProfile />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },

      // Legacy route redirects for backward compatibility
      {
        path: "login",
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "register",
        element: <Navigate to="/auth/register" replace />,
      },
      {
        path: "login-success",
        element: <Navigate to="/auth/login-success" replace />,
      },
      {
        path: "login-error",
        element: <Navigate to="/auth/login-error" replace />,
      },
      {
        path: "app/dashboard",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "app/championships/create",
        element: <Navigate to="/create-championship" replace />,
      },
      {
        path: "app/settings/change-password",
        element: <Navigate to="/change-password" replace />,
      },
      {
        path: "onboarding/complete-profile",
        element: <Navigate to="/complete-profile" replace />,
      },

      // Catch all - 404
      {
        path: "*",
        element: (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Página não encontrada</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Voltar
            </button>
          </div>
        ),
      },
    ],
  },
]);

export default router; 