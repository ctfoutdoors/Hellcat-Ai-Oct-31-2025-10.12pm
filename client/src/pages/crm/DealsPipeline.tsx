import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  DollarSign,
  Target,
  TrendingUp,
  AlertCircle,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

/**
 * Deals Pipeline - Kanban Board View
 * 
 * Visual sales pipeline with drag-and-drop (Phase 3)
 * For now: Static column view with deal cards
 */

const PIPELINE_STAGES = [
  { id: 'prospecting', label: 'Prospecting', color: 'bg-gray-100' },
  { id: 'qualification', label: 'Qualification', color: 'bg-blue-100' },
  { id: 'proposal', label: 'Proposal', color: 'bg-indigo-100' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-100' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100' },
];

export default function DealsPipeline() {
  const [, setLocation] = useLocation();
  // Fetch pipeline data
  const { data, isLoading, error } = trpc.crm.deals.pipeline.useQuery();
  
  // Calculate summary stats
  const stats = useMemo(() => {
    if (!data?.stages) return null;
    
    const totalDeals = data.stages.reduce((sum, stage) => sum + stage.count, 0);
    const totalValue = data.stages.reduce((sum, stage) => sum + stage.totalAmount, 0);
    const avgDealSize = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;
    const weightedValue = data.stages.reduce((sum, stage) => sum + stage.weightedAmount, 0);
    
    return {
      totalDeals,
      totalValue,
      avgDealSize,
      weightedValue,
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
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get probability color
  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-blue-600';
    if (probability >= 25) return 'text-yellow-600';
    return 'text-gray-600';
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1800px] mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Pipeline</h3>
              <p className="text-gray-600">{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="text-gray-600 mt-1">Track deals through your sales process</p>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDeals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active opportunities
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total potential
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.weightedValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  By probability
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.avgDealSize)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per opportunity
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Pipeline Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageData = data?.stages?.find(s => s.stage === stage.id);
            const deals = data?.deals?.filter(d => d.stage === stage.id) || [];
            
            return (
              <Card key={stage.id} className="flex flex-col">
                <CardHeader className={`${stage.color} border-b`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {stageData?.count || 0}
                    </Badge>
                  </div>
                  {stageData && (
                    <div className="text-xs font-medium text-gray-700 mt-2">
                      {formatCurrency(stageData.totalAmount)}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[600px]">
                  {deals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No deals
                    </div>
                  ) : (
                    deals.map((deal) => (
                      <Card
                        key={deal.id}
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/crm/deals/${deal.id}`)}
                      >
                        <div className="space-y-2">
                          <div className="font-medium text-sm text-gray-900 line-clamp-2">
                            {deal.name}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(deal.amount)}
                            </span>
                            <span className={`text-xs font-semibold ${getProbabilityColor(deal.probability)}`}>
                              {deal.probability}%
                            </span>
                          </div>
                          
                          {deal.contact && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <User className="w-3 h-3" />
                              <span className="truncate">{deal.contact.name}</span>
                            </div>
                          )}
                          
                          {deal.expectedCloseDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(deal.expectedCloseDate)}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
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
