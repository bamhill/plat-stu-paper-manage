"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple native <select> wrapper matching RHF FormControl expectations
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    onValueChange?: (value: string) => void
  }
>(({ className, children, onValueChange, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e)
    onValueChange?.(e.target.value)
  }
  return (
    <select
      ref={ref}
      onChange={handleChange}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
