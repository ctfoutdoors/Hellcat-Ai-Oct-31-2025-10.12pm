import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Settings2,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Edit,
  Copy,
  FileDown,
  FileStack,
  Flag,
  Archive,
  Send,
  Mail,
  Bell,
  CheckCircle,
  Filter,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon map for rendering
const iconMap: Record<string, LucideIcon> = {
  Eye,
  Edit,
  Copy,
  FileDown,
  FileStack,
  Flag,
  Archive,
  Trash2,
  Send,
  Mail,
  Bell,
  CheckCircle,
  Filter,
  RefreshCw,
  Plus,
};

type ContextType = "casesPage" | "caseDetail" | "dashboard" | "ordersPage" | "productsPage" | "auditsPage" | "reportsPage";

interface RadialMenuAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  actionType: "navigate" | "api" | "quickEdit" | "export" | "custom";
  actionConfig: any;
  order: number;
  enabled: boolean;
  shortcut?: string;
}

export default function RadialMenuSettings() {
  const { data: settings, isLoading, refetch } = trpc.radialMenu.getSettings.useQuery();
  const { data: actionLibrary } = trpc.radialMenu.getActionLibrary.useQuery();
  const updateSettings = trpc.radialMenu.updateSettings.useMutation();
  const resetContext = trpc.radialMenu.resetContext.useMutation();
  const resetAll = trpc.radialMenu.resetAll.useMutation();

  const [selectedContext, setSelectedContext] = useState<ContextType>("casesPage");
  const [localActions, setLocalActions] = useState<RadialMenuAction[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (settings && settings[selectedContext]) {
      setLocalActions(settings[selectedContext] || []);
    }
  }, [settings, selectedContext]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        [selectedContext]: localActions,
      });
      toast.success("Settings saved");
      refetch();
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleResetContext = async () => {
    try {
      await resetContext.mutateAsync({ context: selectedContext });
      toast.success("Context reset to defaults");
      refetch();
    } catch (error) {
      toast.error("Failed to reset context");
    }
  };

  const handleResetAll = async () => {
    try {
      await resetAll.mutateAsync();
      toast.success("All settings reset to defaults");
      refetch();
    } catch (error) {
      toast.error("Failed to reset all settings");
    }
  };

  const handleAddAction = () => {
    if (localActions.length >= 8) {
      toast.error("Maximum 8 actions allowed");
      return;
    }

    const newAction: RadialMenuAction = {
      id: `custom-${Date.now()}`,
      label: "New Action",
      icon: "Plus",
      color: "text-gray-400",
      actionType: "custom",
      actionConfig: {},
      order: localActions.length,
      enabled: true,
    };

    setLocalActions([...localActions, newAction]);
    setEditingIndex(localActions.length);
  };

  const handleRemoveAction = (index: number) => {
    const updated = localActions.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((action, i) => {
      action.order = i;
    });
    setLocalActions(updated);
  };

  const handleUpdateAction = (index: number, updates: Partial<RadialMenuAction>) => {
    const updated = [...localActions];
    updated[index] = { ...updated[index], ...updates };
    setLocalActions(updated);
  };

  const handleMoveAction = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localActions.length) return;

    const updated = [...localActions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update order
    updated.forEach((action, i) => {
      action.order = i;
    });
    
    setLocalActions(updated);
  };

  const contextLabels: Record<ContextType, string> = {
    casesPage: "Cases Page",
    caseDetail: "Case Detail",
    dashboard: "Dashboard",
    ordersPage: "Orders Page",
    productsPage: "Products Page",
    auditsPage: "Audits Page",
    reportsPage: "Reports Page",
  };

  const colorOptions = [
    { value: "text-blue-400", label: "Blue", color: "bg-blue-400" },
    { value: "text-green-400", label: "Green", color: "bg-green-400" },
    { value: "text-purple-400", label: "Purple", color: "bg-purple-400" },
    { value: "text-orange-400", label: "Orange", color: "bg-orange-400" },
    { value: "text-cyan-400", label: "Cyan", color: "bg-cyan-400" },
    { value: "text-yellow-400", label: "Yellow", color: "bg-yellow-400" },
    { value: "text-red-400", label: "Red", color: "bg-red-400" },
    { value: "text-gray-400", label: "Gray", color: "bg-gray-400" },
  ];

  if (isLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Radial Menu Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize radial menu actions for each context
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetAll}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Context</CardTitle>
              <CardDescription>Select which page to customize</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedContext} onValueChange={(v) => setSelectedContext(v as ContextType)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="casesPage">Cases</TabsTrigger>
                  <TabsTrigger value="caseDetail">Detail</TabsTrigger>
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="ordersPage">Orders</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Actions ({localActions.length}/8)</CardTitle>
                  <CardDescription>Configure up to 8 actions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetContext}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleAddAction} disabled={localActions.length >= 8}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {localActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No actions configured. Click "Add Action" to get started.
                </div>
              ) : (
                localActions.map((action, index) => {
                  const Icon = iconMap[action.icon] || Plus;
                  const isEditing = editingIndex === index;

                  return (
                    <Card key={action.id} className={cn("p-4", isEditing && "ring-2 ring-primary")}>
                      <div className="flex items-start gap-4">
                        {/* Drag Handle */}
                        <div className="flex flex-col gap-1 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveAction(index, "up")}
                            disabled={index === 0}
                          >
                            ▲
                          </Button>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveAction(index, "down")}
                            disabled={index === localActions.length - 1}
                          >
                            ▼
                          </Button>
                        </div>

                        {/* Icon Preview */}
                        <div className={cn("p-3 rounded-full bg-gray-800 border-2 border-gray-600")}>
                          <Icon className={cn("h-5 w-5", action.color)} />
                        </div>

                        {/* Action Details */}
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={action.label}
                                onChange={(e) => handleUpdateAction(index, { label: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Icon</Label>
                              <Select
                                value={action.icon}
                                onValueChange={(value) => handleUpdateAction(index, { icon: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.keys(iconMap).map((iconName) => {
                                    const IconComponent = iconMap[iconName];
                                    return (
                                      <SelectItem key={iconName} value={iconName}>
                                        <div className="flex items-center gap-2">
                                          <IconComponent className="h-4 w-4" />
                                          {iconName}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Color</Label>
                              <Select
                                value={action.color}
                                onValueChange={(value) => handleUpdateAction(index, { color: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {colorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <div className={cn("h-4 w-4 rounded", option.color)} />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={action.actionType}
                                onValueChange={(value: any) => handleUpdateAction(index, { actionType: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="navigate">Navigate</SelectItem>
                                  <SelectItem value="api">API Call</SelectItem>
                                  <SelectItem value="quickEdit">Quick Edit</SelectItem>
                                  <SelectItem value="export">Export</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={action.enabled}
                                onCheckedChange={(checked) => handleUpdateAction(index, { enabled: checked })}
                              />
                              <Label className="text-xs">Enabled</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAction(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>How your radial menu will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
                {/* Center Core */}
                <div className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center">
                  <Settings2 className="h-5 w-5 text-gray-400" />
                </div>

                {/* Action Bubbles */}
                {localActions.filter(a => a.enabled).map((action, index) => {
                  const angle = (360 / Math.min(localActions.filter(a => a.enabled).length, 8)) * index - 90;
                  const radian = (angle * Math.PI) / 180;
                  const radius = 80;
                  const x = Math.cos(radian) * radius;
                  const y = Math.sin(radian) * radius;
                  const Icon = iconMap[action.icon] || Plus;

                  return (
                    <div
                      key={action.id}
                      className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 shadow-lg flex items-center justify-center"
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                    >
                      <Icon className={cn("h-4 w-4", action.color)} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Library</CardTitle>
              <CardDescription>80+ pre-built actions with integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="space-y-2">
                <Input
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {actionLibrary && Object.keys(actionLibrary).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action List */}
              <div className="max-h-[500px] overflow-y-auto space-y-4">
                {actionLibrary && Object.entries(actionLibrary)
                  .filter(([category]) => selectedCategory === "all" || category === selectedCategory)
                  .map(([category, actions]: [string, any[]]) => {
                    const filteredActions = actions.filter((action) =>
                      action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      action.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (filteredActions.length === 0) return null;

                    return (
                      <div key={category}>
                        <h4 className="text-sm font-semibold mb-2 capitalize sticky top-0 bg-background py-1">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                          <span className="text-muted-foreground font-normal ml-2">({filteredActions.length})</span>
                        </h4>
                        <div className="space-y-1">
                          {filteredActions.map((action) => {
                            const Icon = iconMap[action.icon] || Plus;
                            const hasIntegration = action.integration;
                            return (
                              <div
                                key={action.id}
                                className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer text-sm group"
                                onClick={() => {
                                  if (localActions.length < 8) {
                                    const newAction: RadialMenuAction = {
                                      ...action,
                                      id: `${action.id}-${Date.now()}`,
                                      color: "text-blue-400",
                                      actionConfig: {},
                                      order: localActions.length,
                                      enabled: true,
                                    };
                                    setLocalActions([...localActions, newAction]);
                                    toast.success(`Added "${action.label}"`);
                                  } else {
                                    toast.error("Maximum 8 actions reached");
                                  }
                                }}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{action.label}</span>
                                    {hasIntegration && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                        {action.integration}
                                      </span>
                                    )}
                                  </div>
                                  {action.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {action.description}
                                    </p>
                                  )}
                                </div>
                                <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
