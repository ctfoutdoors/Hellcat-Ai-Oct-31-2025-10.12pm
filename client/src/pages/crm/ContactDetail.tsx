import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Briefcase,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ActivityTimeline } from '@/components/ActivityTimeline';

/**
 * Contact Detail 360° View
 * 
 * Comprehensive contact profile with:
 * - Key metrics (health score, lead score, LTV)
 * - Contact information
 * - Related company
 * - Related deals
 * - Related orders
 * - Activity timeline
 * - AI insights (placeholder)
 */

export default function ContactDetail() {
  const [, params] = useRoute('/crm/contacts/:id');
  const [, setLocation] = useLocation();
  const contactId = params?.id ? parseInt(params.id) : 0;
  
  // Fetch contact with all relations
  const { data, isLoading, error } = trpc.crm.contacts.getById.useQuery({
    id: contactId,
    include: {
      company: true,
      deals: true,
      orders: true,
      activities: true,
    },
  });
  
  const contact = data?.contact;
  
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
  
  // Get lifecycle stage color
  const getLifecycleColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-trading-navy-700 text-trading-navy-300 border border-trading-navy-600',
      mql: 'bg-trading-blue-500/20 text-trading-blue-400 border border-trading-blue-500/30',
      sql: 'bg-trading-blue-600/20 text-trading-blue-300 border border-trading-blue-600/30',
      opportunity: 'bg-trading-amber-500/20 text-trading-amber-400 border border-trading-amber-500/30',
      customer: 'bg-trading-green-500/20 text-trading-green-400 border border-trading-green-500/30',
      advocate: 'bg-trading-green-600/20 text-trading-green-300 border border-trading-green-600/30',
      churned: 'bg-trading-red-500/20 text-trading-red-400 border border-trading-red-500/30',
    };
    return colors[stage] || 'bg-trading-navy-700 text-trading-navy-300 border border-trading-navy-600';
  };
  
  // Get deal stage color
  const getDealStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospecting: 'bg-trading-navy-700 text-trading-navy-300 border border-trading-navy-600',
      qualification: 'bg-trading-blue-500/20 text-trading-blue-400 border border-trading-blue-500/30',
      proposal: 'bg-trading-blue-600/20 text-trading-blue-300 border border-trading-blue-600/30',
      negotiation: 'bg-trading-amber-500/20 text-trading-amber-400 border border-trading-amber-500/30',
      closed_won: 'bg-trading-green-500/20 text-trading-green-400 border border-trading-green-500/30',
      closed_lost: 'bg-trading-red-500/20 text-trading-red-400 border border-trading-red-500/30',
    };
    return colors[stage] || 'bg-trading-navy-700 text-trading-navy-300 border border-trading-navy-600';
  };
  
  // Handle back navigation
  const handleBack = () => {
    setLocation('/crm/contacts');
  };
  
  // Handle edit
  const handleEdit = () => {
    toast.info('Edit functionality coming soon');
  };
  
  // Handle delete
  const handleDelete = () => {
    toast.info('Delete functionality coming soon');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !contact) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
        <div className="max-w-[1400px] mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Not Found</h3>
              <p className="text-gray-600">{error?.message || 'The contact you are looking for does not exist.'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background grid-pattern p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Back Button */}
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contacts
        </Button>
        
        {/* Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-2xl">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* Info */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{contact.name}</h1>
                  <div className="flex items-center gap-4 text-gray-600 mb-3">
                    {contact.jobTitle && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {contact.jobTitle}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getLifecycleColor(contact.lifecycleStage)}>
                      {contact.lifecycleStage.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {contact.contactType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info('Send email coming soon')}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('Call coming soon')}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Metrics Bar */}
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Lead Score</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${contact.leadScore}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{contact.leadScore}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Health Score</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          contact.healthScore >= 80 ? 'bg-green-500' :
                          contact.healthScore >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${contact.healthScore}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{contact.healthScore}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Lifetime Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(contact.lifetimeValue || 0)}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Churn Risk</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{contact.churnProbability}%</span>
                  {contact.churnProbability > 50 ? (
                    <TrendingUp className="w-5 h-5 text-red-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {contact.email && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Email</div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Phone</div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {(contact.address || contact.city || contact.state) && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600 mb-1">Address</div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          {contact.address && <div>{contact.address}</div>}
                          {(contact.city || contact.state || contact.zipCode) && (
                            <div>
                              {contact.city}{contact.city && contact.state ? ', ' : ''}{contact.state} {contact.zipCode}
                            </div>
                          )}
                          {contact.country && <div>{contact.country}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Created</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(contact.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Last Activity</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(contact.lastActivityAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Related Deals */}
            {data.deals && data.deals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Deals ({data.deals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.deals.map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{deal.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getDealStageColor(deal.stage)}>
                              {deal.stage.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {deal.probability}% probability
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(deal.amount)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(deal.expectedCloseDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Related Orders */}
            {data.orders && data.orders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Recent Orders ({data.orders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Order #{order.orderNumber}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatDate(order.orderDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(order.totalAmount || 0)}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
          </div>
          
          {/* Right Column - Related & Insights */}
          <div className="space-y-6">
            
            {/* Related Company */}
            {data.company && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-lg text-gray-900">{data.company.name}</div>
                      {data.company.website && (
                        <a
                          href={data.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {data.company.website}
                        </a>
                      )}
                    </div>
                    
                    {data.company.industry && (
                      <div>
                        <div className="text-sm text-gray-600">Industry</div>
                        <div className="font-medium">{data.company.industry}</div>
                      </div>
                    )}
                    
                    {data.company.tier && (
                      <div>
                        <div className="text-sm text-gray-600">Tier</div>
                        <Badge variant="outline">{data.company.tier.toUpperCase()}</Badge>
                      </div>
                    )}
                    
                    {data.company.annualRevenue && (
                      <div>
                        <div className="text-sm text-gray-600">Annual Revenue</div>
                        <div className="font-medium">{formatCurrency(data.company.annualRevenue)}</div>
                      </div>
                    )}
                    
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation(`/crm/companies/${data.company.id}`)}>
                      View Company Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Activity Timeline */}
            <ActivityTimeline
              contactId={contact.id}
              contactName={contact.name}
              deals={contact.deals}
              orders={contact.orders}
              createdAt={contact.createdAt}
              lastActivity={contact.lastActivity}
            />
            
            {/* AI Insights Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">AI insights coming in Phase 4</p>
                </div>
              </CardContent>
            </Card>
            
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
