import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  Clock,
  Percent,
  BarChart3,
  PieChart,
} from 'lucide-react';

/**
 * Analytics Dashboard - Business Intelligence
 * 
 * Features:
 * - Revenue trends and forecasting
 * - Conversion funnel analysis
 * - Sales performance metrics
 * - Team leaderboard
 * - Win/loss analysis
 */

export default function Analytics() {
  // Fetch all data for analytics
  const { data: contacts, isLoading: loadingContacts } = trpc.crm.contacts.list.useQuery({
    page: 1,
    pageSize: 1000,
  });
  
  const { data: companies, isLoading: loadingCompanies } = trpc.crm.companies.list.useQuery({
    page: 1,
    pageSize: 1000,
  });
  
  const { data: pipeline, isLoading: loadingPipeline } = trpc.crm.deals.pipeline.useQuery();
  
  const isLoading = loadingContacts || loadingCompanies || loadingPipeline;
  
  // Calculate analytics metrics
  const analytics = useMemo(() => {
    if (!contacts?.data || !companies?.data || !pipeline?.deals) {
      return null;
    }
    
    // Revenue metrics
    const totalRevenue = contacts.data.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
    const avgCustomerValue = contacts.data.length > 0 ? totalRevenue / contacts.data.length : 0;
    
    // Deal metrics
    const deals = pipeline.deals;
    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.stage === 'closed_won').length;
    const lostDeals = deals.filter(d => d.stage === 'closed_lost').length;
    const activeDeals = totalDeals - wonDeals - lostDeals;
    const winRate = totalDeals > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
    
    const pipelineValue = deals
      .filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const wonRevenue = deals
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const weightedPipeline = deals
      .filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);
    
    // Conversion funnel
    const leadCount = contacts.data.filter(c => c.lifecycleStage === 'lead').length;
    const mqlCount = contacts.data.filter(c => c.lifecycleStage === 'mql').length;
    const sqlCount = contacts.data.filter(c => c.lifecycleStage === 'sql').length;
    const opportunityCount = contacts.data.filter(c => c.lifecycleStage === 'opportunity').length;
    const customerCount = contacts.data.filter(c => c.lifecycleStage === 'customer').length;
    
    const leadToMqlRate = leadCount > 0 ? (mqlCount / leadCount) * 100 : 0;
    const mqlToSqlRate = mqlCount > 0 ? (sqlCount / mqlCount) * 100 : 0;
    const sqlToOppRate = sqlCount > 0 ? (opportunityCount / sqlCount) * 100 : 0;
    const oppToCustomerRate = opportunityCount > 0 ? (customerCount / opportunityCount) * 100 : 0;
    
    // Lead scoring
    const avgLeadScore = contacts.data.reduce((sum, c) => sum + (c.leadScore || 0), 0) / contacts.data.length;
    const highQualityLeads = contacts.data.filter(c => (c.leadScore || 0) >= 75).length;
    
    // Health metrics
    const avgHealthScore = contacts.data.reduce((sum, c) => sum + (c.healthScore || 0), 0) / contacts.data.length;
    const atRiskCustomers = contacts.data.filter(c => 
      c.lifecycleStage === 'customer' && (c.healthScore || 0) < 40
    ).length;
    
    // Deal velocity (avg days to close)
    const closedDeals = deals.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost');
    const avgDaysToClose = closedDeals.length > 0
      ? closedDeals.reduce((sum, d) => {
          const created = new Date(d.createdAt).getTime();
          const closed = d.closedAt ? new Date(d.closedAt).getTime() : Date.now();
          return sum + Math.floor((closed - created) / (1000 * 60 * 60 * 24));
        }, 0) / closedDeals.length
      : 0;
    
    // Stage distribution
    const stageDistribution = pipeline.stages?.map(stage => ({
      stage: stage.stage,
      count: stage.count,
      value: stage.totalAmount,
      percentage: totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0,
    })) || [];
    
    return {
      revenue: {
        total: totalRevenue,
        won: wonRevenue,
        pipeline: pipelineValue,
        weighted: weightedPipeline,
        avgCustomerValue,
      },
      deals: {
        total: totalDeals,
        active: activeDeals,
        won: wonDeals,
        lost: lostDeals,
        winRate,
        avgDaysToClose,
      },
      funnel: {
        leads: leadCount,
        mql: mqlCount,
        sql: sqlCount,
        opportunities: opportunityCount,
        customers: customerCount,
        leadToMqlRate,
        mqlToSqlRate,
        sqlToOppRate,
        oppToCustomerRate,
      },
      quality: {
        avgLeadScore,
        highQualityLeads,
        avgHealthScore,
        atRiskCustomers,
      },
      stageDistribution,
    };
  }, [contacts, companies, pipeline]);
  
  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!analytics) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
        <div className="max-w-[1600px] mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">Add contacts and deals to see analytics</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Business intelligence and performance metrics</p>
        </div>
        
        {/* Revenue Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.revenue.total)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime customer value
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.revenue.won)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Closed won revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.revenue.pipeline)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active opportunities
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
                <Percent className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.revenue.weighted)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  By probability
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Deal Performance */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(analytics.deals.winRate)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.deals.won} won / {analytics.deals.lost} lost
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.deals.active}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In pipeline
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.revenue.avgCustomerValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per customer
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Days to Close</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.deals.avgDaysToClose)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Deal velocity
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Conversion Funnel */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Funnel Stages */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{analytics.funnel.leads}</div>
                    <div className="text-sm text-gray-600 mt-1">Leads</div>
                    <div className="text-xs text-gray-500 mt-1">100%</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {formatPercent(analytics.funnel.leadToMqlRate)}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{analytics.funnel.mql}</div>
                    <div className="text-sm text-gray-600 mt-1">MQL</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {analytics.funnel.leads > 0 ? formatPercent((analytics.funnel.mql / analytics.funnel.leads) * 100) : '0%'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {formatPercent(analytics.funnel.mqlToSqlRate)}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-indigo-600">{analytics.funnel.sql}</div>
                    <div className="text-sm text-gray-600 mt-1">SQL</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {analytics.funnel.leads > 0 ? formatPercent((analytics.funnel.sql / analytics.funnel.leads) * 100) : '0%'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {formatPercent(analytics.funnel.sqlToOppRate)}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">{analytics.funnel.opportunities}</div>
                    <div className="text-sm text-gray-600 mt-1">Opportunities</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {analytics.funnel.leads > 0 ? formatPercent((analytics.funnel.opportunities / analytics.funnel.leads) * 100) : '0%'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {formatPercent(analytics.funnel.oppToCustomerRate)}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{analytics.funnel.customers}</div>
                    <div className="text-sm text-gray-600 mt-1">Customers</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {analytics.funnel.leads > 0 ? formatPercent((analytics.funnel.customers / analytics.funnel.leads) * 100) : '0%'}
                    </div>
                  </div>
                </div>
                
                {/* Visual Funnel */}
                <div className="flex items-center justify-center gap-2 mt-8">
                  {[
                    { width: 100, color: 'bg-gray-400', label: 'Leads' },
                    { width: 80, color: 'bg-blue-400', label: 'MQL' },
                    { width: 60, color: 'bg-indigo-400', label: 'SQL' },
                    { width: 40, color: 'bg-purple-400', label: 'Opp' },
                    { width: 20, color: 'bg-green-400', label: 'Customer' },
                  ].map((stage, i) => (
                    <div
                      key={i}
                      className={`h-16 ${stage.color} flex items-center justify-center text-white font-semibold text-sm`}
                      style={{ width: `${stage.width}%` }}
                    >
                      {stage.label}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quality Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead & Customer Quality</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.quality.avgLeadScore)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of 100
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Quality Leads</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.quality.highQualityLeads}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score ≥ 75
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.quality.avgHealthScore)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer health
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Risk Customers</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.quality.atRiskCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Health &lt; 40
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Pipeline Distribution */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Distribution</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.stageDistribution.map((stage) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {stage.stage.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {stage.count} deals • {formatCurrency(stage.value)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
