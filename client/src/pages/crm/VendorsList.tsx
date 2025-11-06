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
  Package,
  TrendingUp,
  Factory,
  DollarSign,
  AlertCircle,
  Star,
  Truck,
  FileText,
  Clock,
} from 'lucide-react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

/**
 * Vendors List - Dedicated view for vendor/supplier management
 * 
 * Features:
 * - Performance ratings (quality, delivery, price)
 * - Total spend and order metrics
 * - Contract management (start/end dates, renewals)
 * - Compliance tracking (certifications, insurance)
 * - Quick actions: Create PO, View Products, Contact
 */
export default function VendorsList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [vendorType, setVendorType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  // Fetch vendors
  const { data, isLoading, error } = trpc.crm.vendors.list.useQuery({
    search: search || undefined,
    vendorType: vendorType as any || undefined,
    status: status as any || undefined,
    page,
    pageSize: 50,
    sortBy: 'totalSpend',
    sortOrder: 'desc',
  });

  const vendors = data?.vendors || [];
  const stats = data?.stats || {
    total: 0,
    totalSpend: 0,
    avgQualityRating: 0,
    avgDeliveryRating: 0,
  };

  // Calculate vendor-specific metrics
  const metrics = useMemo(() => {
    const activeVendors = vendors.filter(v => v.status === 'active').length;
    const topRated = vendors.filter(v => v.overallRating && v.overallRating >= 80).length;
    const needsRenewal = vendors.filter(v => {
      if (!v.contractEndDate) return false;
      const daysUntilExpiry = Math.floor(
        (new Date(v.contractEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
    }).length;
    
    return {
      total: stats.total,
      totalSpend: stats.totalSpend,
      avgQualityRating: stats.avgQualityRating,
      avgDeliveryRating: stats.avgDeliveryRating,
      activeVendors,
      topRated,
      needsRenewal,
    };
  }, [vendors, stats]);

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get rating color
  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'text-gray-400';
    if (rating >= 80) return 'text-green-400';
    if (rating >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <StatusBadge variant="success">Active</StatusBadge>;
      case 'inactive':
        return <StatusBadge variant="default">Inactive</StatusBadge>;
      case 'pending':
        return <StatusBadge variant="warning">Pending</StatusBadge>;
      case 'suspended':
        return <StatusBadge variant="error">Suspended</StatusBadge>;
      default:
        return <StatusBadge variant="default">{status}</StatusBadge>;
    }
  };

  // Get vendor type badge
  const getVendorTypeBadge = (type: string) => {
    switch (type) {
      case 'manufacturer':
        return <StatusBadge variant="info" icon={Factory}>Manufacturer</StatusBadge>;
      case 'supplier':
        return <StatusBadge variant="warning" icon={Package}>Supplier</StatusBadge>;
      case 'service':
        return <StatusBadge variant="default">Service</StatusBadge>;
      case 'logistics':
        return <StatusBadge variant="info" icon={Truck}>Logistics</StatusBadge>;
      case 'technology':
        return <StatusBadge variant="success">Technology</StatusBadge>;
      default:
        return <StatusBadge variant="default">{type}</StatusBadge>;
    }
  };

  // Check if contract is expiring soon
  const isContractExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Factory className="h-8 w-8 text-purple-400" />
              Vendors
              <LiveIndicator />
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your supplier relationships and track vendor performance
            </p>
          </div>
          <Button onClick={() => setLocation('/crm/vendors/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Vendors"
            value={metrics.total.toLocaleString()}
            icon={Factory}
            trend={0}
            iconColor="text-purple-400"
          />
          <MetricCard
            title="Total Spend"
            value={formatCurrency(metrics.totalSpend)}
            icon={DollarSign}
            trend={0}
            iconColor="text-green-400"
          />
          <MetricCard
            title="Avg Quality"
            value={`${Math.round(metrics.avgQualityRating)}%`}
            icon={Star}
            trend={0}
            iconColor="text-yellow-400"
          />
          <MetricCard
            title="Needs Renewal"
            value={metrics.needsRenewal.toLocaleString()}
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
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={vendorType} onValueChange={setVendorType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="logistics">Logistics</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
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

        {/* Vendors List */}
        <GlassCard>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading vendors...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">Error loading vendors</p>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No vendors found</p>
              <Button onClick={() => setLocation('/crm/vendors/new')} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Vendor
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground border-b border-border/50">
                <div className="col-span-3">Vendor</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Total Spend</div>
                <div className="col-span-2">Rating</div>
                <div className="col-span-2">Contract</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-accent"
                  onClick={() => setLocation(`/crm/vendors/${vendor.id}`)}
                >
                  {/* Vendor Info */}
                  <div className="col-span-3">
                    <div className="font-medium flex items-center gap-2">
                      {vendor.name}
                      {vendor.overallRating && vendor.overallRating >= 80 && (
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{vendor.contactName}</div>
                    {getStatusBadge(vendor.status)}
                  </div>

                  {/* Type */}
                  <div className="col-span-2 flex items-center">
                    {getVendorTypeBadge(vendor.vendorType)}
                  </div>

                  {/* Total Spend */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className="font-medium text-green-400">
                        {formatCurrency(vendor.totalSpend || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vendor.totalOrders || 0} orders
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className={`font-medium ${getRatingColor(vendor.overallRating)}`}>
                        {vendor.overallRating || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Q: {vendor.qualityRating || 0}% | D: {vendor.deliveryRating || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Contract */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      {vendor.contractEndDate ? (
                        <>
                          <div className="text-sm">
                            {formatDate(vendor.contractEndDate)}
                          </div>
                          {isContractExpiringSoon(vendor.contractEndDate) && (
                            <StatusBadge variant="warning" icon={Clock}>
                              Expiring Soon
                            </StatusBadge>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">No contract</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${vendor.email}`;
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    {vendor.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${vendor.phone}`;
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
        {!isLoading && vendors.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, stats.total)} of {stats.total} vendors
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
                disabled={vendors.length < 50}
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
