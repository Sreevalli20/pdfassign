import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "purple" | "orange"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-purple-100 text-purple-900 border border-purple-300",
    secondary: "bg-orange-100 text-orange-900 border border-orange-300",
    destructive: "bg-red-100 text-red-900 border border-red-300",
    outline: "border-2 border-purple-400 text-purple-700 bg-white",
    success: "bg-green-100 text-green-900 border border-green-300",
    warning: "bg-yellow-100 text-yellow-900 border border-yellow-300",
    purple: "bg-purple-100 text-purple-900 border border-purple-300",
    orange: "bg-orange-100 text-orange-900 border border-orange-300",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
