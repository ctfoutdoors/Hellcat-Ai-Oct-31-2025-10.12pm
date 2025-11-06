import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GlassCard, MetricCard, StatusBadge, LiveIndicator } from '@/components/trading';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Deal Detail - Trading Platform Style
 * 
 * Features:
 * - Bloomberg Terminal aesthetics
 * - 360° deal view with metrics
 * - Stage timeline
 * - Win/loss analysis
 * - Related entities
 */
export default function DealDetailTrading() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = trpc.crm.deals.getById.useQuery({
    id: parseInt(id || '0'),
  });

  const deleteMutation = trpc.crm.deals.delete.useMutation({
    onSuccess: () => {
      toast.success('Deal deleted');
      setLocation('/crm/deals');
    },
  });

  if (error) {
    return (
      <div className="p-8">
        <GlassCard className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-trading-red-500" />
          <h3 className="text-lg font-semibold mb-2">Deal not found</h3>
          <p className="text-trading-navy-300">{error.message}</p>
          <Button
            onClick={() => setLocation('/crm/deals')}
            className="mt-4 gradient-blue"
          >
            Back to Pipeline
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
        <div className="container mx-auto space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <GlassCard key={i}>
              <div className="skeleton h-32 rounded" />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  const deal = data.deal;
  const daysInStage = Math.floor(
    (new Date().getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const stages = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const currentStageIndex = stages.indexOf(deal.stage);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/crm/deals')}
              className="glass"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {deal.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <LiveIndicator label="ACTIVE" />
                <StatusBadge type={deal.stage.includes('Won') ? 'gain' : deal.stage.includes('Lost') ? 'loss' : 'neutral'}>
                  {deal.stage}
                </StatusBadge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="glass">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Delete this deal?')) {
                  deleteMutation.mutate({ id: deal.id });
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Deal Value"
            value={(deal.value || 0) / 100}
            format="currency"
            icon={<DollarSign className="w-5 h-5" />}
            trend="up"
          />
          <MetricCard
            label="Win Probability"
            value={deal.probability || 0}
            format="percentage"
            icon={<Target className="w-5 h-5" />}
            trend={deal.probability && deal.probability > 50 ? 'up' : 'down'}
          />
          <MetricCard
            label="Days in Stage"
            value={daysInStage}
            icon={<Clock className="w-5 h-5" />}
            trend="neutral"
          />
          <MetricCard
            label="Expected Close"
            value={deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
            icon={<Calendar className="w-5 h-5" />}
            trend="neutral"
          />
        </div>

        {/* Stage Timeline */}
        <GlassCard>
          <h3 className="text-lg font-semibold mb-6">Deal Progress</h3>
          <div className="relative">
            {/* Progress Bar */}
            <div className="h-2 bg-trading-navy-800 rounded-full overflow-hidden mb-8">
              <div
                className="h-full gradient-blue transition-all duration-500"
                style={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }}
              />
            </div>

            {/* Stage Markers */}
            <div className="flex justify-between">
              {stages.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isWon = stage === 'Closed Won' && deal.stage === 'Closed Won';
                const isLost = stage === 'Closed Lost' && deal.stage === 'Closed Lost';

                return (
                  <div key={stage} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        isWon
                          ? 'gradient-green glow-green'
                          : isLost
                          ? 'gradient-red glow-red'
                          : isCurrent
                          ? 'gradient-blue glow-blue'
                          : isCompleted
                          ? 'bg-trading-navy-600'
                          : 'bg-trading-navy-800'
                      }`}
                    >
                      {isWon ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : isLost ? (
                        <XCircle className="w-5 h-5 text-white" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-trading-navy-300" />
                      ) : (
                        <span className="text-sm font-mono text-trading-navy-400">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs text-center ${isCurrent ? 'text-trading-blue-400 font-semibold' : 'text-trading-navy-400'}`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deal Information */}
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4">Deal Information</h3>
            <div className="space-y-4">
              <div>
                <div className="metric-label mb-1">Deal Name</div>
                <div className="text-foreground">{deal.name}</div>
              </div>
              <div>
                <div className="metric-label mb-1">Stage</div>
                <StatusBadge type={deal.stage.includes('Won') ? 'gain' : deal.stage.includes('Lost') ? 'loss' : 'neutral'}>
                  {deal.stage}
                </StatusBadge>
              </div>
              <div>
                <div className="metric-label mb-1">Value</div>
                <div className="text-2xl font-mono text-trading-green-400">
                  ${((deal.value || 0) / 100).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="metric-label mb-1">Win Probability</div>
                <div className="flex items-center gap-3">
                  <Progress value={deal.probability || 0} className="flex-1" />
                  <span className="text-sm font-mono text-trading-blue-400">
                    {deal.probability || 0}%
                  </span>
                </div>
              </div>
              <div>
                <div className="metric-label mb-1">Expected Close Date</div>
                <div className="text-foreground">
                  {deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString()
                    : 'Not set'}
                </div>
              </div>
              <div>
                <div className="metric-label mb-1">Created</div>
                <div className="text-trading-navy-300">
                  {new Date(deal.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Related Entities */}
          <div className="space-y-6">
            {/* Company */}
            {deal.companyId && (
              <GlassCard hover onClick={() => setLocation(`/crm/companies/${deal.companyId}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-trading-navy-800 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-trading-blue-400" />
                    </div>
                    <div>
                      <div className="metric-label">Company</div>
                      <div className="text-foreground font-medium">
                        Company #{deal.companyId}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="glass">
                    View
                  </Button>
                </div>
              </GlassCard>
            )}

            {/* Contact */}
            {deal.contactId && (
              <GlassCard hover onClick={() => setLocation(`/crm/contacts/${deal.contactId}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-trading-navy-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-trading-green-400" />
                    </div>
                    <div>
                      <div className="metric-label">Primary Contact</div>
                      <div className="text-foreground font-medium">
                        Contact #{deal.contactId}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="glass">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="glass">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Win/Loss Analysis */}
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Deal Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="metric-label mb-2">Weighted Value</div>
              <div className="text-2xl font-mono text-trading-blue-400">
                ${(((deal.value || 0) * (deal.probability || 0)) / 10000).toLocaleString()}
              </div>
              <p className="text-xs text-trading-navy-400 mt-1">
                Based on {deal.probability || 0}% win probability
              </p>
            </div>
            <div>
              <div className="metric-label mb-2">Time in Pipeline</div>
              <div className="text-2xl font-mono text-trading-amber-400">
                {daysInStage}d
              </div>
              <p className="text-xs text-trading-navy-400 mt-1">
                Since {new Date(deal.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <div className="metric-label mb-2">Deal Health</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-trading-navy-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (deal.probability || 0) > 70
                        ? 'gradient-green'
                        : (deal.probability || 0) > 40
                        ? 'gradient-blue'
                        : 'gradient-red'
                    }`}
                    style={{ width: `${deal.probability || 0}%` }}
                  />
                </div>
                <StatusBadge
                  type={
                    (deal.probability || 0) > 70
                      ? 'gain'
                      : (deal.probability || 0) > 40
                      ? 'neutral'
                      : 'loss'
                  }
                >
                  {(deal.probability || 0) > 70
                    ? 'Strong'
                    : (deal.probability || 0) > 40
                    ? 'Moderate'
                    : 'At Risk'}
                </StatusBadge>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
