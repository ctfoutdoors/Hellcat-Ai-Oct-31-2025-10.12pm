import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Chrome,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Link as LinkIcon,
  FileText,
  AlertCircle,
  Settings,
  Zap,
  Activity,
  DollarSign,
  Package,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type SyncStatus = "idle" | "running" | "paused" | "completed" | "error";
type SessionStatus = "disconnected" | "connected" | "checking";
type Priority = "high" | "medium" | "low";

interface AIThought {
  id: number;
  timestamp: Date;
  thought: string;
  action: string;
  confidence: number;
  reasoning: string[];
}

interface SyncLog {
  id: number;
  timestamp: Date;
  action: string;
  status: "success" | "error" | "info";
  details: string;
  screenshot?: string;
  adjustmentId?: string;
}

interface AdjustmentRecord {
  adjustmentId: string;
  trackingNumber: string;
  carrier: string;
  adjDate: string;
  service: string;
  weight: string;
  dimensions: string;
  adjustmentAmount: string;
  reason: string;
  toZip: string;
  toCountry: string;
  screenshot: string;
  category: string;
  priority: Priority;
  caseId?: string;
}

let thoughtIdCounter = 0;
let logIdCounter = 0;

export default function ShipStationAutoImport() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("disconnected");
  const [autoSyncInterval, setAutoSyncInterval] = useState("30");
  const [recordsImported, setRecordsImported] = useState(0);
  const [screenshotsCaptured, setScreenshotsCaptured] = useState(0);
  const [adjustmentsFound, setAdjustmentsFound] = useState(0);
  const [failedImports, setFailedImports] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState(0);
  
  const [aiThoughts, setAiThoughts] = useState<AIThought[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [processedAdjustments, setProcessedAdjustments] = useState<AdjustmentRecord[]>([
    {
      adjustmentId: "0000099938479926",
      trackingNumber: "9405511206217839012976",
      carrier: "USPS",
      adjDate: "10/29/2025",
      service: "Priority Mail (R)",
      weight: "3 lbs. 13 oz.",
      dimensions: '92" x 2" x 2"',
      adjustmentAmount: "-$4.39",
      reason: "Inaccurate package weight",
      toZip: "404847569",
      toCountry: "United States",
      screenshot: "/api/screenshots/adj-0000099938479926.png",
      category: "Weight Discrepancy",
      priority: "low",
      caseId: "CASE-2024-156",
    },
  ]);

  const handleCheckSession = async () => {
    setSessionStatus("checking");
    toast.info("Checking ShipStation session...");
    addAIThought(
      "Initiating session check",
      "Verify ShipStation authentication",
      95,
      ["Checking browser cookies", "Validating session token", "Testing API access"]
    );
    
    setTimeout(() => {
      setSessionStatus("connected");
      toast.success("ShipStation session active!");
      addLog("Session Check", "success", "ShipStation session verified and active");
      addAIThought(
        "Session verified successfully",
        "Ready to begin automation",
        100,
        ["Session token valid", "User authenticated", "API endpoints accessible"]
      );
    }, 2000);
  };

  const handleStartSync = () => {
    if (sessionStatus !== "connected") {
      toast.error("Please connect to ShipStation first");
      return;
    }

    setSyncStatus("running");
    setProgress(0);
    toast.success("USPS Adjustment auto-import started");
    addLog("Sync Started", "info", "USPS Adjustment import process initiated");
    addAIThought(
      "Starting automated import workflow",
      "Navigate to USPS reports",
      100,
      ["Session active", "Browser ready", "Starting navigation sequence"]
    );

    simulateUSPSAdjustmentWorkflow();
  };

  const handlePauseSync = () => {
    setSyncStatus("paused");
    toast.info("Auto-import paused");
    addLog("Sync Paused", "info", "Import process paused");
  };

  const handleStopSync = () => {
    setSyncStatus("idle");
    setCurrentStep("");
    setProgress(0);
    toast.info("Auto-import stopped");
    addLog("Sync Stopped", "info", "Import process stopped");
  };

  const categorizeAdjustment = (reason: string, amount: string): { category: string; priority: Priority } => {
    const amountNum = Math.abs(parseFloat(amount.replace(/[^0-9.-]/g, "")));
    
    let category = "Other";
    if (reason.toLowerCase().includes("weight")) {
      category = "Weight Discrepancy";
    } else if (reason.toLowerCase().includes("dimension")) {
      category = "Dimension Error";
    } else if (reason.toLowerCase().includes("service")) {
      category = "Service Mismatch";
    } else if (reason.toLowerCase().includes("zone") || reason.toLowerCase().includes("zip")) {
      category = "Zone/ZIP Error";
    }

    let priority: Priority = "low";
    if (amountNum >= 10) {
      priority = "high";
    } else if (amountNum >= 5) {
      priority = "medium";
    }

    return { category, priority };
  };

  const simulateUSPSAdjustmentWorkflow = () => {
    const workflow = [
      {
        step: "Navigate to Carriers",
        progress: 10,
        action: () => {
          setCurrentStep("Navigating to https://ship14.shipstation.com/settings/carriers");
          addLog("Navigate to Carriers", "info", "Opening carriers settings page");
          addAIThought(
            "Navigating to carriers page",
            "Open ShipStation carriers settings",
            98,
            ["URL: ship14.shipstation.com/settings/carriers", "Method: Direct navigation", "Expected: Carriers list page"]
          );
        },
        delay: 2000,
      },
      {
        step: "Click 3-Dots Menu",
        progress: 20,
        action: () => {
          setCurrentStep("Clicking 3-dots action menu");
          addLog("Click Action Menu", "info", "Opening carrier action menu");
          addAIThought(
            "Located action menu",
            "Click 3-dots menu button",
            97,
            ["Element: button.action-menu", "Position: Top right of carrier card", "Action: Click"]
          );
        },
        delay: 1500,
      },
      {
        step: "Click View Report",
        progress: 30,
        action: () => {
          setCurrentStep("Clicking 'View Report' option");
          addLog("Click View Report", "success", "Navigating to USPS reports");
          addAIThought(
            "Found 'View Report' option",
            "Navigate to USPS reports page",
            99,
            ["Menu item: 'View Report'", "Target: USPS adjustment reports", "Redirect expected"]
          );
        },
        delay: 2000,
      },
      {
        step: "Verify Report Page",
        progress: 40,
        action: () => {
          setCurrentStep("Verifying https://or.stamps.com/ORReports/default2.aspx");
          addLog("Verify Report Page", "success", "Landed on USPS reports page");
          addAIThought(
            "Verified report page loaded",
            "Prepare to scan for adjustments",
            100,
            ["URL matches expected", "Page elements loaded", "Ready to extract data"]
          );
        },
        delay: 1500,
      },
      {
        step: "Scan for Adjustments",
        progress: 50,
        action: () => {
          setCurrentStep("Scanning page for 'Adjustment ID' links");
          const count = Math.floor(Math.random() * 20) + 10;
          setAdjustmentsFound(count);
          addLog("Scan Adjustments", "success", `Found ${count} Adjustment ID links`);
          addAIThought(
            `Detected ${count} adjustment records`,
            "Begin processing each adjustment",
            95,
            [`Selector: a[href*="Adjustment"]`, `Found: ${count} links`, "Starting sequential processing"]
          );
        },
        delay: 2000,
      },
      {
        step: "Process Adjustment 1",
        progress: 60,
        action: () => {
          setCurrentStep("Clicking Adjustment ID link");
          addLog("Click Adjustment Link", "info", "Opening adjustment details modal");
          addAIThought(
            "Clicking adjustment link",
            "Open details modal",
            98,
            ["Target: Adjustment ID 0000099938479926", "Action: Click link", "Expected: Modal popup"]
          );
        },
        delay: 1500,
      },
      {
        step: "Wait for Modal",
        progress: 65,
        action: () => {
          setCurrentStep("Waiting for modal to load");
          addLog("Modal Loaded", "success", "Adjustment Details modal opened");
          addAIThought(
            "Modal loaded successfully",
            "Extract shipment data",
            100,
            ["Modal visible", "Content loaded", "Ready for data extraction"]
          );
        },
        delay: 1000,
      },
      {
        step: "Capture Screenshot",
        progress: 70,
        action: () => {
          setCurrentStep("Capturing full-page screenshot");
          setScreenshotsCaptured((prev) => prev + 1);
          addLog("Screenshot Captured", "success", "Full-page screenshot saved", "/api/screenshots/adj-" + Date.now() + ".png");
          addAIThought(
            "Screenshot captured",
            "Preserve visual evidence",
            100,
            ["Format: PNG", "Resolution: Full page", "Saved to: /api/screenshots/"]
          );
        },
        delay: 1500,
      },
      {
        step: "Extract Data",
        progress: 75,
        action: () => {
          setCurrentStep("Extracting shipment details from modal");
          addLog("Extract Data", "success", "Extracted: Tracking #, Date, Carrier, Service, Weight, Dimensions, Amount");
          addAIThought(
            "Data extraction complete",
            "Parse and validate fields",
            96,
            [
              "Tracking: 9405511206217839012976",
              "Weight: 3 lbs. 13 oz.",
              "Amount: -$4.39",
              "Reason: Inaccurate package weight"
            ]
          );
        },
        delay: 1500,
      },
      {
        step: "Categorize",
        progress: 80,
        action: () => {
          setCurrentStep("AI categorizing adjustment");
          const { category, priority } = categorizeAdjustment("Inaccurate package weight", "-$4.39");
          addAIThought(
            `Categorized as: ${category}`,
            `Priority: ${priority.toUpperCase()}`,
            93,
            [
              `Reason analysis: "Inaccurate package weight"`,
              `Amount: $4.39 → Priority: ${priority}`,
              `Category: ${category}`,
              `Decision: Auto-create case with ${priority} priority`
            ]
          );
        },
        delay: 1500,
      },
      {
        step: "Create Case",
        progress: 90,
        action: () => {
          setCurrentStep("Creating case with extracted data");
          setRecordsImported((prev) => prev + 1);
          const caseId = "CASE-2024-" + (Math.floor(Math.random() * 900) + 100);
          addLog("Create Case", "success", `Case ${caseId} created with screenshot attached`, undefined, "ADJ-" + Date.now());
          addAIThought(
            `Case ${caseId} created`,
            "Attach screenshot and metadata",
            100,
            [
              `Case ID: ${caseId}`,
              "Type: USPS Adjustment",
              "Priority: LOW",
              "Screenshot attached",
              "Status: Open"
            ]
          );
        },
        delay: 1500,
      },
      {
        step: "Click Close",
        progress: 95,
        action: () => {
          setCurrentStep("Clicking 'Close' button");
          addLog("Close Modal", "info", "Closed adjustment details modal");
          addAIThought(
            "Modal closed",
            "Continue to next adjustment",
            100,
            ["Action: Click Close button", "Modal dismissed", "Ready for next record"]
          );
        },
        delay: 1000,
      },
      {
        step: "Complete",
        progress: 100,
        action: () => {
          setCurrentStep("");
          setSyncStatus("completed");
          toast.success(`Sync completed! Processed ${recordsImported + 1} adjustments`);
          addLog("Sync Completed", "success", `Successfully imported ${recordsImported + 1} USPS adjustments with screenshots`);
          addAIThought(
            "Workflow completed successfully",
            "All adjustments processed",
            100,
            [
              `Total processed: ${recordsImported + 1}`,
              `Screenshots: ${screenshotsCaptured + 1}`,
              `Success rate: 100%`,
              "Ready for next sync"
            ]
          );
        },
        delay: 1000,
      },
    ];

    let stepIndex = 0;
    const executeStep = () => {
      if (stepIndex >= workflow.length) return;
      
      const current = workflow[stepIndex];
      setProgress(current.progress);
      current.action();
      stepIndex++;
      
      setTimeout(executeStep, current.delay);
    };

    executeStep();
  };

  const addAIThought = (thought: string, action: string, confidence: number, reasoning: string[]) => {
    thoughtIdCounter++;
    const newThought: AIThought = {
      id: thoughtIdCounter,
      timestamp: new Date(),
      thought,
      action,
      confidence,
      reasoning,
    };
    setAiThoughts((prev) => [newThought, ...prev].slice(0, 50));
  };

  const addLog = (action: string, status: "success" | "error" | "info", details: string, screenshot?: string, adjustmentId?: string) => {
    logIdCounter++;
    const newLog: SyncLog = {
      id: logIdCounter,
      timestamp: new Date(),
      action,
      status,
      details,
      screenshot,
      adjustmentId,
    };
    setSyncLogs((prev) => [newLog, ...prev].slice(0, 100));
  };

  const getStatusBadge = (status: SyncStatus) => {
    const config = {
      idle: { variant: "secondary" as const, icon: Clock, label: "Idle" },
      running: { variant: "default" as const, icon: Activity, label: "Running" },
      paused: { variant: "secondary" as const, icon: Pause, label: "Paused" },
      completed: { variant: "default" as const, icon: CheckCircle2, label: "Completed" },
      error: { variant: "destructive" as const, icon: XCircle, label: "Error" },
    };

    const { variant, icon: Icon, label } = config[status];

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getSessionBadge = (status: SessionStatus) => {
    const config = {
      disconnected: { variant: "destructive" as const, label: "Disconnected" },
      connected: { variant: "default" as const, label: "Connected" },
      checking: { variant: "secondary" as const, label: "Checking..." },
    };

    const { variant, label } = config[status];

    return <Badge variant={variant}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: Priority) => {
    const config = {
      high: { variant: "destructive" as const, icon: TrendingUp, label: "High" },
      medium: { variant: "default" as const, icon: Minus, label: "Medium" },
      low: { variant: "secondary" as const, icon: TrendingDown, label: "Low" },
    };

    const { variant, icon: Icon, label } = config[priority];

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const successRate = adjustmentsFound > 0 ? ((recordsImported / adjustmentsFound) * 100).toFixed(1) : "0";

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Chrome className="h-8 w-8" />
            USPS Adjustment Auto-Import
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered browser automation with real-time thinking analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckSession} disabled={sessionStatus === "checking"}>
            <RefreshCw className={`h-4 w-4 mr-2 ${sessionStatus === "checking" ? "animate-spin" : ""}`} />
            Check Session
          </Button>
        </div>
      </div>

      {/* Current Step Banner */}
      {currentStep && (
        <div className="mb-6 space-y-2">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium flex-1">{currentStep}</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* AI Activity Dashboard */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getSessionBadge(sessionStatus)}
              <Chrome className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Adjustments Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{adjustmentsFound}</span>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Successfully Imported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">{recordsImported}</span>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failed Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-red-600">{failedImports}</span>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{successRate}%</span>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Control Panel
              </CardTitle>
              <CardDescription>Manage automation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sync Status</label>
                <div>{getStatusBadge(syncStatus)}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-Sync Interval</label>
                <Select value={autoSyncInterval} onValueChange={setAutoSyncInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                    <SelectItem value="120">Every 2 hours</SelectItem>
                    <SelectItem value="240">Every 4 hours</SelectItem>
                    <SelectItem value="manual">Manual only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <div className="flex flex-col gap-2">
                  {syncStatus === "idle" || syncStatus === "completed" ? (
                    <Button onClick={handleStartSync} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Start Auto-Import
                    </Button>
                  ) : syncStatus === "running" ? (
                    <>
                      <Button onClick={handlePauseSync} variant="secondary" className="w-full">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button onClick={handleStopSync} variant="destructive" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleStartSync} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                      <Button onClick={handleStopSync} variant="destructive" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium">Workflow Steps</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {[
                    "Navigate to carriers settings",
                    "Click 3-dots → View Report",
                    "Scan for Adjustment ID links",
                    "Click each adjustment link",
                    "Capture full-page screenshot",
                    "Extract shipment details",
                    "AI categorize & prioritize",
                    "Create case + attach screenshot",
                    "Click Close & continue",
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-primary">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processed Adjustments Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processedAdjustments.slice(0, 5).map((adj) => (
                  <div key={adj.adjustmentId} className="p-2 rounded border bg-card text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium">{adj.adjustmentId}</span>
                      {getPriorityBadge(adj.priority)}
                    </div>
                    <div className="text-muted-foreground">{adj.trackingNumber}</div>
                    <div className="text-xs text-muted-foreground">{adj.category}</div>
                    <div className="flex justify-between mt-1">
                      <span>{adj.adjDate}</span>
                      <span className="font-medium text-red-500">{adj.adjustmentAmount}</span>
                    </div>
                    {adj.caseId && (
                      <div className="text-xs text-primary font-mono">→ {adj.caseId}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Thinking Panel + Activity Log */}
        <div className="col-span-2 space-y-4">
          {/* AI Thinking Panel */}
          <Card className="border-primary/50">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Thinking
                <Badge variant="outline" className="ml-auto">Real-time</Badge>
              </CardTitle>
              <CardDescription>Live AI reasoning and decision-making process</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {aiThoughts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>AI thinking will appear here during automation</p>
                  </div>
                ) : (
                  aiThoughts.map((thought) => (
                    <div
                      key={thought.id}
                      className="p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{thought.thought}</div>
                          <div className="text-xs text-primary mt-1">→ {thought.action}</div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {thought.confidence}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {thought.reasoning.map((reason, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {thought.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>Automation execution history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {syncLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Activity log will appear here</p>
                  </div>
                ) : (
                  syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-1">
                        {log.status === "success" && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {log.status === "error" && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {log.status === "info" && (
                          <AlertCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{log.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                        {log.adjustmentId && (
                          <div className="flex items-center gap-2 text-xs font-mono text-primary">
                            <FileText className="h-3 w-3" />
                            Adjustment ID: {log.adjustmentId}
                          </div>
                        )}
                        {log.screenshot && (
                          <div className="flex items-center gap-2 text-xs text-blue-500">
                            <Camera className="h-3 w-3" />
                            Screenshot: {log.screenshot}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflow Diagram */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            USPS Adjustment Import Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-9 gap-2">
            {[
              { step: 1, title: "Carriers Page", icon: Chrome },
              { step: 2, title: "3-Dots Menu", icon: Settings },
              { step: 3, title: "View Report", icon: FileText },
              { step: 4, title: "Scan Links", icon: LinkIcon },
              { step: 5, title: "Click Adj ID", icon: LinkIcon },
              { step: 6, title: "Screenshot", icon: Camera },
              { step: 7, title: "AI Categorize", icon: Brain },
              { step: 8, title: "Create Case", icon: Package },
              { step: 9, title: "Close & Next", icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs font-medium leading-tight">{item.title}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
