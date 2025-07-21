import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, Link } from 'react-router-dom';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { RouteLoader } from './components/RouteLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { ScrollRestoration } from './components/ScrollRestoration';
import { useRouteMetadata } from './hooks/useRouteMetadata';
import { MainLayout } from '@/layouts/MainLayout';
import { MainFullWidthLayout } from '@/layouts/MainFullWidhtLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Lazy load pages for better performance
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('@/pages/Register').then(module => ({ default: module.Register })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const ResetPasswordSuccess = lazy(() => import('@/pages/ResetPasswordSuccess').then(module => ({ default: module.ResetPasswordSuccess })));
const ChangePassword = lazy(() => import('@/pages/ChangePassword'));
const CreateChampionship = lazy(() => import('@/pages/CreateChampionship'));
const CreateSeason = lazy(() => import('@/pages/CreateSeason'));
const CreateCategory = lazy(() => import('@/pages/CreateCategory'));
const CreateGridType = lazy(() => import('@/pages/CreateGridType').then(module => ({ default: module.CreateGridType })));
const CreateScoringSystem = lazy(() => import('@/pages/CreateScoringSystem').then(module => ({ default: module.CreateScoringSystem })));
const CreateStage = lazy(() => import('@/pages/CreateStage').then(module => ({ default: module.CreateStage })));
const CreateRaceTrack = lazy(() => import('@/pages/CreateRaceTrack'));
const CreatePenalty = lazy(() => import('@/pages/CreatePenalty'));
const SeasonRegistration = lazy(() => import('@/pages/SeasonRegistration').then(module => ({ default: module.SeasonRegistration })));
const RegistrationPayment = lazy(() => import('@/pages/RegistrationPayment').then(module => ({ default: module.RegistrationPayment })));
const PaymentDetails = lazy(() => import('@/pages/PaymentDetails').then(module => ({ default: module.PaymentDetails })));
const Championship = lazy(() => import('@/pages/Championship').then(module => ({ default: module.Championship })));
const EditProfile = lazy(() => import('@/pages/EditProfile'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Financial = lazy(() => import('@/pages/Financial').then(module => ({ default: module.Financial })));
const Admin = lazy(() => import('@/pages/Admin').then(module => ({ default: module.Admin })));
const CreditCardFeesAdmin = lazy(() => import('@/pages/CreditCardFeesAdmin'));
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

// Wrapper component for lazy loading with suspense
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<RouteLoader />}>
    {children}
  </Suspense>
);

// Google callback error handler
const GoogleCallbackErrorHandler = () => (
  <LazyWrapper>
    <GoogleCallback />
  </LazyWrapper>
);

// Login error redirect handler
const LoginErrorRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  // Redirect to login with error state
  return (
    <Navigate 
      to="/auth/login" 
      state={{ 
        error: error || 'Erro de autenticação',
        errorDescription: errorDescription || 'Ocorreu um erro durante o login'
      }} 
      replace 
    />
  );
};

// Confirm email redirect handler that preserves query parameters
const ConfirmEmailRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const queryString = urlParams.toString();
  const redirectUrl = queryString 
    ? `/auth/confirm-email?${queryString}`
    : '/auth/confirm-email';
  
  return <Navigate to={redirectUrl} replace />;
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
        path: "championship/:id",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <Championship />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/create-season",
        element: <Navigate to="../season/new" replace />,
      },
      {
        path: "championship/:championshipId/season/:seasonId",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateSeason />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/create-category",
        element: <Navigate to="../category/new" replace />,
      },
      {
        path: "championship/:championshipId/category/:categoryId",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateCategory />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/season/:seasonId/create-category",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateCategory />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/stage/new",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateStage />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/create-stage",
        element: <Navigate to="../stage/new" replace />,
      },
      {
        path: "championship/:championshipId/season/:seasonId/create-stage",
        element: <Navigate to="../../stage/new" replace />,
      },
      {
        path: "championship/:championshipId/stage/:stageId/edit",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateStage />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/grid-type/new",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateGridType />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/grid-type/:gridTypeId/edit",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateGridType />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/scoring-system/create",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateScoringSystem />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/scoring-system/:scoringSystemId/edit",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreateScoringSystem />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/penalties/new",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreatePenalty />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/penalties/edit/:penaltyId",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <CreatePenalty />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipSlug/season/:seasonSlug/register",
        element: (
          <ProtectedRoute>
            <MainFullWidthLayout>
              <LazyWrapper>
                <SeasonRegistration />
              </LazyWrapper>
            </MainFullWidthLayout>
          </ProtectedRoute>
        ),
      },
      // Nova rota simplificada para inscrições
      {
        path: "registration/:seasonSlug",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <SeasonRegistration />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      // Rota para inscrição com condição específica
      {
        path: "registration/:seasonSlug/:conditionType",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <SeasonRegistration />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      // Rota legacy para compatibilidade
      {
        path: "season/:seasonId/register",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <SeasonRegistration />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "registration/:registrationId/payment",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <RegistrationPayment />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "payment-details/:registrationId",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <PaymentDetails />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "create-championship",
        element: (
          <ProtectedRoute requiredRoles={['Manager', 'Administrator']}>
            <MainLayout>
              <LazyWrapper>
                <CreateChampionship />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "championship/:championshipId/edit",
        element: (
          <ProtectedRoute requiredRoles={['Manager', 'Administrator']}>
            <MainLayout>
              <LazyWrapper>
                <CreateChampionship />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute requiredRoles={['Administrator']}>
            <MainLayout>
              <LazyWrapper>
                <Admin />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/race-tracks/create",
        element: (
          <ProtectedRoute requiredRoles={['Administrator']}>
            <MainLayout>
              <LazyWrapper>
                <CreateRaceTrack />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/race-tracks/edit/:id",
        element: (
          <ProtectedRoute requiredRoles={['Administrator']}>
            <MainLayout>
              <LazyWrapper>
                <CreateRaceTrack />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/credit-card-fees",
        element: (
          <ProtectedRoute requiredRoles={['Administrator']}>
            <MainLayout>
              <LazyWrapper>
                <CreditCardFeesAdmin />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/edit",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <EditProfile />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "financial",
        element: (
          <ProtectedRoute>
            <MainLayout>
              <LazyWrapper>
                <Financial />
              </LazyWrapper>
            </MainLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "change-password",
        element: (
          <LazyWrapper>
            <ChangePassword />
          </LazyWrapper>
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
        path: "confirm-email",
        element: <ConfirmEmailRedirect />,
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

      // Catch all - 404
      {
        path: "*",
        element: (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Página não encontrada</p>
            <div className="flex gap-4 mt-4">
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Página Inicial
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Voltar
              </button>
            </div>
          </div>
        ),
      },
    ],
  },
]);

export default router; 