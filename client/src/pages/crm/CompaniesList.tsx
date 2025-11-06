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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

/**
 * Companies List Page - B2B Account Management
 * 
 * Optimized for speed with patterns from Contacts List
 */

export default function CompaniesList() {
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
  
  // Get tier color
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      enterprise: 'bg-purple-100 text-purple-800',
      'mid-market': 'bg-blue-100 text-blue-800',
      smb: 'bg-green-100 text-green-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };
  
  // Get account type color
  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-green-100 text-green-800',
      prospect: 'bg-blue-100 text-blue-800',
      partner: 'bg-purple-100 text-purple-800',
      competitor: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };
  
  // Handle row click
  const handleRowClick = (companyId: number) => {
    setLocation(`/crm/companies/${companyId}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">Manage your business accounts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active accounts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Annual revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.avgRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per company
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total LTV</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalLTV)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime value
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, website, or industry..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Industry Filter */}
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Tier Filter */}
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="mid-market">Mid-Market</SelectItem>
                  <SelectItem value="smb">SMB</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="annualRevenue">Revenue</SelectItem>
                  <SelectItem value="lifetimeValue">Lifetime Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Companies</h3>
                <p className="text-gray-600">{error.message}</p>
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies Found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first company</p>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Annual Revenue</TableHead>
                      <TableHead>LTV</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((company) => (
                      <TableRow
                        key={company.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(company.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{company.name}</div>
                              {company.website && (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {new URL(company.website).hostname}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.industry || '-'}
                        </TableCell>
                        <TableCell>
                          {company.tier ? (
                            <Badge className={getTierColor(company.tier)}>
                              {company.tier.toUpperCase()}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getAccountTypeColor(company.accountType)}>
                            {company.accountType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {company.annualRevenue ? formatCurrency(company.annualRevenue) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(company.lifetimeValue || 0)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(company.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info('Quick actions coming soon');
                            }}
                          >
                            Actions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.pagination.total)} of {data.pagination.total} companies
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === data.pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Query Performance */}
        {data?.meta && (
          <div className="text-xs text-gray-500 text-center">
            Query executed in {data.meta.queryTime}ms
          </div>
        )}
        
      </div>
    </div>
  );
}
