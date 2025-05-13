import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors", 
  {
    variants: {
      variant: {
        default: "border-input",
        muted: "border-muted bg-muted/40",
        ghost: "border-transparent bg-transparent shadow-none focus-visible:ring-1",
        search: "pl-9", // Para inputs com ícone de busca
      },
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-3 py-1 text-xs rounded-sm",
        lg: "h-12 px-4 py-3 text-base rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  onClear?: () => void
  showClear?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, icon, onClear, showClear, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            inputVariants({ variant, inputSize, className }),
            icon && "pl-9"
          )}
          ref={ref}
          {...props}
        />
        
        {showClear && props.value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Componente especializado para busca
const SearchInput = React.forwardRef<
  HTMLInputElement, 
  Omit<InputProps, 'icon'> & { 
    iconClassName?: string
    clearable?: boolean
  }
>(({ className, iconClassName, clearable = false, onClear, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type="search"
      icon={<Search className={iconClassName || "h-4 w-4"} />}
      showClear={clearable}
      onClear={onClear}
      {...props}
    />
  )
})
SearchInput.displayName = "SearchInput"

export { Input, SearchInput, inputVariants } 