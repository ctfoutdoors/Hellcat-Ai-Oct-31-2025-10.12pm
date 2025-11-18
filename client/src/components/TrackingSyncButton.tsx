import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TrackingSyncButtonProps {
  shipmentId?: number;
  trackingNumber: string;
  carrier: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function TrackingSyncButton({
  shipmentId,
  trackingNumber,
  carrier,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: TrackingSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<"success" | "error" | null>(null);

  const syncMutation = trpc.trackingAgent.syncSingle.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setLastResult("success");
        toast.success("Tracking data synced successfully", {
          description: `${carrier} ${trackingNumber} updated`,
        });
      } else {
        setLastResult("error");
        toast.error("Sync failed", {
          description: data.error || "Unknown error",
        });
      }
      setTimeout(() => setLastResult(null), 3000);
    },
    onError: (error) => {
      setLastResult("error");
      toast.error("Sync failed", {
        description: error.message,
      });
      setTimeout(() => setLastResult(null), 3000);
    },
    onSettled: () => {
      setSyncing(false);
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    syncMutation.mutate({
      shipmentId,
      trackingNumber,
      carrier,
    });
  };

  const getIcon = () => {
    if (syncing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (lastResult === "success") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (lastResult === "error") return <XCircle className="h-4 w-4 text-red-500" />;
    return <RefreshCw className="h-4 w-4" />;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={syncing}
      className="gap-2"
    >
      {getIcon()}
      {showLabel && (syncing ? "Syncing..." : "Sync Tracking")}
    </Button>
  );
}
