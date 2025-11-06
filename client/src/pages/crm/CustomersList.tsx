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
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Heart,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

/**
 * Customers List - Dedicated view for customer contacts
 * 
 * Filters:
 * - contactType: 'direct_owned' or 'marketplace'
 * - lifecycleStage: 'customer' or 'advocate'
 * 
 * Features:
 * - Customer-specific metrics (LTV, health score, churn probability)
 * - Purchase history integration
 * - Quick actions: Email, Call, Create Deal, View Orders
 */
export default function CustomersList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [contactType, setContactType] = useState<string>('');
  const [page, setPage] = useState(1);

  // Fetch customers (contacts with customer lifecycle stage)
  const { data, isLoading, error } = trpc.crm.contacts.list.useQuery({
    search: search || undefined,
    contactType: contactType as any || undefined,
    lifecycleStage: 'customer', // Filter for customers only
    page,
    pageSize: 50,
    sortBy: 'lifetimeValue',
    sortOrder: 'desc',
  });

  const customers = data?.contacts || [];
  const stats = data?.stats || {
    total: 0,
    avgLeadScore: 0,
    avgHealthScore: 0,
    totalLTV: 0,
  };

  // Calculate customer-specific metrics
  const metrics = useMemo(() => {
    const highRisk = customers.filter(c => c.churnProbability && c.churnProbability > 70).length;
    const advocates = customers.filter(c => c.lifecycleStage === 'advocate').length;
    const avgLTV = stats.totalLTV / (stats.total || 1);
    const healthyCustomers = customers.filter(c => c.healthScore && c.healthScore > 70).length;
    
    return {
      total: stats.total,
      avgHealthScore: stats.avgHealthScore,
      totalLTV: stats.totalLTV,
      avgLTV,
      highRisk,
      advocates,
      healthyCustomers,
    };
  }, [customers, stats]);

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get health score color
  const getHealthScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get churn risk badge
  const getChurnRiskBadge = (probability: number | null) => {
    if (!probability) return null;
    if (probability >= 70) return <StatusBadge variant="error" icon={AlertCircle}>High Risk</StatusBadge>;
    if (probability >= 40) return <StatusBadge variant="warning" icon={AlertTriangle}>Medium Risk</StatusBadge>;
    return <StatusBadge variant="success" icon={Heart}>Healthy</StatusBadge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              Customers
              <LiveIndicator />
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your customer relationships and track customer health
            </p>
          </div>
          <Button onClick={() => setLocation('/crm/contacts/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Customers"
            value={metrics.total.toLocaleString()}
            icon={Users}
            trend={0}
            iconColor="text-blue-400"
          />
          <MetricCard
            title="Total LTV"
            value={formatCurrency(metrics.totalLTV)}
            icon={DollarSign}
            trend={0}
            iconColor="text-green-400"
          />
          <MetricCard
            title="Avg Health Score"
            value={`${Math.round(metrics.avgHealthScore)}%`}
            icon={Heart}
            trend={0}
            iconColor="text-pink-400"
          />
          <MetricCard
            title="At Risk"
            value={metrics.highRisk.toLocaleString()}
            icon={AlertCircle}
            trend={0}
            iconColor="text-red-400"
          />
        </div>

        {/* Filters */}
        <GlassCard>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={contactType} onValueChange={setContactType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="direct_owned">Direct (Website)</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
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

        {/* Customer List */}
        <GlassCard>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">Error loading customers</p>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
              <Button onClick={() => setLocation('/crm/contacts/new')} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Customer
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground border-b border-border/50">
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Lifetime Value</div>
                <div className="col-span-2">Health Score</div>
                <div className="col-span-2">Last Activity</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-accent"
                  onClick={() => setLocation(`/crm/contacts/${customer.id}`)}
                >
                  {/* Customer Info */}
                  <div className="col-span-3">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                  </div>

                  {/* Type */}
                  <div className="col-span-2 flex items-center">
                    {customer.contactType === 'direct_owned' ? (
                      <StatusBadge variant="info" icon={ShoppingBag}>Direct</StatusBadge>
                    ) : customer.contactType === 'marketplace' ? (
                      <StatusBadge variant="warning" icon={Package}>Marketplace</StatusBadge>
                    ) : (
                      <StatusBadge variant="default">Other</StatusBadge>
                    )}
                  </div>

                  {/* LTV */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className="font-medium text-green-400">
                        {formatCurrency(customer.lifetimeValue || 0)}
                      </div>
                      {customer.lifecycleStage === 'advocate' && (
                        <div className="text-xs text-yellow-400 flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          Advocate
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Health Score */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className={`font-medium ${getHealthScoreColor(customer.healthScore)}`}>
                        {customer.healthScore || 0}%
                      </div>
                      {getChurnRiskBadge(customer.churnProbability)}
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="col-span-2 flex items-center">
                    <div className="text-sm">
                      {formatDate(customer.lastActivityAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${customer.email}`;
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    {customer.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${customer.phone}`;
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
        {!isLoading && customers.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, stats.total)} of {stats.total} customers
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
                disabled={customers.length < 50}
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
