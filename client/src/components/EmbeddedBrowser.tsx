import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, RefreshCw, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CarrierPortal {
  id: string;
  name: string;
  url: string;
  description: string;
  supportsIframe: boolean;
}

const CARRIER_PORTALS: CarrierPortal[] = [
  {
    id: 'fedex',
    name: 'FedEx Billing Online',
    url: 'https://www.fedex.com/en-us/billing-and-invoicing.html',
    description: 'FedEx billing and dispute portal',
    supportsIframe: false, // Most carrier portals block iframes
  },
  {
    id: 'ups',
    name: 'UPS Billing Center',
    url: 'https://www.ups.com/lasso/login',
    description: 'UPS billing and claims portal',
    supportsIframe: false,
  },
  {
    id: 'usps',
    name: 'USPS Claims',
    url: 'https://www.usps.com/help/claims.htm',
    description: 'USPS claims and refunds',
    supportsIframe: false,
  },
  {
    id: 'dhl',
    name: 'DHL Express',
    url: 'https://mydhl.express.dhl/us/en/home.html',
    description: 'DHL Express portal',
    supportsIframe: false,
  },
];

interface EmbeddedBrowserProps {
  caseData?: {
    trackingId?: string;
    carrier?: string;
    disputeAmount?: number;
    recipientName?: string;
    recipientAddress?: string;
    actualWeight?: number;
    actualLength?: number;
    actualWidth?: number;
    actualHeight?: number;
  };
}

export function EmbeddedBrowser({ caseData }: EmbeddedBrowserProps) {
  const [selectedPortal, setSelectedPortal] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [iframeError, setIframeError] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const portal = CARRIER_PORTALS.find(p => p.id === selectedPortal);

  const handlePortalChange = (portalId: string) => {
    setSelectedPortal(portalId);
    setIframeError(false);
    const selectedPortal = CARRIER_PORTALS.find(p => p.id === portalId);
    if (selectedPortal) {
      setCustomUrl(selectedPortal.url);
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenExternal = () => {
    const url = customUrl || portal?.url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  useEffect(() => {
    // Detect iframe load errors (X-Frame-Options blocking)
    const handleIframeError = () => {
      setIframeError(true);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('error', handleIframeError);
      return () => iframe.removeEventListener('error', handleIframeError);
    }
  }, [customUrl]);

  return (
    <div className="space-y-4">
      {/* Portal Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Carrier Portal Access</CardTitle>
          <CardDescription>
            Select a carrier portal to file disputes or access billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Carrier Portal</Label>
              <Select value={selectedPortal} onValueChange={handlePortalChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a carrier portal..." />
                </SelectTrigger>
                <SelectContent>
                  {CARRIER_PORTALS.map(portal => (
                    <SelectItem key={portal.id} value={portal.id}>
                      {portal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenExternal}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {portal && (
            <div className="text-sm text-muted-foreground">
              {portal.description}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Data Quick Copy */}
      {caseData && (
        <Card>
          <CardHeader>
            <CardTitle>Case Data - Quick Copy</CardTitle>
            <CardDescription>
              Click to copy values for pasting into carrier forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {caseData.trackingId && (
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() => copyToClipboard(caseData.trackingId!, 'Tracking number')}
                >
                  <span className="text-xs text-muted-foreground mr-2">Tracking:</span>
                  <span className="font-mono">{caseData.trackingId}</span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
              )}

              {caseData.carrier && (
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() => copyToClipboard(caseData.carrier!, 'Carrier')}
                >
                  <span className="text-xs text-muted-foreground mr-2">Carrier:</span>
                  <span>{caseData.carrier}</span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
              )}

              {caseData.disputeAmount && (
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() => copyToClipboard(caseData.disputeAmount!.toString(), 'Dispute amount')}
                >
                  <span className="text-xs text-muted-foreground mr-2">Amount:</span>
                  <span className="font-semibold">${caseData.disputeAmount.toFixed(2)}</span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
              )}

              {caseData.recipientName && (
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() => copyToClipboard(caseData.recipientName!, 'Recipient name')}
                >
                  <span className="text-xs text-muted-foreground mr-2">Name:</span>
                  <span>{caseData.recipientName}</span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
              )}

              {caseData.recipientAddress && (
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() => copyToClipboard(caseData.recipientAddress!, 'Address')}
                >
                  <span className="text-xs text-muted-foreground mr-2">Address:</span>
                  <span className="truncate max-w-[150px]">{caseData.recipientAddress}</span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
              )}

              {caseData.actualWeight && (
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() => copyToClipboard(caseData.actualWeight!.toString(), 'Weight')}
                >
                  <span className="text-xs text-muted-foreground mr-2">Weight:</span>
                  <span>{caseData.actualWeight} lbs</span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
              )}

              {caseData.actualLength && caseData.actualWidth && caseData.actualHeight && (
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() => copyToClipboard(
                    `${caseData.actualLength}x${caseData.actualWidth}x${caseData.actualHeight}`,
                    'Dimensions'
                  )}
                >
                  <span className="text-xs text-muted-foreground mr-2">Dimensions:</span>
                  <span className="font-mono text-xs">
                    {caseData.actualLength}×{caseData.actualWidth}×{caseData.actualHeight}
                  </span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Embedded Browser or External Link */}
      <Card>
        <CardHeader>
          <CardTitle>Portal View</CardTitle>
        </CardHeader>
        <CardContent>
          {!customUrl && !portal ? (
            <div className="flex items-center justify-center h-[600px] bg-muted/20 rounded-lg border-2 border-dashed">
              <div className="text-center space-y-2">
                <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a carrier portal to begin
                </p>
              </div>
            </div>
          ) : portal && !portal.supportsIframe ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                    External Portal Access Required
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    {portal.name} does not allow embedding due to security policies (X-Frame-Options).
                    Click the button below to open the portal in a new tab.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-[500px] bg-muted/10 rounded-lg border">
                <ExternalLink className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{portal.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md text-center">
                  Use the quick copy buttons above to easily paste case data into the carrier's form
                </p>
                <Button size="lg" onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open {portal.name} in New Tab
                </Button>
              </div>
            </div>
          ) : iframeError ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100">
                    Unable to Embed Portal
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    This portal cannot be embedded due to security restrictions.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-[500px] bg-muted/10 rounded-lg border">
                <Button size="lg" onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab Instead
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <iframe
                ref={iframeRef}
                src={customUrl || portal?.url}
                className="w-full h-[600px] border rounded-lg"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                title="Carrier Portal"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Select your carrier portal from the dropdown above</li>
            <li>The portal will open in a new tab (most carriers block embedding for security)</li>
            <li>Log in to the carrier portal using your credentials</li>
            <li>Navigate to the dispute or billing adjustment section</li>
            <li>Use the "Quick Copy" buttons to copy case data</li>
            <li>Paste the values into the carrier's form fields</li>
            <li>Submit your dispute through the carrier's portal</li>
            <li>Return here to update the case status</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
