import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos de loading disponíveis
export type LoadingType = 'spinner' | 'full-page';
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Props base para todos os loadings
interface BaseLoadingProps {
  size?: LoadingSize;
  className?: string;
}

// Props específicas para cada tipo
interface SpinnerLoadingProps extends BaseLoadingProps {
  type: 'spinner';
  message?: string;
  variant?: 'default' | 'primary' | 'secondary';
}



interface FullPageLoadingProps extends BaseLoadingProps {
  type: 'full-page';
  message?: string;
}

// Union type para todas as props
export type LoadingProps = 
  | SpinnerLoadingProps 
  | FullPageLoadingProps;

// Configurações de tamanho
const sizeConfig = {
  xs: { spinner: 'h-3 w-3', container: 'min-h-[100px]' },
  sm: { spinner: 'h-4 w-4', container: 'min-h-[200px]' },
  md: { spinner: 'h-8 w-8', container: 'min-h-[400px]' },
  lg: { spinner: 'h-12 w-12', container: 'min-h-[600px]' },
  xl: { spinner: 'h-16 w-16', container: 'min-h-screen' }
};

// Variantes de cor
const variantConfig = {
  default: 'text-foreground',
  primary: 'text-primary',
  secondary: 'text-muted-foreground'
};

// Componente principal de Loading
export const Loading = (props: LoadingProps) => {
  const { type, size = 'md', className } = props;

  switch (type) {
    case 'spinner':
      return <SpinnerLoading {...(props as SpinnerLoadingProps)} />;
    case 'full-page':
      return <FullPageLoading {...(props as FullPageLoadingProps)} />;
    default:
      return <SpinnerLoading type="spinner" size={size} className={className} />;
  }
};

// Componente Spinner
const SpinnerLoading = ({ 
  size = 'md', 
  message, 
  variant = 'primary',
  className 
}: SpinnerLoadingProps) => {
  const config = sizeConfig[size];
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      config.container,
      className
    )}>
      <Loader2 className={cn(
        config.spinner,
        'animate-spin',
        variantConfig[variant]
      )} />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};



// Componente Full Page
const FullPageLoading = ({ 
  size = 'lg', 
  message, 
  className 
}: FullPageLoadingProps) => {
  const config = sizeConfig[size];
  
  return (
    <div className={cn(
      'fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className={cn(
            config.spinner,
            'animate-spin text-primary'
          )} />
          <div className={cn(
            'absolute inset-0 rounded-full border-2 border-primary/20',
            config.spinner
          )} />
        </div>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
};

// Componentes específicos para casos de uso comuns
export const PageLoader = ({ message }: { message?: string }) => (
  <Loading type="spinner" size="lg" message={message} />
);

export const ButtonLoader = ({ size = 'sm' }: { size?: LoadingSize }) => (
  <Loader2 className={cn(
    sizeConfig[size].spinner,
    'animate-spin text-current'
  )} />
);

export const InlineLoader = ({ size = 'sm' }: { size?: LoadingSize }) => (
  <Loading type="spinner" size={size} />
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="animate-pulse space-y-4">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="h-10 bg-muted rounded w-32" />
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 bg-muted rounded w-full" />
    ))}
  </div>
);

export const CardSkeleton = ({ cards = 3 }: { cards?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-32 bg-muted rounded" />
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

 