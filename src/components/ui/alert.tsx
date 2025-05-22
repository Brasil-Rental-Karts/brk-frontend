import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

const alertVariants = cva(
  "relative w-full rounded-lg text-sm grid grid-cols-[auto_1fr] items-start gap-3",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive",
        withAction: "bg-primary/20 text-foreground",
      },
      hasCloseButton: {
        true: "pr-12",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      hasCloseButton: false,
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onClose?: () => void;
  action?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant, hasCloseButton, onClose, action, children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant, hasCloseButton }), className)}
      {...props}
    >
      <div className="flex items-center justify-center py-6 pl-6">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-2 py-6 pr-4">
        {children}
        {variant === "withAction" && action ? (
          <div className="flex items-start">{action}</div>
        ) : (
          action && <div className="mt-2">{action}</div>
        )}
      </div>
      {hasCloseButton && onClose && (
        <Button
          variant="ghost"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      )}
    </div>
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
