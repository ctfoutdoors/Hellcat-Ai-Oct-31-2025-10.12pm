import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Bell, Users, FileText, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CasesSettings() {
  const [settings, setSettings] = useState({
    // General Settings
    caseNumberPrefix: "CASE",
    caseNumberStartFrom: "1000",
    defaultPriority: "medium",
    defaultStatus: "open",
    autoAssignCases: true,
    
    // Notification Settings
    emailOnNewCase: true,
    emailOnStatusChange: true,
    emailOnHighPriority: true,
    notifyAssignee: true,
    notifyOnComment: false,
    
    // SLA Settings
    slaEnabled: true,
    slaLowPriority: "72",
    slaMediumPriority: "48",
    slaHighPriority: "24",
    slaUrgentPriority: "12",
    slaWarningThreshold: "80",
    
    // Auto-Assignment Rules
    autoAssignEnabled: true,
    assignmentMethod: "round_robin",
    assignToTeam: "support",
    
    // Workflow Settings
    requireApprovalForClosure: false,
    allowReopening: true,
    requireNotesOnStatusChange: true,
    autoEscalateOverdue: true,
    escalationHours: "48",
  });

  const handleSaveSettings = () => {
    // In a real implementation, this would save to backend
    toast.success("Settings saved successfully");
  };

  const handleResetDefaults = () => {
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Cases Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure case management preferences and workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Numbering
              </CardTitle>
              <CardDescription>
                Configure how case numbers are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Case Number Prefix</Label>
                  <Input
                    id="prefix"
                    value={settings.caseNumberPrefix}
                    onChange={(e) => setSettings({ ...settings, caseNumberPrefix: e.target.value })}
                    placeholder="CASE"
                  />
                  <p className="text-sm text-muted-foreground">
                    Example: {settings.caseNumberPrefix}-2024-001
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startFrom">Start Numbering From</Label>
                  <Input
                    id="startFrom"
                    type="number"
                    value={settings.caseNumberStartFrom}
                    onChange={(e) => setSettings({ ...settings, caseNumberStartFrom: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Next case will be: {settings.caseNumberPrefix}-2024-{String(parseInt(settings.caseNumberStartFrom) + 1).padStart(3, "0")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Values</CardTitle>
              <CardDescription>
                Set default values for new cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultPriority">Default Priority</Label>
                  <Select 
                    value={settings.defaultPriority} 
                    onValueChange={(value) => setSettings({ ...settings, defaultPriority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultStatus">Default Status</Label>
                  <Select 
                    value={settings.defaultStatus} 
                    onValueChange={(value) => setSettings({ ...settings, defaultStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure when to send email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Case Created</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when a new case is created
                  </p>
                </div>
                <Switch
                  checked={settings.emailOnNewCase}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailOnNewCase: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Changed</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when case status changes
                  </p>
                </div>
                <Switch
                  checked={settings.emailOnStatusChange}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailOnStatusChange: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Priority Cases</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email for high/urgent priority cases
                  </p>
                </div>
                <Switch
                  checked={settings.emailOnHighPriority}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailOnHighPriority: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify Assignee</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when case is assigned to user
                  </p>
                </div>
                <Switch
                  checked={settings.notifyAssignee}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifyAssignee: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when someone comments on case
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnComment}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifyOnComment: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Settings */}
        <TabsContent value="sla" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Service Level Agreements
              </CardTitle>
              <CardDescription>
                Configure SLA thresholds for different priority levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable SLA Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track and alert on SLA violations
                  </p>
                </div>
                <Switch
                  checked={settings.slaEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, slaEnabled: checked })}
                />
              </div>

              {settings.slaEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="slaLow">Low Priority (hours)</Label>
                      <Input
                        id="slaLow"
                        type="number"
                        value={settings.slaLowPriority}
                        onChange={(e) => setSettings({ ...settings, slaLowPriority: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slaMedium">Medium Priority (hours)</Label>
                      <Input
                        id="slaMedium"
                        type="number"
                        value={settings.slaMediumPriority}
                        onChange={(e) => setSettings({ ...settings, slaMediumPriority: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slaHigh">High Priority (hours)</Label>
                      <Input
                        id="slaHigh"
                        type="number"
                        value={settings.slaHighPriority}
                        onChange={(e) => setSettings({ ...settings, slaHighPriority: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slaUrgent">Urgent Priority (hours)</Label>
                      <Input
                        id="slaUrgent"
                        type="number"
                        value={settings.slaUrgentPriority}
                        onChange={(e) => setSettings({ ...settings, slaUrgentPriority: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label htmlFor="slaWarning">Warning Threshold (%)</Label>
                    <Input
                      id="slaWarning"
                      type="number"
                      value={settings.slaWarningThreshold}
                      onChange={(e) => setSettings({ ...settings, slaWarningThreshold: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Show warning when {settings.slaWarningThreshold}% of SLA time has elapsed
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignment Settings */}
        <TabsContent value="assignment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Auto-Assignment Rules
              </CardTitle>
              <CardDescription>
                Configure automatic case assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Assignment</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign new cases to team members
                  </p>
                </div>
                <Switch
                  checked={settings.autoAssignEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoAssignEnabled: checked })}
                />
              </div>

              {settings.autoAssignEnabled && (
                <>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="assignmentMethod">Assignment Method</Label>
                    <Select 
                      value={settings.assignmentMethod} 
                      onValueChange={(value) => setSettings({ ...settings, assignmentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">Round Robin</SelectItem>
                        <SelectItem value="least_loaded">Least Loaded</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="skill_based">Skill Based</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {settings.assignmentMethod === "round_robin" && "Distribute cases evenly in rotation"}
                      {settings.assignmentMethod === "least_loaded" && "Assign to user with fewest active cases"}
                      {settings.assignmentMethod === "random" && "Randomly assign to available users"}
                      {settings.assignmentMethod === "skill_based" && "Match case type to user skills"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignToTeam">Assign To Team</Label>
                    <Select 
                      value={settings.assignToTeam} 
                      onValueChange={(value) => setSettings({ ...settings, assignToTeam: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">Support Team</SelectItem>
                        <SelectItem value="claims">Claims Team</SelectItem>
                        <SelectItem value="escalation">Escalation Team</SelectItem>
                        <SelectItem value="all">All Teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Settings */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Rules</CardTitle>
              <CardDescription>
                Configure case workflow and validation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval for Closure</Label>
                  <p className="text-sm text-muted-foreground">
                    Manager approval required before closing cases
                  </p>
                </div>
                <Switch
                  checked={settings.requireApprovalForClosure}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireApprovalForClosure: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Reopening Closed Cases</Label>
                  <p className="text-sm text-muted-foreground">
                    Users can reopen cases after closure
                  </p>
                </div>
                <Switch
                  checked={settings.allowReopening}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowReopening: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Notes on Status Change</Label>
                  <p className="text-sm text-muted-foreground">
                    Force users to add notes when changing status
                  </p>
                </div>
                <Switch
                  checked={settings.requireNotesOnStatusChange}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireNotesOnStatusChange: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Escalate Overdue Cases</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically escalate cases exceeding SLA
                  </p>
                </div>
                <Switch
                  checked={settings.autoEscalateOverdue}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoEscalateOverdue: checked })}
                />
              </div>

              {settings.autoEscalateOverdue && (
                <div className="space-y-2 pt-4">
                  <Label htmlFor="escalationHours">Escalation Threshold (hours)</Label>
                  <Input
                    id="escalationHours"
                    type="number"
                    value={settings.escalationHours}
                    onChange={(e) => setSettings({ ...settings, escalationHours: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Escalate cases after {settings.escalationHours} hours without update
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
