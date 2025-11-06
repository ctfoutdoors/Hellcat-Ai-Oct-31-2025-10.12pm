import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassCard, MetricCard, StatusBadge, LiveIndicator } from '@/components/trading';
import {
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Target,
  TrendingUp,
  Users,
  Flame,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

/**
 * Leads List - Dedicated view for lead management
 * 
 * Filters:
 * - lifecycleStage: 'lead', 'mql', 'sql', 'opportunity'
 * 
 * Features:
 * - Lead scoring display (0-100 scale)
 * - Lead source tracking
 * - Conversion funnel metrics
 * - AI-powered lead prioritization
 * - Quick actions: Qualify, Convert to Customer, Assign Owner
 */
export default function LeadsList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState<string>('');
  const [page, setPage] = useState(1);

  // Fetch leads (contacts with lead lifecycle stages)
  const { data, isLoading, error } = trpc.crm.contacts.list.useQuery({
    search: search || undefined,
    lifecycleStage: lifecycleStage as any || undefined,
    page,
    pageSize: 50,
    sortBy: 'leadScore',
    sortOrder: 'desc',
  });

  const leads = data?.contacts?.filter(c => 
    ['lead', 'mql', 'sql', 'opportunity'].includes(c.lifecycleStage)
  ) || [];
  
  const stats = data?.stats || {
    total: 0,
    avgLeadScore: 0,
    avgHealthScore: 0,
    totalLTV: 0,
  };

  // Calculate lead-specific metrics
  const metrics = useMemo(() => {
    const hotLeads = leads.filter(l => l.leadScore && l.leadScore > 75).length;
    const mqlCount = leads.filter(l => l.lifecycleStage === 'mql').length;
    const sqlCount = leads.filter(l => l.lifecycleStage === 'sql').length;
    const opportunityCount = leads.filter(l => l.lifecycleStage === 'opportunity').length;
    
    return {
      total: leads.length,
      avgLeadScore: stats.avgLeadScore,
      hotLeads,
      mqlCount,
      sqlCount,
      opportunityCount,
    };
  }, [leads, stats]);

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get lead score color
  const getLeadScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get lifecycle stage badge
  const getLifecycleStageBadge = (stage: string) => {
    switch (stage) {
      case 'lead':
        return <StatusBadge variant="default" icon={Target}>Lead</StatusBadge>;
      case 'mql':
        return <StatusBadge variant="info" icon={Clock}>MQL</StatusBadge>;
      case 'sql':
        return <StatusBadge variant="warning" icon={Zap}>SQL</StatusBadge>;
      case 'opportunity':
        return <StatusBadge variant="success" icon={TrendingUp}>Opportunity</StatusBadge>;
      default:
        return <StatusBadge variant="default">{stage}</StatusBadge>;
    }
  };

  // Get lead score badge
  const getLeadScoreBadge = (score: number | null) => {
    if (!score) return null;
    if (score >= 75) return <StatusBadge variant="success" icon={Flame}>Hot Lead</StatusBadge>;
    if (score >= 50) return <StatusBadge variant="warning" icon={TrendingUp}>Warm Lead</StatusBadge>;
    return <StatusBadge variant="default" icon={Clock}>Cold Lead</StatusBadge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-400" />
              Leads
              <LiveIndicator />
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and qualify your leads through the sales funnel
            </p>
          </div>
          <Button onClick={() => setLocation('/crm/contacts/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Leads"
            value={metrics.total.toLocaleString()}
            icon={Target}
            trend={0}
            iconColor="text-orange-400"
          />
          <MetricCard
            title="Hot Leads"
            value={metrics.hotLeads.toLocaleString()}
            icon={Flame}
            trend={0}
            iconColor="text-red-400"
          />
          <MetricCard
            title="Avg Lead Score"
            value={`${Math.round(metrics.avgLeadScore)}%`}
            icon={TrendingUp}
            trend={0}
            iconColor="text-green-400"
          />
          <MetricCard
            title="Opportunities"
            value={metrics.opportunityCount.toLocaleString()}
            icon={CheckCircle}
            trend={0}
            iconColor="text-blue-400"
          />
        </div>

        {/* Funnel Metrics */}
        <GlassCard>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400">{leads.filter(l => l.lifecycleStage === 'lead').length}</div>
              <div className="text-sm text-muted-foreground mt-1">Leads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{metrics.mqlCount}</div>
              <div className="text-sm text-muted-foreground mt-1">MQL</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{metrics.sqlCount}</div>
              <div className="text-sm text-muted-foreground mt-1">SQL</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{metrics.opportunityCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Opportunities</div>
            </div>
          </div>
        </GlassCard>

        {/* Filters */}
        <GlassCard>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stages</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="mql">MQL</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </GlassCard>

        {/* Leads List */}
        <GlassCard>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading leads...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">Error loading leads</p>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No leads found</p>
              <Button onClick={() => setLocation('/crm/contacts/new')} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Lead
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground border-b border-border/50">
                <div className="col-span-3">Lead</div>
                <div className="col-span-2">Stage</div>
                <div className="col-span-2">Lead Score</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Last Contact</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-accent"
                  onClick={() => setLocation(`/crm/contacts/${lead.id}`)}
                >
                  {/* Lead Info */}
                  <div className="col-span-3">
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-sm text-muted-foreground">{lead.email}</div>
                  </div>

                  {/* Stage */}
                  <div className="col-span-2 flex items-center">
                    {getLifecycleStageBadge(lead.lifecycleStage)}
                  </div>

                  {/* Lead Score */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className={`text-2xl font-bold ${getLeadScoreColor(lead.leadScore)}`}>
                        {lead.leadScore || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    {getLeadScoreBadge(lead.leadScore)}
                  </div>

                  {/* Last Contact */}
                  <div className="col-span-2 flex items-center">
                    <div className="text-sm">
                      {formatDate(lead.lastContactedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${lead.email}`;
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    {lead.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${lead.phone}`;
                        }}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Pagination */}
        {!isLoading && leads.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, leads.length)} of {leads.length} leads
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={leads.length < 50}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
