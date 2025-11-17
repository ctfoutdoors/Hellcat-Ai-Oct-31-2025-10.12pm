import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Search, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Templates Module
 * Reusable configurations for launch missions and intelligence settings
 */

interface Template {
  id: string;
  name: string;
  description: string;
  type: "mission" | "settings";
  config: any;
  createdAt: Date;
  usageCount: number;
}

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    type: "mission" as "mission" | "settings",
    config: "{}",
  });

  // Mock templates data (in production, this would come from tRPC)
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Standard Product Launch",
      description: "Default configuration for new product launches with 30-day timeline",
      type: "mission",
      config: { timeline: 30, checkpoints: ["design", "inventory", "marketing"] },
      createdAt: new Date("2024-01-15"),
      usageCount: 12,
    },
    {
      id: "2",
      name: "Rapid Launch (7-Day)",
      description: "Accelerated launch template for urgent product releases",
      type: "mission",
      config: { timeline: 7, checkpoints: ["inventory", "marketing"] },
      createdAt: new Date("2024-02-01"),
      usageCount: 5,
    },
    {
      id: "3",
      name: "Conservative Readiness Thresholds",
      description: "High-bar readiness settings for critical launches",
      type: "settings",
      config: { minReadiness: 95, requireAllChecks: true },
      createdAt: new Date("2024-01-20"),
      usageCount: 8,
    },
  ]);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = () => {
    try {
      JSON.parse(newTemplate.config); // Validate JSON
      const template: Template = {
        id: Date.now().toString(),
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        config: JSON.parse(newTemplate.config),
        createdAt: new Date(),
        usageCount: 0,
      };
      setTemplates([...templates, template]);
      setShowCreateDialog(false);
      setNewTemplate({ name: "", description: "", type: "mission", config: "{}" });
      toast.success("Template created successfully");
    } catch (error) {
      toast.error("Invalid JSON configuration");
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      usageCount: 0,
    };
    setTemplates([...templates, duplicate]);
    toast.success("Template duplicated");
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast.success("Template deleted");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Reusable configurations for launch missions and intelligence settings
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mission Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter((t) => t.type === "mission").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Settings Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter((t) => t.type === "settings").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      {template.name}
                      <Badge variant={template.type === "mission" ? "default" : "secondary"}>
                        {template.type}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">{template.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold mb-2">Configuration</p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(template.config, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">Usage Count</p>
                      <p className="text-2xl font-bold">{template.usageCount}</p>
                      <p className="text-xs text-muted-foreground">times used</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Created</p>
                      <p className="text-sm">{template.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a reusable configuration template for missions or settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., Standard Product Launch"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Describe the purpose and use case for this template"
              />
            </div>
            <div>
              <Label htmlFor="type">Template Type</Label>
              <select
                id="type"
                value={newTemplate.type}
                onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as "mission" | "settings" })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="mission">Mission Template</option>
                <option value="settings">Settings Template</option>
              </select>
            </div>
            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={newTemplate.config}
                onChange={(e) => setNewTemplate({ ...newTemplate, config: e.target.value })}
                placeholder='{"key": "value"}'
                className="font-mono text-sm"
                rows={8}
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
    </div>
  );
}
