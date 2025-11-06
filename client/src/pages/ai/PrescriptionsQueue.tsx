import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

/**
 * AI Prescriptions Queue
 * 
 * Actionable recommendations with:
 * - Approve/Reject workflow
 * - Impact estimates
 * - Priority ranking
 * - Automatic execution (future)
 */

// Generate prescriptions from contact data
function generatePrescriptions(contacts: any[]) {
  const prescriptions: any[] = [];
  
  contacts.forEach((contact) => {
    // High churn risk → Retention campaign
    if (contact.churnProbability > 70) {
      prescriptions.push({
        id: `churn-${contact.id}`,
        contactId: contact.id,
        contactName: contact.name,
        type: 'retention',
        action: 'Send retention offer',
        description: `${contact.name} has ${contact.churnProbability}% churn risk. Send personalized retention offer with 20% discount.`,
        impact: {
          revenueAtRisk: contact.lifetimeValue || 0,
          successProbability: 65,
          estimatedCost: 2000,
        },
        priority: contact.churnProbability >= 80 ? 'critical' : 'high',
        status: 'pending',
        createdAt: new Date(),
      });
    }
    
    // High lead score + opportunity → Follow up
    if (contact.leadScore > 75 && contact.lifecycleStage === 'opportunity') {
      prescriptions.push({
        id: `followup-${contact.id}`,
        contactId: contact.id,
        contactName: contact.name,
        type: 'sales',
        action: 'Schedule demo call',
        description: `${contact.name} has ${contact.leadScore} lead score. Schedule product demo within 48 hours.`,
        impact: {
          potentialRevenue: contact.lifetimeValue || 50000,
          successProbability: 75,
          estimatedCost: 0,
        },
        priority: 'high',
        status: 'pending',
        createdAt: new Date(),
      });
    }
    
    // Good health + recent activity → Upsell
    if (
      contact.healthScore > 70 &&
      contact.lifecycleStage === 'customer' &&
      contact.lastActivityAt &&
      (Date.now() - new Date(contact.lastActivityAt).getTime()) < 14 * 24 * 60 * 60 * 1000
    ) {
      prescriptions.push({
        id: `upsell-${contact.id}`,
        contactId: contact.id,
        contactName: contact.name,
        type: 'upsell',
        action: 'Propose premium upgrade',
        description: `${contact.name} has ${contact.healthScore} health score and recent engagement. Propose premium tier upgrade.`,
        impact: {
          potentialRevenue: Math.round((contact.lifetimeValue || 0) * 0.3),
          successProbability: 55,
          estimatedCost: 500,
        },
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(),
      });
    }
    
    // No recent activity → Re-engagement
    if (
      contact.lastActivityAt &&
      (Date.now() - new Date(contact.lastActivityAt).getTime()) > 60 * 24 * 60 * 60 * 1000 &&
      contact.lifecycleStage === 'customer'
    ) {
      prescriptions.push({
        id: `reengage-${contact.id}`,
        contactId: contact.id,
        contactName: contact.name,
        type: 'engagement',
        action: 'Send re-engagement email',
        description: `${contact.name} hasn't been active for 60+ days. Send personalized re-engagement campaign.`,
        impact: {
          revenueAtRisk: Math.round((contact.lifetimeValue || 0) * 0.5),
          successProbability: 40,
          estimatedCost: 100,
        },
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(),
      });
    }
  });
  
  // Sort by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return prescriptions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export default function PrescriptionsQueue() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>('all');
  
  // Fetch contacts to generate prescriptions
  const { data: contactsData, isLoading } = trpc.crm.contacts.list.useQuery({
    page: 1,
    pageSize: 100,
  });
  
  // Generate prescriptions
  const allPrescriptions = useMemo(() => {
    if (!contactsData?.data) return [];
    return generatePrescriptions(contactsData.data);
  }, [contactsData]);
  
  // Filter prescriptions
  const prescriptions = useMemo(() => {
    if (filter === 'all') return allPrescriptions;
    return allPrescriptions.filter(p => p.type === filter);
  }, [allPrescriptions, filter]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const pending = allPrescriptions.filter(p => p.status === 'pending').length;
    const totalImpact = allPrescriptions.reduce((sum, p) => 
      sum + (p.impact.potentialRevenue || p.impact.revenueAtRisk || 0), 0
    );
    const avgSuccessRate = allPrescriptions.length > 0
      ? Math.round(allPrescriptions.reduce((sum, p) => sum + p.impact.successProbability, 0) / allPrescriptions.length)
      : 0;
    const critical = allPrescriptions.filter(p => p.priority === 'critical').length;
    
    return { pending, totalImpact, avgSuccessRate, critical };
  }, [allPrescriptions]);
  
  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };
  
  // Get type icon
  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      retention: AlertCircle,
      sales: Phone,
      upsell: TrendingUp,
      engagement: Mail,
    };
    return icons[type] || Lightbulb;
  };
  
  // Handle approve
  const handleApprove = (prescriptionId: string) => {
    toast.success('Prescription approved - execution coming soon');
  };
  
  // Handle reject
  const handleReject = (prescriptionId: string) => {
    toast.info('Prescription rejected');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
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
  
  return (
    <div className="min-h-screen bg-background grid-pattern p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Prescriptions</h1>
            <p className="text-gray-600 mt-1">Recommended actions for maximum impact</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="retention">Retention</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="upsell">Upsell</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalImpact)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Potential revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Predicted probability
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Actions</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Urgent attention needed
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Prescriptions List */}
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prescriptions</h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'Add contacts to generate AI recommendations'
                    : 'No prescriptions for this filter'}
                </p>
              </CardContent>
            </Card>
          ) : (
            prescriptions.map((prescription) => {
              const TypeIcon = getTypeIcon(prescription.type);
              
              return (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {prescription.action}
                            </h3>
                            <Badge className={getPriorityColor(prescription.priority)}>
                              {prescription.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {prescription.type}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">
                            {prescription.description}
                          </p>
                          
                          {/* Impact Metrics */}
                          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Impact</div>
                              <div className="font-semibold text-gray-900">
                                {formatCurrency(
                                  prescription.impact.potentialRevenue || 
                                  prescription.impact.revenueAtRisk || 
                                  0
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                              <div className="font-semibold text-gray-900">
                                {prescription.impact.successProbability}%
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Cost</div>
                              <div className="font-semibold text-gray-900">
                                {formatCurrency(prescription.impact.estimatedCost)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Contact Link */}
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-3 p-0"
                            onClick={() => setLocation(`/crm/contacts/${prescription.contactId}`)}
                          >
                            View {prescription.contactName}
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(prescription.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(prescription.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        
      </div>
    </div>
  );
}
