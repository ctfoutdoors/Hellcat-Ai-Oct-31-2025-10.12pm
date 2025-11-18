import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, DollarSign, Calendar, User, CheckSquare } from "lucide-react";
import { useLocation } from "wouter";
import { ScheduleMeetingDialog } from "@/components/ScheduleMeetingDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { ConvertLeadDialog } from "@/components/ConvertLeadDialog";
import { LeadHoverCard } from "@/components/LeadHoverCard";
import { RadialContextMenu } from "@/components/RadialContextMenu";
import { toast } from "sonner";

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-purple-500" },
  { value: "qualified", label: "Qualified", color: "bg-yellow-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-orange-500" },
  { value: "won", label: "Won", color: "bg-green-500" },
  { value: "lost", label: "Lost", color: "bg-gray-500" },
];

export default function Leads() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [leadType, setLeadType] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  // Radial menu state
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const [radialMenuPosition, setRadialMenuPosition] = useState({ x: 0, y: 0 });

  const { data: allLeads, isLoading } = trpc.crm.leads.list.useQuery({
    search: search || undefined,
    leadType: leadType !== "all" ? (leadType as any) : undefined,
    pageSize: 100,
  });

  const utils = trpc.useUtils();
  const updateStatus = trpc.crm.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.crm.leads.list.invalidate();
    },
  });
  
  // Radial menu handlers
  const handleContextMenu = (e: React.MouseEvent, lead: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLead(lead);
    setRadialMenuPosition({ x: e.clientX, y: e.clientY });
    setRadialMenuOpen(true);
  };
  
  const handleDoubleClick = (e: React.MouseEvent, lead: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLead(lead);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setRadialMenuPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setRadialMenuOpen(true);
  };
  
  const handleRadialAction = (action: string) => {
    if (!selectedLead) return;
    
    switch (action) {
      case 'edit':
        setLocation(`/crm/leads/${selectedLead.id}/edit`);
        break;
      case 'email':
        if (selectedLead.email) {
          window.location.href = `mailto:${selectedLead.email}`;
        } else {
          toast.error('No email address available');
        }
        break;
      case 'call':
        if (selectedLead.phone) {
          window.location.href = `tel:${selectedLead.phone}`;
        } else {
          toast.error('No phone number available');
        }
        break;
      case 'meeting':
        setShowMeetingDialog(true);
        break;
      case 'task':
        setShowTaskDialog(true);
        break;
      case 'delete':
        if (confirm(`Delete lead "${selectedLead.companyName || selectedLead.firstName + ' ' + selectedLead.lastName}"?`)) {
          toast.success('Lead deleted');
        }
        break;
    }
    setRadialMenuOpen(false);
  };

  const leadsByStatus = LEAD_STATUSES.reduce(
    (acc, status) => {
      acc[status.value] =
        allLeads?.leads?.filter((lead) => lead.leadStatus === status.value) ||
        [];
      return acc;
    },
    {} as Record<string, any[]>
  );

  const handleStatusChange = (leadId: number, newStatus: string) => {
    updateStatus.mutate({
      id: leadId,
      leadStatus: newStatus as any,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Sales pipeline and lead management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            List
          </Button>
          <Button onClick={() => setLocation("/crm/leads/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {LEAD_STATUSES.map((status) => (
          <Card key={status.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {status.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leadsByStatus[status.value]?.length || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={leadType} onValueChange={setLeadType}>
              <SelectTrigger>
                <SelectValue placeholder="Lead Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {LEAD_STATUSES.map((status) => (
            <div key={status.value} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <h3 className="font-semibold">{status.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {leadsByStatus[status.value]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {leadsByStatus[status.value]?.map((lead) => (
                  <LeadHoverCard key={lead.id} leadId={lead.id}>
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setLocation(`/crm/leads/${lead.id}`)}
                      onContextMenu={(e) => handleContextMenu(e, lead)}
                      onDoubleClick={(e) => handleDoubleClick(e, lead)}
                    >
                    <CardContent className="p-4 space-y-2">
                      <div className="font-medium text-sm">
                        {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {lead.leadType}
                      </Badge>
                      {lead.estimatedValue && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="w-3 h-3" />
                          <span>
                            ${Number(lead.estimatedValue).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {lead.expectedCloseDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(lead.expectedCloseDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {lead.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>Assigned</span>
                        </div>
                      )}
                      <div className="flex gap-1 pt-2">
                        {lead.leadStatus === 'won' || lead.leadStatus === 'qualified' ? (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                              setShowConvertDialog(true);
                            }}
                          >
                            Convert to Customer
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                setShowMeetingDialog(true);
                              }}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              Meet
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                setShowTaskDialog(true);
                              }}
                            >
                              <CheckSquare className="w-3 h-3 mr-1" />
                              Task
                            </Button>
                          </>
                        )}
                      </div>
                      <Select
                        value={lead.leadStatus}
                        onValueChange={(value) =>
                          handleStatusChange(lead.id, value)
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                  </LeadHoverCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : allLeads?.leads?.length === 0 ? (
                <div className="text-center py-8">No leads found</div>
              ) : (
                allLeads?.leads?.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setLocation(`/crm/leads/${lead.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lead.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{lead.leadType}</Badge>
                        <Badge>{lead.leadStatus}</Badge>
                        {lead.estimatedValue && (
                          <div className="text-sm font-medium">
                            ${Number(lead.estimatedValue).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedLead && (
        <>
          <ScheduleMeetingDialog
            open={showMeetingDialog}
            onOpenChange={setShowMeetingDialog}
            entityType="lead"
            entityId={selectedLead.id}
            entityName={
              selectedLead.companyName ||
              `${selectedLead.firstName} ${selectedLead.lastName}`
            }
          />
          <CreateTaskDialog
            open={showTaskDialog}
            onOpenChange={setShowTaskDialog}
            entityType="lead"
            entityId={selectedLead.id}
            entityName={
              selectedLead.companyName ||
              `${selectedLead.firstName} ${selectedLead.lastName}`
            }
          />
          <ConvertLeadDialog
            open={showConvertDialog}
            onOpenChange={setShowConvertDialog}
            lead={selectedLead}
          />
        </>
      )}
      
      {/* Radial Context Menu */}
      <RadialContextMenu
        open={radialMenuOpen}
        position={radialMenuPosition}
        onClose={() => setRadialMenuOpen(false)}
        onAction={handleRadialAction}
      />
    </div>
  );
}
