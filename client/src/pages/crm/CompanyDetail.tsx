import { useMemo } from 'react';
import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Edit,
  Trash2,
  ExternalLink,
  Briefcase,
  Target,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { ActivityTimeline } from '@/components/ActivityTimeline';

/**
 * Company Detail 360° View
 * 
 * Comprehensive company profile with:
 * - Company information and metrics
 * - Related contacts list
 * - Related deals pipeline
 * - Revenue analytics
 * - Quick actions
 */

export default function CompanyDetail() {
  const [, params] = useRoute('/crm/companies/:id');
  const [, setLocation] = useLocation();
  const companyId = params?.id ? parseInt(params.id) : null;
  
  // Fetch company data
  const { data: company, isLoading } = trpc.crm.companies.getById.useQuery(
    { id: companyId! },
    { enabled: !!companyId }
  );
  
  // Fetch related contacts
  const { data: contactsData } = trpc.crm.contacts.list.useQuery({
    companyId: companyId!,
    page: 1,
    pageSize: 100,
  }, { enabled: !!companyId });
  
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
  
  // Get tier color
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      enterprise: 'bg-trading-red-500/20 text-trading-red-400 border border-trading-red-500/30',
      'mid-market': 'bg-trading-amber-500/20 text-trading-amber-400 border border-trading-amber-500/30',
      smb: 'bg-trading-green-500/20 text-trading-green-400 border border-trading-green-500/30',
    };
    return colors[tier] || 'bg-trading-navy-700 text-trading-navy-300 border border-trading-navy-600';
  };
  
  // Get account type color
  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-trading-green-500/20 text-trading-green-400 border border-trading-green-500/30',
      prospect: 'bg-trading-blue-500/20 text-trading-blue-400 border border-trading-blue-500/30',
      partner: 'bg-trading-amber-500/20 text-trading-amber-400 border border-trading-amber-500/30',
      competitor: 'bg-trading-red-500/20 text-trading-red-400 border border-trading-red-500/30',
    };
    return colors[type] || 'bg-trading-navy-700 text-trading-navy-300 border border-trading-navy-600';
  };
  
  // Calculate company metrics
  const metrics = useMemo(() => {
    if (!contactsData?.data) return null;
    
    const contacts = contactsData.data;
    const totalContacts = contacts.length;
    const activeContacts = contacts.filter(c => 
      c.lastActivityAt && 
      (Date.now() - new Date(c.lastActivityAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    ).length;
    const totalRevenue = contacts.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0);
    const avgHealthScore = contacts.length > 0
      ? Math.round(contacts.reduce((sum, c) => sum + c.healthScore, 0) / contacts.length)
      : 0;
    
    return {
      totalContacts,
      activeContacts,
      totalRevenue,
      avgHealthScore,
    };
  }, [contactsData]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
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
  
  if (!company) {
    return (
      <div className="min-h-screen bg-background grid-pattern p-6">
        <div className="max-w-[1400px] mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Not Found</h3>
              <p className="text-gray-600 mb-4">The company you're looking for doesn't exist</p>
              <Button onClick={() => setLocation('/crm/companies')}>
                Back to Companies
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background grid-pattern p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Company Avatar */}
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                
                {/* Company Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    <Badge className={getTierColor(company.tier)}>
                      {company.tier.toUpperCase()}
                    </Badge>
                    <Badge className={getAccountTypeColor(company.accountType)}>
                      {company.accountType.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-600">
                    {company.industry && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {company.industry}
                      </span>
                    )}
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-4 h-4" />
                        {company.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {company.city && company.state && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {company.city}, {company.state}
                      </span>
                    )}
                  </div>
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
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalContacts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activeContacts} active this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime value
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgHealthScore}/100</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Account health
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate(company.createdAt)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Account age
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Industry</div>
                <div className="font-medium">{company.industry || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Employee Count</div>
                <div className="font-medium">{company.employeeCount || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Annual Revenue</div>
                <div className="font-medium">
                  {company.annualRevenue ? formatCurrency(company.annualRevenue) : 'Not specified'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Website</div>
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div className="font-medium">Not specified</div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <div className="font-medium">{company.description || 'No description available'}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Address</div>
                <div className="font-medium">
                  {company.address || 'Not specified'}
                  {company.city && company.state && (
                    <div>{company.city}, {company.state} {company.postalCode}</div>
                  )}
                  {company.country && <div>{company.country}</div>}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Phone</div>
                <div className="font-medium">{company.phone || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Email</div>
                <div className="font-medium">{company.email || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Parent Company</div>
                <div className="font-medium">
                  {company.parentCompanyId ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => setLocation(`/crm/companies/${company.parentCompanyId}`)}
                    >
                      View Parent Company
                    </Button>
                  ) : (
                    'None'
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Timeline */}
        <ActivityTimeline
          companyId={company.id}
          companyName={company.name}
          deals={company.deals}
          createdAt={company.createdAt}
        />
        
        {/* Related Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Contacts ({contactsData?.data?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!contactsData?.data || contactsData.data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No contacts at this company yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactsData.data.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setLocation(`/crm/contacts/${contact.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-3">
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Lead Score</div>
                        <div className="font-semibold">{contact.leadScore}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Health</div>
                        <div className="font-semibold">{contact.healthScore}</div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {contact.lifecycleStage.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
