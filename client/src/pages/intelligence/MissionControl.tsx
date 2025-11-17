import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, Target, Calendar } from "lucide-react";
import { toast } from "sonner";

/**
 * Mission Control Dashboard
 * Real-time launch monitoring with platform-consistent design
 */

export default function MissionControl() {
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [realtimeData, setRealtimeData] = useState<{
    readiness?: { overallScore: number; productScore: number; variantScore: number; inventoryScore: number; timestamp: Date };
    status?: string;
    phase?: string;
    alerts?: { severity: string; message: string; source: string; timestamp: Date }[];
  }>({});

  const { data: missions, isLoading } = trpc.intelligence.missions.active.useQuery();
  const { data: selectedMission, refetch } = trpc.intelligence.missions.get.useQuery(
    { id: selectedMissionId! },
    { enabled: !!selectedMissionId }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading Mission Control...</p>
      </div>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Rocket className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Active Missions</h2>
        <p className="text-muted-foreground">Create a launch mission in Launch Orchestrator to begin tracking.</p>
      </div>
    );
  }

  const activeMissions = missions || [];
  const mission = selectedMission || null;
  const readiness = realtimeData.readiness || mission?.readinessSnapshot || {};
  const currentStatus = realtimeData.status || mission?.status || "unknown";
  const currentPhase = realtimeData.phase || mission?.currentPhase || "unknown";

  const getReadinessColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getReadinessIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 75) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "planning":
        return "secondary";
      case "on_hold":
        return "outline";
      case "completed":
        return "default";
      case "aborted":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mission Control</h1>
          <p className="text-muted-foreground">Real-time launch monitoring and tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
          <Select
            value={selectedMissionId?.toString() || ""}
            onValueChange={(value) => setSelectedMissionId(parseInt(value))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select Mission" />
            </SelectTrigger>
            <SelectContent>
              {activeMissions.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.missionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedMissionId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Rocket className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Mission to Begin Monitoring</h3>
            <p className="text-muted-foreground">Choose a mission from the dropdown above to view real-time status and readiness metrics.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mission Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{mission?.missionName}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>Product ID: {mission?.productId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(currentStatus)}>
                    {currentStatus.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{currentPhase.replace("_", " ").toUpperCase()}</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Readiness Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Readiness */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getReadinessIcon(readiness.overallScore || 0)}
                    <span className={`text-3xl font-bold ${getReadinessColor(readiness.overallScore || 0)}`}>
                      {readiness.overallScore || 0}%
                    </span>
                  </div>
                  {(readiness.overallScore || 0) >= 90 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Readiness */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Product Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getReadinessIcon(readiness.productScore || 0)}
                  <span className={`text-3xl font-bold ${getReadinessColor(readiness.productScore || 0)}`}>
                    {readiness.productScore || 0}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Product Intelligence</p>
              </CardContent>
            </Card>

            {/* Variant Readiness */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Variant Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getReadinessIcon(readiness.variantScore || 0)}
                  <span className={`text-3xl font-bold ${getReadinessColor(readiness.variantScore || 0)}`}>
                    {readiness.variantScore || 0}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Variant Intelligence</p>
              </CardContent>
            </Card>

            {/* Inventory Readiness */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getReadinessIcon(readiness.inventoryScore || 0)}
                  <span className={`text-3xl font-bold ${getReadinessColor(readiness.inventoryScore || 0)}`}>
                    {readiness.inventoryScore || 0}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Inventory Intelligence</p>
              </CardContent>
            </Card>
          </div>

          {/* Mission Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Launch Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Launch Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Target Launch Date</span>
                  <span className="font-medium">
                    {mission?.launchDatetime ? new Date(mission.launchDatetime).toLocaleDateString() : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days Until Launch</span>
                  <span className="font-medium">
                    {mission?.launchDatetime
                      ? Math.ceil((new Date(mission.launchDatetime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {mission?.createdAt ? new Date(mission.createdAt).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Collaborators</span>
                  <span className="text-2xl font-bold">{mission?.collaborators?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {mission?.collaborators?.length
                    ? "Team members actively working on this launch"
                    : "No collaborators assigned yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!realtimeData.alerts || realtimeData.alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p>No active alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {realtimeData.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        alert.severity === "critical"
                          ? "bg-red-50 border-red-200"
                          : alert.severity === "warning"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 ${
                            alert.severity === "critical"
                              ? "text-red-600"
                              : alert.severity === "warning"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.source} • {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
