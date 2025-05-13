import { cn } from "@/lib/utils"
import React from "react"

interface TabProps {
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export function Tab({ 
  children, 
  isActive = false, 
  onClick, 
  className 
}: TabProps) {
  return (
    <button
      className={cn(
        "px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
        isActive
          ? "bg-primary-500 text-white"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        className
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
} 