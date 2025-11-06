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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GlassCard, MetricCard, StatusBadge, LiveIndicator } from '@/components/trading';
import {
  Plus,
  Search,
  Download,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

/**
 * Companies List - Trading Platform Style
 * 
 * Features:
 * - Bloomberg Terminal aesthetics
 * - Glass morphism effects
 * - Real-time data updates
 * - Advanced filtering
 */
export default function CompaniesListTrading() {
  const [, setLocation] = useLocation();
  
  // Filters state
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<string>('all');
  const [tier, setTier] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortBy, setSortBy] = useState<'name' | 'annualRevenue' | 'lifetimeValue' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Build query input
  const queryInput = useMemo(() => {
    const input: any = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };
    
    if (search) input.search = search;
    if (industry !== 'all') input.industry = industry;
    if (tier !== 'all') input.tier = tier;
    
    return input;
  }, [search, industry, tier, page, pageSize, sortBy, sortOrder]);
  
  // Fetch companies
  const { data, isLoading, error } = trpc.crm.companies.list.useQuery(queryInput);
  
  // Calculate summary stats
  const stats = useMemo(() => {
    if (!data?.data) return null;
    
    const companies = data.data;
    const totalCompanies = data.pagination.total;
    const totalRevenue = companies.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
    const totalLTV = companies.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
    const avgRevenue = companies.length > 0 ? Math.round(totalRevenue / companies.length) : 0;
    
    return {
      totalCompanies,
      totalRevenue,
      totalLTV,
      avgRevenue,
    };
  }, [data]);
  
  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get tier badge variant
  const getTierVariant = (tier: string): 'default' | 'success' | 'warning' | 'danger' => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      enterprise: 'danger',
      'mid-market': 'warning',
      smb: 'success',
    };
    return variants[tier] || 'default';
  };
  
  // Get account type badge variant
  const getAccountTypeVariant = (type: string): 'default' | 'success' | 'warning' | 'danger' => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      customer: 'success',
      prospect: 'warning',
      partner: 'default',
      competitor: 'danger',
    };
    return variants[type] || 'default';
  };
  
  // Handle row click
  const handleRowClick = (companyId: number) => {
    setLocation(`/crm/companies/${companyId}`);
  };
  
  if (error) {
    return (
      <div className="p-8">
        <GlassCard className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-trading-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to load companies</h3>
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
              Companies
            </h1>
            <div className="flex items-center gap-4">
              <LiveIndicator />
              <span className="text-sm text-trading-navy-300">
                B2B Account Management
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="glass">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="gradient-blue">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Companies"
              value={stats.totalCompanies}
              icon={<Building2 className="w-5 h-5" />}
              trend="neutral"
            />
            <MetricCard
              label="Total Revenue"
              value={stats.totalRevenue / 100}
              format="currency"
              icon={<TrendingUp className="w-5 h-5" />}
              trend="up"
              change={12.5}
            />
            <MetricCard
              label="Avg Revenue"
              value={stats.avgRevenue / 100}
              format="currency"
              icon={<DollarSign className="w-5 h-5" />}
              trend="neutral"
            />
            <MetricCard
              label="Total LTV"
              value={stats.totalLTV / 100}
              format="currency"
              icon={<Users className="w-5 h-5" />}
              trend="up"
              change={8.3}
            />
          </div>
        )}
        
        {/* Filters */}
        <GlassCard>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-trading-navy-400" />
                <Input
                  placeholder="Search by name, website, or industry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 glass border-trading-navy-700"
                />
              </div>
            </div>
            
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-[180px] glass border-trading-navy-700">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="w-[180px] glass border-trading-navy-700">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="mid-market">Mid-Market</SelectItem>
                <SelectItem value="smb">SMB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>
        
        {/* Companies Table */}
        <GlassCard>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-trading-navy-800 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-trading-navy-800 rounded w-1/4 animate-pulse" />
                    <div className="h-3 bg-trading-navy-800 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-trading-navy-800">
                    <TableHead className="text-trading-navy-300">Company</TableHead>
                    <TableHead className="text-trading-navy-300">Industry</TableHead>
                    <TableHead className="text-trading-navy-300">Tier</TableHead>
                    <TableHead className="text-trading-navy-300">Type</TableHead>
                    <TableHead className="text-trading-navy-300 text-right">Annual Revenue</TableHead>
                    <TableHead className="text-trading-navy-300 text-right">LTV</TableHead>
                    <TableHead className="text-trading-navy-300">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((company) => (
                    <TableRow
                      key={company.id}
                      onClick={() => handleRowClick(company.id)}
                      className="data-table-row cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-trading-navy-800 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-trading-blue-500" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{company.name}</div>
                            {company.website && (
                              <div className="flex items-center gap-1 text-xs text-trading-navy-400">
                                <ExternalLink className="w-3 h-3" />
                                {company.website.replace(/^https?:\/\//, '')}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-trading-navy-200">
                        {company.industry || '-'}
                      </TableCell>
                      <TableCell>
                        {company.tier && (
                          <StatusBadge
                            variant={getTierVariant(company.tier)}
                            label={company.tier.toUpperCase()}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {company.accountType && (
                          <StatusBadge
                            variant={getAccountTypeVariant(company.accountType)}
                            label={company.accountType.toUpperCase()}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        {company.annualRevenue ? formatCurrency(company.annualRevenue) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground">
                        {company.lifetimeValue ? formatCurrency(company.lifetimeValue) : '-'}
                      </TableCell>
                      <TableCell className="text-trading-navy-300">
                        {formatDate(company.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-trading-navy-600" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No companies found</h3>
              <p className="text-trading-navy-400 mb-4">
                {search || industry !== 'all' || tier !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first company'}
              </p>
              <Button className="gradient-blue">
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </div>
          )}
        </GlassCard>
        
        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-trading-navy-400">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.pagination.total)} of {data.pagination.total} companies
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="glass"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="glass"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {/* Performance Indicator */}
        {data && (
          <div className="text-center text-xs text-trading-navy-500">
            Query executed in {data.executionTime}ms
          </div>
        )}
      </div>
    </div>
  );
}
