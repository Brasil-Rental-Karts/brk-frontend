import { Loader2 } from 'lucide-react';

interface RouteLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RouteLoader = ({ 
  message = 'Carregando...', 
  size = 'md' 
}: RouteLoaderProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = {
    sm: 'min-h-[200px]',
    md: 'min-h-[400px]',
    lg: 'min-h-screen'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// Skeleton loader for page content
export const PageSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ))}
    </div>
  </div>
);

// Full page loader with branding
export const FullPageLoader = ({ message }: { message?: string }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/20"></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">BRK</h3>
        {message && (
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        )}
      </div>
    </div>
  </div>
); 