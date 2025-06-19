import { NavigateFunction } from 'react-router-dom';

// Route constants for type safety
export const ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    RESET_PASSWORD: '/auth/reset-password',
    RESET_PASSWORD_SUCCESS: '/auth/reset-password/success',
    GOOGLE_CALLBACK: '/auth/google/callback',
    LOGIN_SUCCESS: '/auth/login-success',
    LOGIN_ERROR: '/auth/login-error',
    CONFIRM_EMAIL_INFO: '/auth/confirm-email-info',
    CONFIRM_EMAIL: '/auth/confirm-email',
  },
  
  // App routes (without /app prefix)
  DASHBOARD: '/dashboard',
  CREATE_CHAMPIONSHIP: '/create-championship',
  CHAMPIONSHIP: '/championship',
  EDIT_PROFILE: '/edit-profile',
  CHANGE_PASSWORD: '/change-password',
  
  // Root
  ROOT: '/',
} as const;

// Navigation helpers
export class NavigationHelper {
  private navigate: NavigateFunction;

  constructor(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  // Auth navigation
  goToLogin(state?: any) {
    this.navigate(ROUTES.AUTH.LOGIN, { state });
  }

  goToRegister(state?: any) {
    this.navigate(ROUTES.AUTH.REGISTER, { state });
  }

  goToResetPassword(state?: any) {
    this.navigate(ROUTES.AUTH.RESET_PASSWORD, { state });
  }

  // App navigation
  goToDashboard(state?: any) {
    this.navigate(ROUTES.DASHBOARD, { state });
  }

  goToCreateChampionship(state?: any) {
    this.navigate(ROUTES.CREATE_CHAMPIONSHIP, { state });
  }

  goToChampionship(championshipId: string, state?: any) {
    this.navigate(`${ROUTES.CHAMPIONSHIP}/${championshipId}`, { state });
  }

  goToChangePassword(state?: any) {
    this.navigate(ROUTES.CHANGE_PASSWORD, { state });
  }

  goToEditProfile(state?: any) {
    this.navigate(ROUTES.EDIT_PROFILE, { state });
  }

  // Generic navigation
  goTo(path: string, options?: { replace?: boolean; state?: any }) {
    this.navigate(path, options);
  }

  goBack() {
    this.navigate(-1);
  }

  goForward() {
    this.navigate(1);
  }

  replace(path: string, state?: any) {
    this.navigate(path, { replace: true, state });
  }
}

// Route validation helpers
export const isAuthRoute = (pathname: string): boolean => {
  return pathname.startsWith('/auth');
};

export const isAppRoute = (pathname: string): boolean => {
  return !pathname.startsWith('/auth') && pathname !== '/';
};

export const isProtectedRoute = (pathname: string): boolean => {
  return !isAuthRoute(pathname) && pathname !== '/';
};

export const isPublicRoute = (pathname: string): boolean => {
  return isAuthRoute(pathname) || pathname === '/';
};

// URL parameter helpers
export const getSearchParams = (search: string) => {
  return new URLSearchParams(search);
};

export const buildUrlWithParams = (path: string, params: Record<string, string>) => {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.pathname + url.search;
};

// Breadcrumb helpers
export const getBreadcrumbs = (pathname: string): Array<{ label: string; path: string }> => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [];

  let currentPath = '';
  
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    
    let label = segment;
    
    // Custom labels for specific routes
    switch (currentPath) {
      case '/auth':
        label = 'Autenticação';
        break;
      case '/auth/login':
        label = 'Login';
        break;
      case '/auth/register':
        label = 'Cadastro';
        break;
      case '/dashboard':
        label = 'Dashboard';
        break;
      case '/create-championship':
        label = 'Criar Campeonato';
        break;
      case '/change-password':
        label = 'Alterar Senha';
        break;
      default:
        // Capitalize first letter and replace hyphens with spaces
        label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }
    
    breadcrumbs.push({ label, path: currentPath });
  });

  return breadcrumbs;
}; 