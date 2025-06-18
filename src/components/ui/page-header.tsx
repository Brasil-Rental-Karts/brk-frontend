import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderAction {
  label: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions = [],
  className
}) => {
  return (
    <div className={cn("w-full py-6 px-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
        {/* Title section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {/* Actions section */}
        {actions.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 md:flex-row">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
                  "h-10 py-2 px-4",
                  {
                    "bg-primary text-primary-foreground hover:bg-primary/90": action.variant === 'default' || !action.variant,
                    "border border-input hover:bg-accent hover:text-accent-foreground": action.variant === 'outline',
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90": action.variant === 'destructive'
                  }
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 