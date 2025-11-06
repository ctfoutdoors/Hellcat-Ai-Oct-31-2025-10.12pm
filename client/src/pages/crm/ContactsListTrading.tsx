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
import { Checkbox } from '@/components/ui/checkbox';
import { GlassCard, MetricCard, StatusBadge, LiveIndicator } from '@/components/trading';
import {
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Flame,
  AlertTriangle,
  Trash2,
  Edit,
  Activity,
  CheckSquare,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

/**
 * Contacts List - Trading Platform Style
 * 
 * Features:
 * - Bloomberg Terminal aesthetics
 * - Glass morphism effects
 * - Real-time data updates
 * - Advanced filtering
 * - Bulk operations
 */
export default function ContactsListTrading() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  // Fetch contacts with filters
  const { data, isLoading, error } = trpc.crm.contacts.list.useQuery({
    search: search || undefined,
    lifecycleStage: lifecycleStage as any || undefined,
    page,
    pageSize: 50,
    sortBy: 'lastActivity',
    sortOrder: 'desc',
  });

  const contacts = data?.contacts || [];
  const stats = data?.stats || {
    total: 0,
    avgLeadScore: 0,
    avgHealthScore: 0,
    totalLTV: 0,
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const highRisk = contacts.filter(c => c.churnProbability && c.churnProbability > 70).length;
    const hotLeads = contacts.filter(c => c.leadScore && c.leadScore > 75).length;
    
    return {
      total: stats.total,
      avgLeadScore: stats.avgLeadScore,
      avgHealthScore: stats.avgHealthScore,
      totalLTV: stats.totalLTV,
      highRisk,
      hotLeads,
    };
  }, [contacts, stats]);

  // Bulk operations
  const deleteMutation = trpc.crm.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success('Contacts deleted successfully');
      setSelectedIds([]);
      setBulkMode(false);
    },
  });

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} contacts?`)) return;
    
    selectedIds.forEach(id => {
      deleteMutation.mutate({ id });
    });
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c.id));
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <GlassCard className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-trading-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to load contacts</h3>
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
              Contact Intelligence
            </h1>
            <div className="flex items-center gap-4">
              <LiveIndicator />
              <span className="text-sm text-trading-navy-300">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setBulkMode(!bulkMode)}
              className="glass"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Bulk Actions
            </Button>
            <Button
              onClick={() => setLocation('/crm/contacts/new')}
              className="gradient-blue"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Contact
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Contacts"
            value={metrics.total}
            icon={<Users className="w-5 h-5" />}
            trend="neutral"
          />
          <MetricCard
            label="Hot Leads"
            value={metrics.hotLeads}
            change={12.5}
            trend="up"
            icon={<Flame className="w-5 h-5" />}
          />
          <MetricCard
            label="At Risk"
            value={metrics.highRisk}
            change={-8.3}
            trend="down"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <MetricCard
            label="Total LTV"
            value={metrics.totalLTV / 100}
            format="currency"
            change={15.7}
            trend="up"
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>

        {/* Filters */}
        <GlassCard>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-trading-navy-400" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-trading-navy-800 border-trading-navy-700"
                />
              </div>
            </div>
            
            <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
              <SelectTrigger className="w-[200px] bg-trading-navy-800 border-trading-navy-700">
                <SelectValue placeholder="Lifecycle Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="mql">MQL</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="advocate">Advocate</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="glass">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>

            <Button variant="outline" className="glass">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </GlassCard>

        {/* Bulk Actions Bar */}
        {bulkMode && selectedIds.length > 0 && (
          <GlassCard className="glow-blue">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                  className="glass"
                >
                  Clear
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="glass">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="glass">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Contacts Table */}
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-trading-navy-800">
                  {bulkMode && (
                    <th className="text-left p-4 w-12">
                      <Checkbox
                        checked={selectedIds.length === contacts.length}
                        onCheckedChange={toggleAll}
                      />
                    </th>
                  )}
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    Lead Score
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    Health
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    LTV
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-trading-navy-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="data-table-row">
                      <td colSpan={bulkMode ? 9 : 8} className="p-4">
                        <div className="skeleton h-12 rounded" />
                      </td>
                    </tr>
                  ))
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={bulkMode ? 9 : 8} className="p-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-trading-navy-500" />
                      <p className="text-trading-navy-300">No contacts found</p>
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="data-table-row cursor-pointer"
                      onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
                    >
                      {bulkMode && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(contact.id)}
                            onCheckedChange={() => toggleSelection(contact.id)}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {contact.name}
                          </div>
                          <div className="text-sm text-trading-navy-400">
                            {contact.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-trading-navy-300">
                          <Building2 className="w-4 h-4" />
                          {contact.companyId || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge type="neutral">
                          {contact.lifecycleStage}
                        </StatusBadge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-trading-navy-800 rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-blue"
                              style={{ width: `${contact.leadScore || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono text-trading-blue-400">
                            {contact.leadScore || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-trading-navy-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                (contact.healthScore || 0) > 70
                                  ? 'gradient-green'
                                  : (contact.healthScore || 0) > 40
                                  ? 'gradient-amber'
                                  : 'gradient-red'
                              }`}
                              style={{ width: `${contact.healthScore || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono text-trading-navy-300">
                            {contact.healthScore || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono text-trading-green-400">
                          ${((contact.lifetimeValue || 0) / 100).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        {contact.churnProbability && contact.churnProbability > 70 ? (
                          <StatusBadge type="danger" icon>
                            High Risk
                          </StatusBadge>
                        ) : contact.leadScore && contact.leadScore > 75 ? (
                          <StatusBadge type="gain" icon>
                            Hot Lead
                          </StatusBadge>
                        ) : (
                          <StatusBadge type="neutral">
                            Active
                          </StatusBadge>
                        )}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="glass">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="glass">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="glass">
                            <Activity className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Pagination */}
        {contacts.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-trading-navy-300">
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, metrics.total)} of{' '}
              {metrics.total} contacts
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="glass"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={contacts.length < 50}
                className="glass"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
