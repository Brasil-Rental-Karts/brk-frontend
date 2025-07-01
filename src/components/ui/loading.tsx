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

// Mensagens padrão para diferentes contextos
const defaultMessages = {
  page: 'Carregando página...',
  data: 'Carregando dados...',
  form: 'Processando formulário...',
  save: 'Salvando...',
  delete: 'Excluindo...',
  upload: 'Enviando arquivo...',
  download: 'Baixando arquivo...',
  search: 'Buscando...',
  filter: 'Filtrando resultados...',
  general: 'Carregando...'
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
      return <SpinnerLoading type="spinner" size={size} className={className} message={defaultMessages.general} />;
  }
};

// Componente Spinner
const SpinnerLoading = ({ 
  size = 'md', 
  message = defaultMessages.general, 
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
        <p className="mt-4 text-sm text-muted-foreground animate-pulse text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  );
};

// Componente Full Page
const FullPageLoading = ({ 
  size = 'lg', 
  message = defaultMessages.page, 
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
          <p className="text-sm text-muted-foreground text-center max-w-xs animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// Componentes específicos para casos de uso comuns
export const PageLoader = ({ message = defaultMessages.page }: { message?: string }) => (
  <Loading type="spinner" size="lg" message={message} />
);

export const DataLoader = ({ message = defaultMessages.data }: { message?: string }) => (
  <Loading type="spinner" size="lg" message={message} />
);

export const FormLoader = ({ message = defaultMessages.form }: { message?: string }) => (
  <Loading type="spinner" size="md" message={message} />
);

export const SaveLoader = ({ message = defaultMessages.save }: { message?: string }) => (
  <Loading type="spinner" size="md" message={message} />
);

export const DeleteLoader = ({ message = defaultMessages.delete }: { message?: string }) => (
  <Loading type="spinner" size="md" message={message} />
);

export const UploadLoader = ({ message = defaultMessages.upload }: { message?: string }) => (
  <Loading type="spinner" size="md" message={message} />
);

export const SearchLoader = ({ message = defaultMessages.search }: { message?: string }) => (
  <Loading type="spinner" size="sm" message={message} />
);

export const FilterLoader = ({ message = defaultMessages.filter }: { message?: string }) => (
  <Loading type="spinner" size="sm" message={message} />
);

export const ButtonLoader = ({ size = 'sm' }: { size?: LoadingSize }) => (
  <Loader2 className={cn(
    sizeConfig[size].spinner,
    'animate-spin text-current'
  )} />
);

export const InlineLoader = ({ size = 'sm', message = defaultMessages.general }: { size?: LoadingSize; message?: string }) => (
  <Loading type="spinner" size={size} message={message} />
);

// Exportar mensagens padrão para uso customizado
export { defaultMessages };



 