import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CaptureProofProps {
  caseId: number;
  onSuccess?: () => void;
}

export function CaptureProof({ caseId, onSuccess }: CaptureProofProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  // Temporarily disabled - endpoint commented out
  const captureProofMutation = { mutate: () => {}, isLoading: false } as any;
  /*
  const captureProofMutation = trpc.cases.captureProof.useMutation({
    onSuccess: () => {
      toast.success("Proof captured successfully!");
      setOpen(false);
      setUrl("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to capture proof: ${error.message}`);
    },
  });
  */

  const handleCapture = async () => {
    if (!url.trim()) {
      toast.error("Please enter a tracking URL");
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsCapturing(true);
    // Temporarily disabled
    toast.info("Capture proof feature temporarily disabled");
    setIsCapturing(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        Capture Proof
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Capture Tracking Proof</DialogTitle>
            <DialogDescription>
              Enter the carrier tracking page URL to capture a screenshot as evidence.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tracking-url">Tracking Page URL</Label>
              <Input
                id="tracking-url"
                placeholder="https://www.fedex.com/fedextrack/?tracknumbers=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isCapturing}
              />
              <p className="text-sm text-muted-foreground">
                Examples: FedEx, UPS, USPS, DHL tracking pages
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-medium mb-2">How it works:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Enter the carrier's tracking page URL</li>
                <li>We'll capture a full-page screenshot</li>
                <li>Screenshot will be attached to this case</li>
                <li>Use as evidence for your dispute</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCapturing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCapture}
              disabled={isCapturing || !url.trim()}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Screenshot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
