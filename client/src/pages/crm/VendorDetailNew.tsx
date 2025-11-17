import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  ChevronDown,
  ChevronUp,
  Calendar,
  PhoneCall,
  MessageSquare,
  FileText,
  Send,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Paperclip,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { POCard } from "@/components/POCard";

export default function VendorDetailNew() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const vendorId = parseInt(id || "0");

  const { data: vendor, isLoading } = trpc.crm.vendors.get.useQuery({ id: vendorId });
  const { data: contacts } = trpc.crm.vendorContacts.list.useQuery({ vendorId });
  const { data: poData } = trpc.po.listByVendor.useQuery({ vendorId });
  const { data: activities } = trpc.crm.vendorActivities.list.useQuery({ vendorId });
  const { data: attachments } = trpc.crm.vendorAttachments.list.useQuery({ vendorId });
  const { data: actionItems } = trpc.crm.vendorActionItems.list.useQuery({ vendorId });
  const { data: healthAnalysis } = trpc.crm.analyzeVendorHealth.useQuery({ vendorId });

  const [expandedContacts, setExpandedContacts] = useState<Set<number>>(new Set());

  if (isLoading) {
    return <div className="p-8">Loading vendor...</div>;
  }

  if (!vendor) {
    return <div className="p-8">Vendor not found</div>;
  }

  const purchaseOrders = poData?.orders || [];
  const totalOrders = purchaseOrders.length;
  const totalSpent = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
  const activeOrders = purchaseOrders.filter(po => 
    po.status === 'pending' || po.status === 'confirmed' || po.status === 'shipped'
  ).length;

  const toggleContact = (contactId: number) => {
    const newExpanded = new Set(expandedContacts);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedContacts(newExpanded);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'phone_call': return <PhoneCall className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'letter_in':
      case 'letter_out': return <Send className="h-4 w-4" />;
      case 'fax_in':
      case 'fax_out': return <FileText className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <Minus className="h-5 w-5 text-yellow-500" />;
    return <TrendingDown className="h-5 w-5 text-red-500" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/crm/vendors")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{vendor.companyName}</h1>
                  <Badge variant={vendor.active ? "default" : "secondary"}>
                    {vendor.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Vendor #{vendor.vendorNumber}</span>
                  {vendor.customerNumber && (
                    <>
                      <span>•</span>
                      <span>Customer #{vendor.customerNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{activeOrders}</div>
                <p className="text-xs text-muted-foreground">Active Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{contacts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Contacts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Relationship Health */}
            {healthAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getHealthIcon(healthAnalysis.score)}
                    Relationship Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className={`text-2xl font-bold ${getHealthColor(healthAnalysis.score)}`}>
                      {healthAnalysis.score}/100
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        healthAnalysis.score >= 80 ? 'bg-green-500' :
                        healthAnalysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${healthAnalysis.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{healthAnalysis.summary}</p>
                  
                  {healthAnalysis.strengths && healthAnalysis.strengths.length > 0 && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                      <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-300">Strengths</h4>
                      <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
                        {healthAnalysis.strengths.map((strength: string, i: number) => (
                          <li key={i}>✓ {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {healthAnalysis.concerns && healthAnalysis.concerns.length > 0 && (
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
                      <h4 className="font-semibold text-sm mb-2 text-yellow-700 dark:text-yellow-300">Concerns</h4>
                      <ul className="text-sm space-y-1 text-yellow-600 dark:text-yellow-400">
                        {healthAnalysis.concerns.map((concern: string, i: number) => (
                          <li key={i}>⚠ {concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {healthAnalysis.recommendations && healthAnalysis.recommendations.length > 0 && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                      <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-300">AI Recommendations</h4>
                      <ul className="text-sm space-y-1 text-blue-600 dark:text-blue-400">
                        {healthAnalysis.recommendations.map((rec: string, i: number) => (
                          <li key={i}>→ {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Contacts ({contacts?.length || 0})</CardTitle>
                <CardDescription>Key contacts at this vendor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {contacts?.map((contact) => (
                  <Collapsible
                    key={contact.id}
                    open={expandedContacts.has(contact.id)}
                    onOpenChange={() => toggleContact(contact.id)}
                  >
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold">{contact.name}</div>
                              <div className="text-sm text-muted-foreground">{contact.title}</div>
                            </div>
                          </div>
                          {expandedContacts.has(contact.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4 space-y-2">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                          {contact.mobile && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>Mobile: {contact.mobile}</span>
                            </div>
                          )}
                          {contact.notes && (
                            <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                              {contact.notes}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>All interactions and communications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities?.map((activity: any) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          {getActivityIcon(activity.activityType)}
                        </div>
                        <div className="w-px flex-1 bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{activity.subject}</p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {activity.activityType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(activity.activityDate).toLocaleString()}</span>
                          {activity.duration && <span>• {activity.duration} min</span>}
                          {activity.outcome && <span>• {activity.outcome}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments ({attachments?.length || 0})
                </CardTitle>
                <CardDescription>Documents and files related to this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments?.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.category} • {new Date(attachment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Vendor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.contactName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Primary Contact</p>
                    <p className="text-sm">{vendor.contactName}</p>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${vendor.email}`} className="text-sm text-primary hover:underline">
                      {vendor.email}
                    </a>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${vendor.phone}`} className="text-sm text-primary hover:underline">
                      {vendor.phone}
                    </a>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {vendor.website}
                    </a>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{vendor.address}</p>
                  </div>
                )}
                {vendor.paymentTerms && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                    <p className="text-sm">{vendor.paymentTerms}</p>
                  </div>
                )}
                {vendor.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{vendor.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>Next Actions</CardTitle>
                <CardDescription>Pending tasks and follow-ups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {actionItems?.filter((item: any) => item.status !== 'completed').map((item: any) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <p className="font-semibold text-sm">{item.title}</p>
                      </div>
                      <Badge variant={getPriorityColor(item.priority) as any}>
                        {item.priority}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {item.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Assigned to User #{item.assignedTo}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Purchase Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {purchaseOrders.slice(0, 5).map((po: any) => (
                  <POCard key={po.id} po={po} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
