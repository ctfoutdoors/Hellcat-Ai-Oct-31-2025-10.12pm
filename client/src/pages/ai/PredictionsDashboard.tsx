import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

/**
 * AI Predictions Dashboard
 * 
 * Real-time intelligence with:
 * - Churn risk predictions
 * - Deal probability forecasts
 * - Next purchase timing
 * - Revenue forecasts
 * 
 * Uses actual contact data to generate predictions
 */

export default function PredictionsDashboard() {
  const [, setLocation] = useLocation();
  
  // Fetch all contacts for predictions
  const { data: contactsData, isLoading } = trpc.crm.contacts.list.useQuery({
    page: 1,
    pageSize: 100,
  });
  
  // Generate predictions from contact data
  const predictions = useMemo(() => {
    if (!contactsData?.data) return null;
    
    const contacts = contactsData.data;
    
    // High churn risk contacts (churnProbability > 60)
    const highChurnRisk = contacts
      .filter(c => c.churnProbability > 60)
      .sort((a, b) => b.churnProbability - a.churnProbability)
      .slice(0, 10);
    
    // High value at-risk (high LTV + high churn)
    const atRiskRevenue = contacts
      .filter(c => c.churnProbability > 50 && (c.lifetimeValue || 0) > 100000)
      .reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
    
    // Likely to close deals (high lead score + opportunity stage)
    const hotLeads = contacts
      .filter(c => c.leadScore > 70 && c.lifecycleStage === 'opportunity')
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, 10);
    
    // Predicted next purchases (customers with good health, last activity recent)
    const nextPurchases = contacts
      .filter(c => 
        c.lifecycleStage === 'customer' && 
        c.healthScore > 60 &&
        c.lastActivityAt &&
        (Date.now() - new Date(c.lastActivityAt).getTime()) < 30 * 24 * 60 * 60 * 1000 // 30 days
      )
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 10);
    
    // Calculate aggregate stats
    const avgChurnRisk = contacts.reduce((sum, c) => sum + c.churnProbability, 0) / contacts.length;
    const totalAtRisk = contacts.filter(c => c.churnProbability > 60).length;
    const predictedRevenue = hotLeads.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
    
    return {
      highChurnRisk,
      atRiskRevenue,
      hotLeads,
      nextPurchases,
      avgChurnRisk: Math.round(avgChurnRisk),
      totalAtRisk,
      predictedRevenue,
    };
  }, [contactsData]);
  
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
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get risk level
  const getRiskLevel = (probability: number): { label: string; color: string; icon: any } => {
    if (probability >= 80) return { label: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (probability >= 60) return { label: 'High', color: 'bg-orange-100 text-orange-800', icon: TrendingUp };
    if (probability >= 40) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: TrendingDown };
    return { label: 'Low', color: 'bg-green-100 text-green-800', icon: TrendingDown };
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }
  
  if (!predictions) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">Add contacts to generate predictions</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Predictions</h1>
            <p className="text-gray-600 mt-1">Real-time intelligence and forecasting</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast.info('Refresh coming soon')}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Churn Risk</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{predictions.avgChurnRisk}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all contacts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At-Risk Contacts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{predictions.totalAtRisk}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Churn risk &gt; 60%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At-Risk Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(predictions.atRiskRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                High-value customers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predicted Revenue</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(predictions.predictedRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From hot leads
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* High Churn Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              High Churn Risk Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.highChurnRisk.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingDown className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No high-risk contacts - great job!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Churn Probability</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.highChurnRisk.map((contact) => {
                    const risk = getRiskLevel(contact.churnProbability);
                    const RiskIcon = risk.icon;
                    
                    return (
                      <TableRow key={contact.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{contact.name}</div>
                            <div className="text-sm text-gray-600">{contact.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={risk.color}>
                            <RiskIcon className="w-3 h-3 mr-1" />
                            {risk.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-20">
                                <div
                                  className="h-full bg-red-500 rounded-full"
                                  style={{ width: `${contact.churnProbability}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-semibold">{contact.churnProbability}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(contact.lifetimeValue || 0)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(contact.lastActivityAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
                          >
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Hot Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Hot Leads - Likely to Close
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.hotLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hot leads at the moment</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lead Score</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Potential Value</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.hotLeads.map((contact) => (
                    <TableRow key={contact.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-600">{contact.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-20">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${contact.leadScore}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-semibold">{contact.leadScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800">
                          {contact.lifecycleStage.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(contact.lifetimeValue || 0)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(contact.lastActivityAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
                        >
                          View
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Next Purchase Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Predicted Next Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.nextPurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No purchase predictions available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Avg Purchase</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Predicted Timing</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.nextPurchases.map((contact) => {
                    // Estimate next purchase timing based on last activity
                    const daysSinceActivity = contact.lastActivityAt
                      ? Math.floor((Date.now() - new Date(contact.lastActivityAt).getTime()) / (24 * 60 * 60 * 1000))
                      : 999;
                    const predictedDays = Math.max(7, 30 - daysSinceActivity);
                    
                    return (
                      <TableRow key={contact.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{contact.name}</div>
                            <div className="text-sm text-gray-600">{contact.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-20">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${contact.healthScore}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-semibold">{contact.healthScore}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Math.round((contact.lifetimeValue || 0) / 3))}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(contact.lastActivityAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {predictedDays} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
                          >
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
