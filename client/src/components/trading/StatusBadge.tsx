import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  type: "gain" | "loss" | "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  icon?: boolean;
  pulse?: boolean;
  className?: string;
}

/**
 * StatusBadge - Trading-style status indicators
 * Features: color-coded badges with optional icons and pulse animation
 */
export function StatusBadge({ 
  type, 
  children, 
  icon = false,
  pulse = false,
  className 
}: StatusBadgeProps) {
  const getIcon = () => {
    if (!icon) return null;
    
    switch (type) {
      case "gain":
        return <TrendingUp className="w-3 h-3" />;
      case "loss":
        return <TrendingDown className="w-3 h-3" />;
      case "success":
        return <CheckCircle className="w-3 h-3" />;
      case "warning":
      case "neutral":
        return <AlertCircle className="w-3 h-3" />;
      case "danger":
        return <AlertCircle className="w-3 h-3" />;
      case "info":
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "gain":
      case "success":
        return "badge-gain";
      case "loss":
      case "danger":
        return "badge-loss";
      case "neutral":
      case "warning":
      case "info":
        return "badge-neutral";
      default:
        return "badge-neutral";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
        getStyles(),
        pulse && "pulse-dot",
        className
      )}
    >
      {getIcon()}
      {children}
    </span>
  );
}

/**
 * PercentageChange - Specialized badge for percentage changes
 */
export function PercentageChange({ 
  value, 
  showIcon = true,
  className 
}: { 
  value: number; 
  showIcon?: boolean;
  className?: string;
}) {
  const type = value > 0 ? "gain" : value < 0 ? "loss" : "neutral";
  const displayValue = value > 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
  
  return (
    <StatusBadge type={type} icon={showIcon} className={className}>
      {displayValue}
    </StatusBadge>
  );
}

/**
 * LiveIndicator - Pulsing dot for live data
 */
export function LiveIndicator({ 
  label = "LIVE",
  className 
}: { 
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trading-green-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-trading-green-500"></span>
      </span>
      <span className="text-xs font-medium text-trading-green-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
