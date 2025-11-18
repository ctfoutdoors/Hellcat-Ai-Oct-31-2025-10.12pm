import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  DollarSign,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { LogEmailDialog } from "@/components/LogEmailDialog";
import { EmailLogsTimeline } from "@/components/EmailLogsTimeline";
import { CalendarEventsTimeline } from "@/components/CalendarEventsTimeline";
import { RelationshipHealth } from "@/components/crm/RelationshipHealth";
import { NextActions } from "@/components/crm/NextActions";
import { AIRecommendations } from "@/components/crm/AIRecommendations";

export default function LeadDetail() {
  const [, params] = useRoute("/crm/leads/:id");
  const [, setLocation] = useLocation();
  const leadId = params?.id ? parseInt(params.id) : 0;
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const { data, isLoading, error } = trpc.crm.leads.get.useQuery(
    { id: leadId },
    { enabled: leadId > 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Lead not found</h2>
          <Button
            variant="outline"
            onClick={() => setLocation("/crm/leads")}
            className="mt-4"
          >
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const { lead, activities } = data;

  const displayName = lead.companyName || 
    `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
    'Unknown Lead';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500",
      contacted: "bg-purple-500",
      qualified: "bg-yellow-500",
      negotiating: "bg-orange-500",
      won: "bg-green-500",
      lost: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/crm/leads")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <Badge variant="secondary" className={getStatusColor(lead.status)}>
                {lead.status}
              </Badge>
              {lead.leadType && (
                <Badge variant="outline">{lead.leadType}</Badge>
              )}
            </div>
            {lead.title && (
              <p className="text-muted-foreground">{lead.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${lead.estimatedValue ? lead.estimatedValue.toLocaleString() : '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Source</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lead.source || 'Unknown'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modular CRM Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <RelationshipHealth entityType="lead" entityId={leadId} />
        <NextActions entityType="lead" entityId={leadId} />
        <AIRecommendations entityType="lead" entityId={leadId} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.companyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.companyName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Details */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="secondary" className={`ml-2 ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </Badge>
                </div>
                {lead.leadType && (
                  <div>
                    <span className="text-sm font-medium">Type:</span>
                    <span className="text-sm ml-2">{lead.leadType}</span>
                  </div>
                )}
                {lead.source && (
                  <div>
                    <span className="text-sm font-medium">Source:</span>
                    <span className="text-sm ml-2">{lead.source}</span>
                  </div>
                )}
                {lead.estimatedValue && (
                  <div>
                    <span className="text-sm font-medium">Estimated Value:</span>
                    <span className="text-sm ml-2">${lead.estimatedValue.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity Timeline</CardTitle>
                <Button onClick={() => setShowEmailDialog(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Log Email
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Logs Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Email Communications</h3>
                <EmailLogsTimeline
                  emails={[]}
                  entityType="lead"
                  entityId={leadId}
                />
              </div>

              {/* Calendar Events Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Meetings & Events</h3>
                <CalendarEventsTimeline
                  events={[]}
                  entityType="lead"
                  entityId={leadId}
                />
              </div>

              {/* Legacy Activities Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Other Activities</h3>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activities recorded</p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                        <div className="flex-1">
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.activityDate ? new Date(activity.activityDate).toLocaleString() : 'N/A'}
                          </div>
                          {activity.description && (
                            <div className="text-sm mt-1">{activity.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Email Dialog */}
      <LogEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        entityType="lead"
        entityId={leadId}
        entityName={displayName}
      />
    </div>
  );
}
