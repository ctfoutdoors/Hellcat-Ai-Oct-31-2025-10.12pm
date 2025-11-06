import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number; // Percentage change
  trend?: "up" | "down" | "neutral";
  format?: "number" | "currency" | "percentage";
  icon?: React.ReactNode;
  className?: string;
  sparklineData?: number[]; // Optional mini chart data
}

/**
 * MetricCard - Trading-style metric display with large numbers
 * Features: trend indicators, percentage change, optional sparkline
 */
export function MetricCard({
  label,
  value,
  change,
  trend = "neutral",
  format = "number",
  icon,
  className,
  sparklineData,
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;
    
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percentage":
        return `${val}%`;
      default:
        return new Intl.NumberFormat("en-US").format(val);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-5 h-5 text-trading-green-500" />;
      case "down":
        return <TrendingDown className="w-5 h-5 text-trading-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-trading-navy-300" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "status-positive";
      case "down":
        return "status-negative";
      default:
        return "status-neutral";
    }
  };

  return (
    <GlassCard 
      className={cn("relative overflow-hidden", className)}
      hover
      glow={trend === "up" ? "green" : trend === "down" ? "red" : "none"}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="metric-label">{label}</div>
        {icon && <div className="text-trading-navy-400">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={cn("metric-value number-ticker", getTrendColor())}>
            {formatValue(value)}
          </div>
          
          {change !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon()}
              <span className={cn("text-sm font-medium", getTrendColor())}>
                {change > 0 ? "+" : ""}{change.toFixed(2)}%
              </span>
              <span className="text-xs text-trading-navy-400">vs last period</span>
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="ml-4">
            <Sparkline data={sparklineData} trend={trend} />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/**
 * Sparkline - Mini line chart for trends
 */
function Sparkline({ data, trend }: { data: number[]; trend: "up" | "down" | "neutral" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  const color = trend === "up" 
    ? "var(--trading-green-500)" 
    : trend === "down" 
    ? "var(--trading-red-500)" 
    : "var(--trading-navy-400)";

  return (
    <svg width="80" height="32" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}
