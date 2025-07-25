import { Button } from "brk-design-system";
import React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderAction {
  label: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
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
  className,
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
              <Button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                variant={action.variant || "default"}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
