import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Template {
  id: number;
  name: string;
  description: string;
  caseType: string;
  priority: string;
  carrier: string;
  defaultNotes: string;
  createdAt: Date;
}

export default function Templates() {
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Mock templates data
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      name: "Damaged Package",
      description: "Standard template for damaged package claims",
      caseType: "damage",
      priority: "high",
      carrier: "USPS",
      defaultNotes: "Package arrived with visible damage. Customer reported damage upon delivery. Photos attached.",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: 2,
      name: "Lost Package",
      description: "Template for lost or missing package claims",
      caseType: "lost",
      priority: "urgent",
      carrier: "FEDEX",
      defaultNotes: "Package not delivered. Tracking shows no delivery attempt. Customer confirms non-receipt.",
      createdAt: new Date("2024-01-20"),
    },
    {
      id: 3,
      name: "SLA Violation",
      description: "Template for service level agreement violations",
      caseType: "sla_violation",
      priority: "medium",
      carrier: "UPS",
      defaultNotes: "Delivery exceeded promised timeframe. Customer requests compensation for late delivery.",
      createdAt: new Date("2024-02-01"),
    },
    {
      id: 4,
      name: "Adjustment Request",
      description: "Template for claim amount adjustments",
      caseType: "adjustment",
      priority: "low",
      carrier: "DHL",
      defaultNotes: "Customer requests adjustment to claim amount based on additional evidence provided.",
      createdAt: new Date("2024-02-10"),
    },
    {
      id: 5,
      name: "Wrong Item Delivered",
      description: "Template for incorrect item delivery cases",
      caseType: "damage",
      priority: "high",
      carrier: "USPS",
      defaultNotes: "Customer received incorrect item. Order number and SKU mismatch confirmed. Return label requested.",
      createdAt: new Date("2024-02-15"),
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    caseType: "damage",
    priority: "medium",
    carrier: "USPS",
    defaultNotes: "",
  });

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: templates.length + 1,
      ...formData,
      createdAt: new Date(),
    };
    setTemplates([...templates, newTemplate]);
    setShowCreateDialog(false);
    setFormData({
      name: "",
      description: "",
      caseType: "damage",
      priority: "medium",
      carrier: "USPS",
      defaultNotes: "",
    });
    toast.success("Template created successfully");
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate) return;
    setTemplates(templates.map(t => 
      t.id === selectedTemplate.id ? { ...selectedTemplate, ...formData } : t
    ));
    setShowEditDialog(false);
    setSelectedTemplate(null);
    toast.success("Template updated successfully");
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast.success("Template deleted");
  };

  const handleUseTemplate = (template: Template) => {
    // Navigate to create case page with template data
    toast.success(`Using template: ${template.name}`);
    // In a real implementation, this would navigate to create case with pre-filled data
    setLocation("/cases");
  };

  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: templates.length + 1,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
    };
    setTemplates([...templates, newTemplate]);
    toast.success("Template duplicated");
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      caseType: template.caseType,
      priority: template.priority,
      carrier: template.carrier,
      defaultNotes: template.defaultNotes,
    });
    setShowEditDialog(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Case Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable case templates to streamline your workflow
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-blue-500 mb-2" />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{template.caseType.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="font-medium capitalize">{template.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carrier:</span>
                  <span className="font-medium">{template.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{template.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => handleUseTemplate(template)}
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for common case types
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Damaged Package"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this template"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="caseType">Case Type</Label>
                <Select value={formData.caseType} onValueChange={(value) => setFormData({ ...formData, caseType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="sla_violation">SLA Violation</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
              <div className="grid gap-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Select value={formData.carrier} onValueChange={(value) => setFormData({ ...formData, carrier: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="FEDEX">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultNotes">Default Notes</Label>
              <Textarea
                id="defaultNotes"
                value={formData.defaultNotes}
                onChange={(e) => setFormData({ ...formData, defaultNotes: e.target.value })}
                placeholder="Default notes that will be pre-filled when using this template"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Template Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-caseType">Case Type</Label>
                <Select value={formData.caseType} onValueChange={(value) => setFormData({ ...formData, caseType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="sla_violation">SLA Violation</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
              <div className="grid gap-2">
                <Label htmlFor="edit-carrier">Carrier</Label>
                <Select value={formData.carrier} onValueChange={(value) => setFormData({ ...formData, carrier: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="FEDEX">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-defaultNotes">Default Notes</Label>
              <Textarea
                id="edit-defaultNotes"
                value={formData.defaultNotes}
                onChange={(e) => setFormData({ ...formData, defaultNotes: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
