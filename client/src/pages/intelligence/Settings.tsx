import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

/**
 * Intelligence Suite Settings Page
 * Admin-only configuration for timing rules, thresholds, and templates
 */

export default function IntelligenceSettings() {
  const { data: settings, isLoading, refetch } = trpc.intelligence.settings.getActive.useQuery();
  const { data: defaults } = trpc.intelligence.settings.getDefaults.useQuery();
  const updateMutation = trpc.intelligence.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const [timingRules, setTimingRules] = useState(settings?.timingRules || {});
  const [thresholds, setThresholds] = useState(settings?.thresholds || {});

  const handleSave = () => {
    updateMutation.mutate({
      timingRules,
      thresholds,
      templates: settings?.templates,
    });
  };

  const handleReset = () => {
    if (defaults) {
      setTimingRules(defaults.timingRules);
      setThresholds(defaults.thresholds);
      toast.info("Reset to default values");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intelligence Suite Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure timing rules, thresholds, and templates for product launches
          </p>
          {settings && (
            <p className="text-sm text-muted-foreground mt-1">
              Version: {settings.version} • Last updated: {new Date(settings.createdAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="timing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timing">Timing Rules</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Launch Timing Configuration</CardTitle>
              <CardDescription>
                Define deadlines and timing windows for product launch activities
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assetDeadline">Asset Deadline (days before launch)</Label>
                <Input
                  id="assetDeadline"
                  type="number"
                  value={timingRules.assetDeadlineDays || 14}
                  onChange={(e) =>
                    setTimingRules({ ...timingRules, assetDeadlineDays: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyDeadline">Copy Deadline (days before launch)</Label>
                <Input
                  id="copyDeadline"
                  type="number"
                  value={timingRules.copyDeadlineDays || 7}
                  onChange={(e) =>
                    setTimingRules({ ...timingRules, copyDeadlineDays: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freezeWindow">Freeze Window (days before launch)</Label>
                <Input
                  id="freezeWindow"
                  type="number"
                  value={timingRules.freezeWindowDays || 3}
                  onChange={(e) =>
                    setTimingRules({ ...timingRules, freezeWindowDays: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goNoGoTiming">Go/No-Go Decision (days before launch)</Label>
                <Input
                  id="goNoGoTiming"
                  type="number"
                  value={timingRules.goNoGoTimingDays || 1}
                  onChange={(e) =>
                    setTimingRules({ ...timingRules, goNoGoTimingDays: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewTiming">Review Window (days before launch)</Label>
                <Input
                  id="reviewTiming"
                  type="number"
                  value={timingRules.reviewTimingDays || 2}
                  onChange={(e) =>
                    setTimingRules({ ...timingRules, reviewTimingDays: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalationDelay">Escalation Delay (hours)</Label>
                <Input
                  id="escalationDelay"
                  type="number"
                  value={timingRules.escalationDelayHours || 24}
                  onChange={(e) =>
                    setTimingRules({ ...timingRules, escalationDelayHours: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="syncFrequency">Sync Frequency (minutes)</Label>
                <Input
                  id="syncFrequency"
                  type="number"
                  value={timingRules.syncFrequencyMinutes || 15}
                  onChange={(e) =>
                    setTimingRules({ ...timingRules, syncFrequencyMinutes: parseInt(e.target.value) })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Readiness Thresholds</CardTitle>
              <CardDescription>
                Configure minimum requirements for launch readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="safetyStock">Safety Stock Multiplier</Label>
                <Input
                  id="safetyStock"
                  type="number"
                  step="0.1"
                  value={thresholds.safetyStockMultiplier || 1.5}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, safetyStockMultiplier: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variantReadiness">Variant Readiness Min Score (%)</Label>
                <Input
                  id="variantReadiness"
                  type="number"
                  value={thresholds.variantReadinessMinScore || 75}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, variantReadinessMinScore: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvalQuorum">Minimum Approval Quorum</Label>
                <Input
                  id="approvalQuorum"
                  type="number"
                  value={thresholds.minimumApprovalQuorum || 2}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, minimumApprovalQuorum: parseInt(e.target.value) })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Thresholds by Category</CardTitle>
              <CardDescription>
                Minimum inventory levels required for launch approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Default</Label>
                  <Input
                    type="number"
                    value={thresholds.inventoryThresholds?.default || 50}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        inventoryThresholds: {
                          ...(thresholds.inventoryThresholds || {}),
                          default: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>High Demand</Label>
                  <Input
                    type="number"
                    value={thresholds.inventoryThresholds?.high_demand || 100}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        inventoryThresholds: {
                          ...(thresholds.inventoryThresholds || {}),
                          high_demand: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Seasonal</Label>
                  <Input
                    type="number"
                    value={thresholds.inventoryThresholds?.seasonal || 200}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        inventoryThresholds: {
                          ...(thresholds.inventoryThresholds || {}),
                          seasonal: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Launch Templates</CardTitle>
              <CardDescription>
                Default tasks, checklists, and requirements for product launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Template configuration coming soon. Use the API to customize templates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
