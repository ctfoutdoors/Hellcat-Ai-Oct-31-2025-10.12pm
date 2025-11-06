import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "blue" | "green" | "red" | "none";
  onClick?: () => void;
}

/**
 * GlassCard - Trading platform style card with glass morphism effect
 * Features: backdrop blur, subtle borders, hover effects, optional glow
 */
export function GlassCard({ 
  children, 
  className, 
  hover = false,
  glow = "none",
  onClick 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-lg p-6",
        hover && "glass-hover card-interactive",
        glow === "blue" && "glow-blue",
        glow === "green" && "glow-green",
        glow === "red" && "glow-red",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
