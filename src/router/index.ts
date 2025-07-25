// Main router export
export { default, type RouteMetadata, router } from "./router.tsx";

// Components
export { ProtectedRoute } from "./components/ProtectedRoute";
export { PublicRoute } from "./components/PublicRoute";
export { RouteErrorBoundary } from "./components/RouteErrorBoundary";
export { FullPageLoader, RouteLoader } from "./components/RouteLoader";
export {
  ScrollRestoration,
  useScrollRestoration,
} from "./components/ScrollRestoration";

// Hooks
export { useNavigation } from "./hooks/useNavigation";
export { useRouteMetadata } from "./hooks/useRouteMetadata";

// Utils
export {
  buildUrlWithParams,
  getBreadcrumbs,
  getSearchParams,
  isAppRoute,
  isAuthRoute,
  isProtectedRoute,
  isPublicRoute,
  NavigationHelper,
  ROUTES,
} from "./utils/navigation";
