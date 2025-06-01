// Main router export
export { router, default, type RouteMetadata } from './router.tsx';

// Components
export { RouteErrorBoundary } from './components/RouteErrorBoundary';
export { RouteLoader, PageSkeleton, FullPageLoader } from './components/RouteLoader';
export { ProtectedRoute } from './components/ProtectedRoute';
export { PublicRoute } from './components/PublicRoute';
export { ScrollRestoration, useScrollRestoration } from './components/ScrollRestoration';

// Hooks
export { useRouteMetadata } from './hooks/useRouteMetadata';
export { useNavigation } from './hooks/useNavigation';

// Utils
export {
  ROUTES,
  NavigationHelper,
  isAuthRoute,
  isAppRoute,
  isProtectedRoute,
  isPublicRoute,
  getSearchParams,
  buildUrlWithParams,
  getBreadcrumbs
} from './utils/navigation'; 