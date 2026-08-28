import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
    
    const variants = {
      default: "bg-gradient-to-r from-[#F97316] to-[#6D28D9] text-white hover:from-[#EA580C] hover:to-[#5B21B6] shadow-md hover:shadow-lg",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
      outline: "border-2 border-purple-400 bg-white text-purple-700 hover:bg-purple-50 hover:border-purple-500 shadow-sm hover:shadow-md",
      secondary: "bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300",
      ghost: "hover:bg-purple-100 text-purple-700 hover:shadow-sm",
      link: "text-purple-600 underline-offset-4 hover:underline hover:text-purple-700",
    }
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }

    return (
      <button
        type={type}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
