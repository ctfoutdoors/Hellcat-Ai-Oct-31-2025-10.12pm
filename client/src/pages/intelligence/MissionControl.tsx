import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { toast } from "sonner";
// import { io, Socket } from "socket.io-client"; // Temporarily disabled

/**
 * Mission Control Dashboard
 * NASA-style mission control with real-time WebSocket updates
 * Dark theme, 3x3 grid layout, high information density
 */

export default function MissionControl() {
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  // const [socket, setSocket] = useState<Socket | null>(null); // Temporarily disabled
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

   // WebSocket temporarily disabled - using polling instead
  // Initialize WebSocket connection
  // useEffect(() => {
  //   if (!selectedMissionId) return;
  //   const newSocket = io({ path: "/api/mission-control-ws" });
  //   newSocket.on("connect", () => console.log("[Mission Control] WebSocket connected"));
  //   setSocket(newSocket);
  //   return () => { newSocket.disconnect(); };
  // }, [selectedMissionId, refetch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="text-green-500 text-sm">Loading Mission Control...</p>
      </div>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4">
        <Rocket className="w-16 h-16 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-400">No Active Missions</h2>
        <p className="text-gray-500">Create a launch mission in Launch Orchestrator to begin tracking.</p>
      </div>
    );
  }

  const activeMissions = missions || [];
  const mission = selectedMission || null;
  const readiness = realtimeData.readiness || mission?.readinessSnapshot || {};
  const currentStatus = realtimeData.status || mission?.status || "unknown";
  const currentPhase = realtimeData.phase || mission?.currentPhase || "unknown";

  return (
    <div className="min-h-screen bg-black text-green-500 p-6 font-mono">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-green-900 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider">MISSION CONTROL</h1>
          <p className="text-green-700 text-sm mt-1">REAL-TIME LAUNCH MONITORING SYSTEM</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm">LIVE</span>
          </div>
          <Select
            value={selectedMissionId?.toString() || ""}
            onValueChange={(value) => setSelectedMissionId(parseInt(value))}
          >
            <SelectTrigger className="w-[300px] bg-black border-green-900 text-green-500">
              <SelectValue placeholder="SELECT MISSION" />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-900">
              {activeMissions.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()} className="text-green-500">
                  {m.missionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedMissionId ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Rocket className="w-24 h-24 text-green-900 mb-6" />
          <p className="text-xl text-green-700">SELECT A MISSION TO BEGIN MONITORING</p>
        </div>
      ) : !mission ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mission Header */}
          <Card className="bg-black border-green-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-green-500 tracking-wider">
                  {mission.missionName}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-black border-green-700 text-green-500">
                    STATUS: {currentStatus.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-black border-green-700 text-green-500">
                    PHASE: {currentPhase.toUpperCase().replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 3x3 Grid Dashboard */}
          <div className="grid grid-cols-3 gap-4">
            {/* Overall Readiness */}
            <Card className="bg-black border-green-900 col-span-1 row-span-2">
              <CardHeader>
                <CardTitle className="text-green-500 text-sm tracking-wider">OVERALL READINESS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-7xl font-bold text-green-500 mb-4">
                    {readiness.overallScore || 0}%
                  </div>
                  {(readiness.overallScore || 0) >= 90 ? (
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  ) : (readiness.overallScore || 0) >= 70 ? (
                    <Clock className="w-12 h-12 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Readiness */}
            <Card className="bg-black border-green-900">
              <CardHeader>
                <CardTitle className="text-green-500 text-xs tracking-wider">PRODUCT READINESS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500">{readiness.productScore || 0}%</div>
                <div className="mt-2 flex items-center gap-2">
                  {(readiness.productScore || 0) >= 80 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-green-700">PRODUCT INTELLIGENCE</span>
                </div>
              </CardContent>
            </Card>

            {/* Variant Readiness */}
            <Card className="bg-black border-green-900">
              <CardHeader>
                <CardTitle className="text-green-500 text-xs tracking-wider">VARIANT READINESS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500">{readiness.variantScore || 0}%</div>
                <div className="mt-2 flex items-center gap-2">
                  {(readiness.variantScore || 0) >= 80 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-green-700">VARIANT INTELLIGENCE</span>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Readiness */}
            <Card className="bg-black border-green-900">
              <CardHeader>
                <CardTitle className="text-green-500 text-xs tracking-wider">INVENTORY READINESS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500">{readiness.inventoryScore || 0}%</div>
                <div className="mt-2 flex items-center gap-2">
                  {(readiness.inventoryScore || 0) >= 80 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-green-700">INVENTORY INTELLIGENCE</span>
                </div>
              </CardContent>
            </Card>

            {/* Launch Timeline */}
            <Card className="bg-black border-green-900">
              <CardHeader>
                <CardTitle className="text-green-500 text-xs tracking-wider">LAUNCH TIMELINE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-green-700">TARGET:</span>{" "}
                    <span className="text-green-500">{new Date(mission.launchDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-700">T-MINUS:</span>{" "}
                    <span className="text-green-500">
                      {Math.ceil((new Date(mission.launchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} DAYS
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaborators */}
            <Card className="bg-black border-green-900">
              <CardHeader>
                <CardTitle className="text-green-500 text-xs tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  TEAM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {(mission.collaborators?.internal?.length || 0) + (mission.collaborators?.external?.length || 0)}
                </div>
                <div className="text-xs text-green-700 mt-2">ACTIVE COLLABORATORS</div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="bg-black border-green-900 col-span-3">
              <CardHeader>
                <CardTitle className="text-green-500 text-sm tracking-wider">SYSTEM ALERTS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {realtimeData.alerts && realtimeData.alerts.length > 0 ? (
                    realtimeData.alerts.slice(-5).reverse().map((alert, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs border-l-2 border-green-700 pl-3 py-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.severity === "error" ? "text-red-500" :
                          alert.severity === "warning" ? "text-yellow-500" :
                          "text-green-500"
                        }`} />
                        <div className="flex-1">
                          <span className="text-green-500">{alert.message}</span>
                          <span className="text-green-700 ml-2">({alert.source})</span>
                        </div>
                        <span className="text-green-700">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-green-700 py-4">NO ACTIVE ALERTS</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
