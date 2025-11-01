import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Package, 
  ShoppingCart, 
  User, 
  MessageSquare, 
  Mail, 
  Target,
  ArrowRight,
  SkipForward
} from "lucide-react";

interface DynamicEnrichmentFlowProps {
  trackingNumber: string;
  onComplete: (data: any) => void;
  onSkip: () => void;
}

interface EnrichmentStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  status: "pending" | "loading" | "success" | "error";
  data?: any;
  error?: string;
}

export default function DynamicEnrichmentFlow({
  trackingNumber,
  onComplete,
  onSkip,
}: DynamicEnrichmentFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<EnrichmentStep[]>([
    {
      id: "shipstation",
      label: "ShipStation Data",
      icon: <Package className="w-5 h-5" />,
      description: "Fetching shipment details",
      status: "pending",
    },
    {
      id: "order_source",
      label: "Order Source",
      icon: <ShoppingCart className="w-5 h-5" />,
      description: "Identifying sales channel",
      status: "pending",
    },
    {
      id: "customer",
      label: "Customer Identity",
      icon: <User className="w-5 h-5" />,
      description: "Resolving customer profile",
      status: "pending",
    },
    {
      id: "reamaze",
      label: "Support History",
      icon: <MessageSquare className="w-5 h-5" />,
      description: "Loading support tickets",
      status: "pending",
    },
    {
      id: "klaviyo",
      label: "Marketing Data",
      icon: <Mail className="w-5 h-5" />,
      description: "Fetching engagement metrics",
      status: "pending",
    },
    {
      id: "risk_score",
      label: "Risk Analysis",
      icon: <Target className="w-5 h-5" />,
      description: "Calculating risk score",
      status: "pending",
    },
  ]);

  const enrichMutation = trpc.dataEnrichment.enrichByTracking.useMutation({
    onSuccess: (data) => {
      // Update steps with results
      setSteps(prev => prev.map(step => {
        const stepData = data.data.steps[step.id as keyof typeof data.data.steps];
        if (!stepData) return step;

        return {
          ...step,
          status: stepData.status === "success" ? "success" : "error",
          data: stepData.data,
          error: stepData.error,
        };
      }));

      // Move to completion
      setCurrentStepIndex(steps.length);
    },
    onError: (error) => {
      console.error("Enrichment error:", error);
      setSteps(prev => prev.map((step, idx) => 
        idx === currentStepIndex ? { ...step, status: "error", error: error.message } : step
      ));
    },
  });

  // Start enrichment on mount
  useEffect(() => {
    startEnrichment();
  }, []);

  const startEnrichment = () => {
    // Simulate step-by-step progress
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStepIndex(index);
        setSteps(prev => prev.map((s, i) => 
          i === index ? { ...s, status: "loading" } : s
        ));
      }, index * 1500);
    });

    // Actually call the API
    enrichMutation.mutate({ trackingNumber });
  };

  const getStatusIcon = (status: EnrichmentStep["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: EnrichmentStep["status"]) => {
    switch (status) {
      case "loading":
        return "bg-blue-500";
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const progress = (currentStepIndex / steps.length) * 100;
  const isComplete = currentStepIndex >= steps.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Enriching Case Data</h2>
        <p className="text-muted-foreground">
          Gathering information from multiple sources...
        </p>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Overall Progress</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Timeline */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card 
            key={step.id}
            className={`transition-all ${
              index === currentStepIndex 
                ? "ring-2 ring-primary shadow-lg" 
                : index < currentStepIndex 
                  ? "opacity-75" 
                  : "opacity-50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{step.label}</h3>
                    {step.status === "success" && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Complete
                      </Badge>
                    )}
                    {step.status === "error" && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        Failed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.status === "loading" 
                      ? step.description 
                      : step.status === "success"
                        ? "Data loaded successfully"
                        : step.status === "error"
                          ? step.error || "Failed to load data"
                          : "Waiting..."}
                  </p>

                  {/* Show data preview if available */}
                  {step.status === "success" && step.data && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      {step.id === "shipstation" && step.data.orderNumber && (
                        <span>Order #{step.data.orderNumber}</span>
                      )}
                      {step.id === "order_source" && step.data.channel && (
                        <span>Channel: {step.data.channel}</span>
                      )}
                      {step.id === "customer" && step.data.email && (
                        <span>Customer: {step.data.email}</span>
                      )}
                      {step.id === "reamaze" && step.data.stats && (
                        <span>{step.data.stats.totalTickets} tickets found</span>
                      )}
                      {step.id === "klaviyo" && step.data.stats && (
                        <span>LTV: ${(step.data.stats.lifetimeValue / 100).toFixed(2)}</span>
                      )}
                      {step.id === "risk_score" && step.data.overallScore !== undefined && (
                        <span>Risk Score: {step.data.overallScore}/100</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Step number */}
                <div className="flex-shrink-0 text-sm text-muted-foreground">
                  {index + 1}/{steps.length}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isComplete}
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Skip & Continue
        </Button>

        <Button
          onClick={() => onComplete(enrichMutation.data)}
          disabled={!isComplete}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Info Message */}
      <div className="text-center text-sm text-muted-foreground">
        {!isComplete ? (
          <p>You can skip this process and continue in the background</p>
        ) : (
          <p className="text-green-600 font-medium">All data loaded successfully!</p>
        )}
      </div>
    </div>
  );
}
