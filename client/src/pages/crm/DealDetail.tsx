import { useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  Calendar,
  User,
  Building2,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  Percent,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Deal Detail Page - Comprehensive Deal View
 * 
 * Features:
 * - Deal information and metrics
 * - Stage progression timeline
 * - Related contact and company
 * - Win probability and revenue forecast
 * - Activity history
 * - Quick actions
 */

export default function DealDetail() {
  const [, params] = useRoute('/crm/deals/:id');
  const [, setLocation] = useLocation();
  const dealId = params?.id ? parseInt(params.id) : null;
  
  // Fetch deal data
  const { data: deal, isLoading } = trpc.crm.deals.getById.useQuery(
    { id: dealId! },
    { enabled: !!dealId }
  );
  
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
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get stage color
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-gray-100 text-gray-800',
      qualified: 'bg-blue-100 text-blue-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      'closed-won': 'bg-green-100 text-green-800',
      'closed-lost': 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };
  
  // Get stage progress
  const getStageProgress = (stage: string) => {
    const progress: Record<string, number> = {
      lead: 10,
      qualified: 30,
      proposal: 50,
      negotiation: 75,
      'closed-won': 100,
      'closed-lost': 0,
    };
    return progress[stage] || 0;
  };
  
  // Calculate deal age
  const getDealAge = (createdAt: Date | string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };
  
  // Calculate days until close
  const getDaysUntilClose = (expectedCloseDate: Date | string | null) => {
    if (!expectedCloseDate) return null;
    const days = Math.floor((new Date(expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Closes today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };
  
  // Stage timeline
  const stages = [
    { id: 'lead', label: 'Lead', icon: Target },
    { id: 'qualified', label: 'Qualified', icon: CheckCircle2 },
    { id: 'proposal', label: 'Proposal', icon: TrendingUp },
    { id: 'negotiation', label: 'Negotiation', icon: DollarSign },
    { id: 'closed-won', label: 'Closed Won', icon: CheckCircle2 },
  ];
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
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
  
  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1400px] mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deal Not Found</h3>
              <p className="text-gray-600 mb-4">The deal you're looking for doesn't exist</p>
              <Button onClick={() => setLocation('/crm/deals')}>
                Back to Pipeline
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const stageProgress = getStageProgress(deal.stage);
  const daysUntilClose = getDaysUntilClose(deal.expectedCloseDate);
  const weightedValue = Math.round((deal.value * deal.probability) / 100);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{deal.title}</h1>
                  <Badge className={getStageColor(deal.stage)}>
                    {deal.stage.toUpperCase().replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-gray-900">{formatCurrency(deal.value)}</span>
                    <span className="text-sm">deal value</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    <span className="font-semibold text-gray-900">{deal.probability}%</span>
                    <span className="text-sm">probability</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold text-gray-900">{formatCurrency(weightedValue)}</span>
                    <span className="text-sm">weighted</span>
                  </span>
                </div>
                
                {/* Stage Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Deal Progress</span>
                    <span className="text-sm text-gray-600">{stageProgress}%</span>
                  </div>
                  <Progress value={stageProgress} className="h-2" />
                </div>
                
                {/* Stage Timeline */}
                <div className="flex items-center gap-2">
                  {stages.map((stage, index) => {
                    const Icon = stage.icon;
                    const isActive = stage.id === deal.stage;
                    const isPast = stages.findIndex(s => s.id === deal.stage) > index;
                    
                    return (
                      <div key={stage.id} className="flex items-center">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                            isActive
                              ? 'bg-blue-100 text-blue-800'
                              : isPast
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {stage.label}
                        </div>
                        {index < stages.length - 1 && (
                          <div className={`w-8 h-0.5 ${isPast ? 'bg-green-300' : 'bg-gray-300'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.info('Edit coming soon')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.error('Delete coming soon')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deal Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(deal.value)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Weighted: {formatCurrency(weightedValue)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Probability</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deal.probability}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {deal.probability >= 75 ? 'High confidence' : deal.probability >= 50 ? 'Medium confidence' : 'Low confidence'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected Close</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(deal.expectedCloseDate)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {daysUntilClose || 'No date set'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deal Age</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getDealAge(deal.createdAt)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Created {formatDate(deal.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Deal Information & Related Entities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Deal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Title</div>
                <div className="font-medium">{deal.title}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <div className="font-medium">{deal.description || 'No description provided'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Stage</div>
                <Badge className={getStageColor(deal.stage)}>
                  {deal.stage.toUpperCase().replace('-', ' ')}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Source</div>
                <div className="font-medium">{deal.source || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Next Steps</div>
                <div className="font-medium">{deal.nextSteps || 'No next steps defined'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Loss Reason</div>
                <div className="font-medium text-red-600">
                  {deal.lossReason || (deal.stage === 'closed-lost' ? 'Not specified' : 'N/A')}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Related Contact & Company */}
          <div className="space-y-6">
            {/* Related Contact */}
            {deal.contact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Primary Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setLocation(`/crm/contacts/${deal.contactId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {deal.contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{deal.contact.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-3">
                          {deal.contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {deal.contact.email}
                            </span>
                          )}
                          {deal.contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {deal.contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Lead Score</div>
                      <div className="font-semibold text-lg">{deal.contact.leadScore}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Related Company */}
            {deal.company && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setLocation(`/crm/companies/${deal.companyId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-purple-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{deal.company.name}</div>
                        <div className="text-sm text-gray-600">
                          {deal.company.industry || 'Industry not specified'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-purple-100 text-purple-800">
                        {deal.company.tier?.toUpperCase() || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Win/Loss Analysis */}
            {deal.stage === 'closed-won' || deal.stage === 'closed-lost' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {deal.stage === 'closed-won' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {deal.stage === 'closed-won' ? 'Deal Won' : 'Deal Lost'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Closed Date</div>
                      <div className="font-medium">{formatDate(deal.closedAt)}</div>
                    </div>
                    {deal.stage === 'closed-lost' && deal.lossReason && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Loss Reason</div>
                        <div className="font-medium text-red-600">{deal.lossReason}</div>
                      </div>
                    )}
                    {deal.stage === 'closed-won' && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-800 font-medium">
                          🎉 Congratulations on closing this deal!
                        </div>
                        <div className="text-sm text-green-700 mt-1">
                          Revenue: {formatCurrency(deal.value)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => toast.info('Move to next stage coming soon')}
                  >
                    Move to Next Stage
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => toast.info('Schedule follow-up coming soon')}
                  >
                    Schedule Follow-up
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => toast.info('Send proposal coming soon')}
                  >
                    Send Proposal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
