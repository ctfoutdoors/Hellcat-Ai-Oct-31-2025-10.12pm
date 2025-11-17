import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Rocket, Plus, Calendar, Users } from "lucide-react";
import ProductPicker from "@/components/ProductPicker";
import { toast } from "sonner";

/**
 * Launch Orchestrator Page
 * Mission creation and launch coordination
 */

const statusConfig = {
  planning: { label: "Planning", color: "bg-gray-500" },
  preparation: { label: "Preparation", color: "bg-blue-500" },
  review: { label: "Review", color: "bg-yellow-500" },
  go_decision: { label: "Go Decision", color: "bg-orange-500" },
  active: { label: "Active", color: "bg-green-500" },
  completed: { label: "Completed", color: "bg-purple-500" },
  aborted: { label: "Aborted", color: "bg-red-500" },
};

export default function LaunchOrchestrator() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMission, setNewMission] = useState<{
    productId: number | null;
    productName: string;
    missionName: string;
    launchDate: string;
  }>({
    productId: null,
    productName: "",
    missionName: "",
    launchDate: "",
  });

  const { data: missions, isLoading, refetch } = trpc.intelligence.missions.list.useQuery();
  const createMutation = trpc.intelligence.missions.create.useMutation({
    onSuccess: () => {
      toast.success("Mission created successfully");
      setIsCreateDialogOpen(false);
      setNewMission({ productId: null, productName: "", missionName: "", launchDate: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create mission: ${error.message}`);
    },
  });

  const handleCreateMission = () => {
    if (newMission.productId === null || !newMission.missionName || !newMission.launchDate) {
      toast.error("Please fill in all fields");
      return;
    }

    createMutation.mutate({
      productId: newMission.productId,
      missionName: newMission.missionName,
      launchDate: newMission.launchDate,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const activeMissions = missions?.filter((m) => !["completed", "aborted"].includes(m.status)) || [];
  const completedMissions = missions?.filter((m) => ["completed", "aborted"].includes(m.status)) || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Launch Orchestrator</h1>
          <p className="text-muted-foreground mt-2">
            Mission creation and launch coordination
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Mission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Launch Mission</DialogTitle>
              <DialogDescription>
                Set up a new product launch mission with timeline and objectives
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <ProductPicker
                  value={newMission.productId}
                  onSelect={(productId, productName) => {
                    setNewMission({ ...newMission, productId, productName });
                  }}
                  placeholder="Select a product to launch..."
                />
                {newMission.productName && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {newMission.productName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="missionName">Mission Name</Label>
                <Input
                  id="missionName"
                  value={newMission.missionName}
                  onChange={(e) => setNewMission({ ...newMission, missionName: e.target.value })}
                  placeholder="e.g., Q2 2024 Product Launch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="launchDate">Launch Date</Label>
                <Input
                  id="launchDate"
                  type="date"
                  value={newMission.launchDate}
                  onChange={(e) => setNewMission({ ...newMission, launchDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMission} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                Create Mission
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Missions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Missions ({activeMissions.length})</h2>
        <div className="grid gap-4">
          {activeMissions.length > 0 ? (
            activeMissions.map((mission) => {
              const statusInfo = statusConfig[mission.status as keyof typeof statusConfig];
              const readiness = mission.readinessSnapshot?.overallScore || 0;

              return (
                <Card key={mission.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          {mission.missionName}
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Product ID: {mission.productId} • Phase: {mission.currentPhase.replace("_", " ").toUpperCase()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{readiness}%</div>
                        <p className="text-xs text-muted-foreground">Readiness</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold">Launch Date</p>
                          <p className="text-sm text-muted-foreground">
                            {mission.launchDatetime ? new Date(mission.launchDatetime).toLocaleDateString() : "Not set"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold">Collaborators</p>
                          <p className="text-sm text-muted-foreground">
                            {(mission.collaborators?.internal?.length || 0) + (mission.collaborators?.external?.length || 0)} team members
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold">Readiness Breakdown</p>
                        <div className="text-xs text-muted-foreground space-y-1 mt-1">
                          <div>Product: {mission.readinessSnapshot?.productScore || 0}%</div>
                          <div>Variants: {mission.readinessSnapshot?.variantScore || 0}%</div>
                          <div>Inventory: {mission.readinessSnapshot?.inventoryScore || 0}%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active missions. Create one to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Completed Missions ({completedMissions.length})</h2>
          <div className="grid gap-4">
            {completedMissions.map((mission) => {
              const statusInfo = statusConfig[mission.status as keyof typeof statusConfig];

              return (
                <Card key={mission.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          {mission.missionName}
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Product ID: {mission.productId} • Completed: {mission.completedAt ? new Date(mission.completedAt).toLocaleDateString() : "N/A"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
