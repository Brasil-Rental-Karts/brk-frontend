# BRK Frontend Router

This directory contains the complete routing implementation for the BRK frontend application, built with React Router v7 and following modern best practices.

## 🏗️ Architecture

The router is organized into several key components:

### Core Files
- `router.tsx` - Main router configuration with all routes
- `index.ts` - Exports all router-related utilities

### Components
- `RouteErrorBoundary.tsx` - Error boundary for route-level errors
- `RouteLoader.tsx` - Loading components for lazy-loaded routes
- `ProtectedRoute.tsx` - Authentication guard for protected routes
- `PublicRoute.tsx` - Guard that redirects authenticated users
- `ScrollRestoration.tsx` - Handles scroll position on navigation

### Hooks
- `useRouteMetadata.ts` - Manages page titles and meta tags
- `useNavigation.ts` - Provides navigation helpers

### Utils
- `navigation.ts` - Route constants and navigation utilities

## 🚀 Features

### 1. **Lazy Loading**
All pages are lazy-loaded for optimal performance:
```tsx
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
```

### 2. **Route Protection**
- **ProtectedRoute**: Requires authentication
- **PublicRoute**: Redirects authenticated users
- **Role-based access**: Support for role-based route protection

### 3. **Nested Routing**
Clean URL structure with nested routes:
```
/auth/login
/auth/register
/app/dashboard
/app/championships/create
/app/settings/change-password
```

### 4. **Error Handling**
- Route-level error boundaries
- Custom 404 pages
- Graceful error recovery

### 5. **SEO & Metadata**
- Dynamic page titles
- Meta descriptions
- Keywords management

### 6. **Navigation Utilities**
Type-safe navigation with helper functions:
```tsx
const nav = useNavigation();
nav.goToDashboard();
nav.goToLogin({ error: 'Session expired' });
```

## 📱 Route Structure

### Authentication Routes (`/auth/*`)
- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/reset-password` - Password reset
- `/auth/google/callback` - Google OAuth callback
- `/auth/confirm-email` - Email confirmation

### Application Routes (`/app/*`)
Protected routes that require authentication:
- `/app/dashboard` - Main dashboard
- `/app/championships/create` - Create championship
- `/app/settings/change-password` - Change password

### Onboarding Routes (`/onboarding/*`)
Special protected routes for user onboarding:
- `/onboarding/complete-profile` - Complete user profile

### Legacy Redirects
Maintains backward compatibility with old URLs:
- `/login` → `/auth/login`
- `/dashboard` → `/app/dashboard`
- etc.

## 🛠️ Usage Examples

### Basic Navigation
```tsx
import { useNavigation, ROUTES } from '@/router';

function MyComponent() {
  const nav = useNavigation();
  
  const handleLogin = () => {
    nav.goToLogin();
  };
  
  const handleDashboard = () => {
    nav.goTo(ROUTES.APP.DASHBOARD);
  };
}
```

### Route Metadata
```tsx
import { useRouteMetadata } from '@/router';

function MyPage() {
  const metadata = useRouteMetadata();
  // Automatically sets page title and meta tags
}
```

### Custom Loading States
```tsx
import { RouteLoader, PageSkeleton } from '@/router';

// Use different loading components
<Suspense fallback={<RouteLoader size="lg" message="Loading dashboard..." />}>
  <Dashboard />
</Suspense>
```

### Error Boundaries
```tsx
import { RouteErrorBoundary } from '@/router';

// Automatically handles route errors with user-friendly messages
```

## 🔧 Configuration

### Adding New Routes

1. **Add the route constant**:
```tsx
// In utils/navigation.ts
export const ROUTES = {
  APP: {
    NEW_FEATURE: '/app/new-feature'
  }
}
```

2. **Create the lazy import**:
```tsx
// In router.tsx
const NewFeature = lazy(() => import('@/pages/NewFeature').then(module => ({ default: module.NewFeature })));
```

3. **Add to router configuration**:
```tsx
{
  path: "new-feature",
  element: (
    <LazyWrapper>
      <NewFeature />
    </LazyWrapper>
  ),
}
```

4. **Add metadata**:
```tsx
// In hooks/useRouteMetadata.ts
'/app/new-feature': {
  title: 'New Feature - BRK',
  description: 'Description of the new feature',
  keywords: 'new, feature, BRK'
}
```

### Route Protection

```tsx
// Require authentication
<ProtectedRoute>
  <MyComponent />
</ProtectedRoute>

// Require specific roles
<ProtectedRoute requiredRoles={['admin', 'moderator']}>
  <AdminPanel />
</ProtectedRoute>

// Custom redirect path
<ProtectedRoute redirectPath="/custom-login">
  <MyComponent />
</ProtectedRoute>
```

## 🎯 Best Practices

1. **Always use route constants** instead of hardcoded strings
2. **Lazy load all pages** for better performance
3. **Use proper error boundaries** for graceful error handling
4. **Set meaningful page titles** and meta descriptions
5. **Implement proper loading states** for better UX
6. **Use type-safe navigation** with the provided helpers

## 🔄 Migration from Old Router

The new router maintains backward compatibility through redirect routes. Old URLs will automatically redirect to new ones:

- `/login` → `/auth/login`
- `/dashboard` → `/app/dashboard`
- `/create-championship` → `/app/championships/create`

## 🚦 Performance

- **Code splitting**: Each page is loaded only when needed
- **Lazy loading**: Reduces initial bundle size
- **Error boundaries**: Prevent entire app crashes
- **Optimized re-renders**: Minimal re-renders on route changes

## 🔍 Debugging

Use the browser's React DevTools to inspect:
- Route state
- Loading states
- Error boundaries
- Component hierarchy

The router provides detailed error messages and fallbacks for easier debugging. 