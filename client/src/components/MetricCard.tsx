import { Card } from '@/components/ui/card';
import { useDensity } from '@/contexts/DensityContext';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  secondaryMetrics?: Array<{
    label: string;
    value: string | number;
  }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: ReactNode;
}

const variantStyles = {
  default: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  success: {
    icon: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  warning: {
    icon: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  danger: {
    icon: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  info: {
    icon: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  secondaryMetrics,
  action,
  variant = 'default',
  children,
}: MetricCardProps) {
  const { density } = useDensity();
  const styles = variantStyles[variant];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600';
    if (trend.value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Density-specific padding
  const paddingClass = {
    compact: 'p-3',
    normal: 'p-4',
    detailed: 'p-6',
  }[density];

  // Density-specific text sizes
  const titleSize = {
    compact: 'text-xs',
    normal: 'text-sm',
    detailed: 'text-base',
  }[density];

  const valueSize = {
    compact: 'text-xl',
    normal: 'text-2xl',
    detailed: 'text-3xl',
  }[density];

  const descSize = {
    compact: 'text-[10px]',
    normal: 'text-xs',
    detailed: 'text-sm',
  }[density];

  return (
    <Card className={`metric-card ${paddingClass} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`${titleSize} font-semibold text-gray-700 uppercase tracking-wide`}>
              {title}
            </h3>
            {trend && (
              <div className={`flex items-center gap-0.5 ${getTrendColor()} ${descSize}`}>
                {getTrendIcon()}
                <span className="font-medium">
                  {trend.value > 0 && '+'}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>

          {/* Primary Value */}
          <div className={`${valueSize} font-bold text-gray-900 mb-1`}>
            {value}
          </div>

          {/* Description */}
          {description && (
            <p className={`${descSize} text-gray-500`}>{description}</p>
          )}

          {/* Secondary Metrics */}
          {secondaryMetrics && secondaryMetrics.length > 0 && (
            <div className={`grid grid-cols-2 gap-2 ${density === 'compact' ? 'mt-2' : 'mt-3'}`}>
              {secondaryMetrics.map((metric, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className={`${descSize} text-gray-500`}>{metric.label}</span>
                  <span className={`${density === 'compact' ? 'text-sm' : 'text-base'} font-semibold text-gray-700`}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Custom children */}
          {children && (
            <div className={density === 'compact' ? 'mt-2' : 'mt-3'}>
              {children}
            </div>
          )}

          {/* Action Button */}
          {action && (
            <button
              onClick={action.onClick}
              className={`${density === 'compact' ? 'mt-2 text-xs' : 'mt-3 text-sm'} text-primary hover:text-primary/80 font-medium transition-colors`}
            >
              {action.label} →
            </button>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={`${styles.bg} ${styles.border} border rounded-lg ${density === 'compact' ? 'p-2' : 'p-3'} shrink-0`}>
            <Icon className={`${styles.icon} ${density === 'compact' ? 'h-5 w-5' : density === 'normal' ? 'h-6 w-6' : 'h-7 w-7'}`} />
          </div>
        )}
      </div>
    </Card>
  );
}

// Compact inline metric for dense displays
export function InlineMetric({
  label,
  value,
  icon: Icon,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles = variantStyles[variant];

  return (
    <div className="flex items-center gap-2">
      {Icon && (
        <div className={`${styles.bg} ${styles.border} border rounded p-1`}>
          <Icon className={`${styles.icon} h-3 w-3`} />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
