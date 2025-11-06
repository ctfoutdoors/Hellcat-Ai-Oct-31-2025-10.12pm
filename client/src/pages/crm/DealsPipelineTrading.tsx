import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { GlassCard, MetricCard, StatusBadge, LiveIndicator } from '@/components/trading';
import {
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Users,
  Building2,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

/**
 * Deals Pipeline - Trading Platform Style
 * 
 * Features:
 * - Bloomberg Terminal aesthetics
 * - Glass morphism Kanban board
 * - Real-time deal tracking
 * - Win probability indicators
 * - Weighted pipeline value
 */
export default function DealsPipelineTrading() {
  const [, setLocation] = useLocation();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Fetch pipeline data
  const { data, isLoading, error } = trpc.crm.deals.pipeline.useQuery();

  const pipeline = data?.pipeline || [];
  const stats = data?.stats || {
    totalValue: 0,
    weightedValue: 0,
    avgDealSize: 0,
    avgWinRate: 0,
    totalDeals: 0,
  };

  // Calculate stage metrics
  const stageMetrics = useMemo(() => {
    return pipeline.map(stage => {
      const totalValue = stage.deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const weightedValue = stage.deals.reduce(
        (sum, deal) => sum + (deal.value || 0) * (deal.probability || 0) / 100,
        0
      );
      const avgDaysInStage = stage.deals.length > 0
        ? stage.deals.reduce((sum, deal) => {
            const created = new Date(deal.createdAt);
            const now = new Date();
            const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / stage.deals.length
        : 0;

      return {
        stage: stage.stage,
        count: stage.count,
        totalValue,
        weightedValue,
        avgDaysInStage,
      };
    });
  }, [pipeline]);

  if (error) {
    return (
      <div className="p-8">
        <GlassCard className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-trading-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to load pipeline</h3>
          <p className="text-trading-navy-300">{error.message}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sales Pipeline
            </h1>
            <div className="flex items-center gap-4">
              <LiveIndicator />
              <span className="text-sm text-trading-navy-300">
                Real-time deal tracking
              </span>
            </div>
          </div>
          <Button
            onClick={() => setLocation('/crm/deals/new')}
            className="gradient-blue"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>

        {/* Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Pipeline Value"
            value={stats.totalValue / 100}
            format="currency"
            icon={<DollarSign className="w-5 h-5" />}
            trend="up"
            change={12.3}
          />
          <MetricCard
            label="Weighted Value"
            value={stats.weightedValue / 100}
            format="currency"
            icon={<Target className="w-5 h-5" />}
            trend="up"
            change={8.7}
          />
          <MetricCard
            label="Avg Deal Size"
            value={stats.avgDealSize / 100}
            format="currency"
            icon={<TrendingUp className="w-5 h-5" />}
            trend="neutral"
          />
          <MetricCard
            label="Win Rate"
            value={stats.avgWinRate}
            format="percentage"
            icon={<Target className="w-5 h-5" />}
            trend="up"
            change={5.2}
          />
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-80 flex-shrink-0">
                  <GlassCard>
                    <div className="skeleton h-64 rounded" />
                  </GlassCard>
                </div>
              ))
            ) : (
              pipeline.map((stage, stageIndex) => {
                const metrics = stageMetrics[stageIndex];
                const isSelected = selectedStage === stage.stage;

                return (
                  <div
                    key={stage.stage}
                    className="w-80 flex-shrink-0"
                  >
                    <GlassCard
                      className={`h-full ${isSelected ? 'glow-blue' : ''}`}
                      hover
                      onClick={() => setSelectedStage(isSelected ? null : stage.stage)}
                    >
                      {/* Stage Header */}
                      <div className="mb-4 pb-4 border-b border-trading-navy-700">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {stage.stage}
                          </h3>
                          <StatusBadge type="neutral">
                            {stage.count}
                          </StatusBadge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-trading-navy-400">Total Value</span>
                            <span className="font-mono text-trading-green-400">
                              ${(metrics.totalValue / 100).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-trading-navy-400">Weighted</span>
                            <span className="font-mono text-trading-blue-400">
                              ${(metrics.weightedValue / 100).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-trading-navy-400">Avg Days</span>
                            <span className="font-mono text-trading-navy-300">
                              {metrics.avgDaysInStage.toFixed(0)}d
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deal Cards */}
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {stage.deals.length === 0 ? (
                          <div className="text-center py-8 text-trading-navy-400">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No deals</p>
                          </div>
                        ) : (
                          stage.deals.map((deal) => (
                            <div
                              key={deal.id}
                              className="glass-hover rounded-lg p-4 cursor-pointer border border-trading-navy-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/crm/deals/${deal.id}`);
                              }}
                            >
                              {/* Deal Header */}
                              <div className="mb-3">
                                <h4 className="font-medium text-foreground mb-1">
                                  {deal.name}
                                </h4>
                                {deal.companyId && (
                                  <div className="flex items-center gap-1 text-xs text-trading-navy-400">
                                    <Building2 className="w-3 h-3" />
                                    Company #{deal.companyId}
                                  </div>
                                )}
                              </div>

                              {/* Deal Value */}
                              <div className="mb-3">
                                <div className="text-2xl font-bold font-mono text-trading-green-400">
                                  ${((deal.value || 0) / 100).toLocaleString()}
                                </div>
                              </div>

                              {/* Win Probability */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-trading-navy-400 mb-1">
                                  <span>Win Probability</span>
                                  <span className="font-mono">{deal.probability || 0}%</span>
                                </div>
                                <div className="h-2 bg-trading-navy-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      (deal.probability || 0) > 70
                                        ? 'gradient-green'
                                        : (deal.probability || 0) > 40
                                        ? 'gradient-blue'
                                        : 'gradient-amber'
                                    }`}
                                    style={{ width: `${deal.probability || 0}%` }}
                                  />
                                </div>
                              </div>

                              {/* Deal Footer */}
                              <div className="flex items-center justify-between text-xs">
                                {deal.contactId && (
                                  <div className="flex items-center gap-1 text-trading-navy-400">
                                    <Users className="w-3 h-3" />
                                    Contact #{deal.contactId}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-trading-navy-400">
                                  <Clock className="w-3 h-3" />
                                  {new Date(deal.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex gap-2 mt-3 pt-3 border-t border-trading-navy-800">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex-1 glass text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info('Email feature coming soon');
                                  }}
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex-1 glass text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info('Call feature coming soon');
                                  }}
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Call
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </GlassCard>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pipeline Insights */}
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Pipeline Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="metric-label mb-2">Total Deals</div>
              <div className="metric-value text-trading-blue-400">
                {stats.totalDeals}
              </div>
            </div>
            <div>
              <div className="metric-label mb-2">Conversion Rate</div>
              <div className="metric-value text-trading-green-400">
                {stats.avgWinRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="metric-label mb-2">Avg Sales Cycle</div>
              <div className="metric-value text-trading-amber-400">
                45d
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
