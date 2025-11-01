import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmbeddedBrowser } from './EmbeddedBrowser';
import {
  Package,
  User,
  MapPin,
  DollarSign,
  Ruler,
  Weight,
  Calendar,
  FileText,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface CaseData {
  id: number;
  caseNumber: string;
  trackingId?: string;
  carrier?: string;
  disputeAmount?: number;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientState?: string;
  recipientZip?: string;
  actualWeight?: number;
  actualLength?: number;
  actualWidth?: number;
  actualHeight?: number;
  claimedWeight?: number;
  claimedLength?: number;
  claimedWidth?: number;
  claimedHeight?: number;
  shipDate?: Date;
  deliveryDate?: Date;
  disputeReason?: string;
  status?: string;
}

interface DualScreenFormFillerProps {
  caseData: CaseData;
}

export function DualScreenFormFiller({ caseData }: DualScreenFormFillerProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // percentage
  const [isResizing, setIsResizing] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing) {
      const container = e.currentTarget as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setLeftPanelWidth(newWidth);
      }
    }
  };

  const expandLeft = () => {
    setLeftPanelWidth(Math.min(leftPanelWidth + 10, 80));
  };

  const expandRight = () => {
    setLeftPanelWidth(Math.max(leftPanelWidth - 10, 20));
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Dual-Screen Form Filler</h2>
        <p className="text-muted-foreground">
          Copy case data from the left panel and paste into the carrier portal on the right
        </p>
      </div>

      <div
        className="flex h-[calc(100vh-200px)] gap-1 relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Left Panel - Case Data */}
        <div
          className="overflow-y-auto pr-2"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <Card className="h-full">
            <CardHeader className="sticky top-0 bg-background z-10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Case #{caseData.caseNumber}</CardTitle>
                  <CardDescription>Click any field to copy to clipboard</CardDescription>
                </div>
                <Badge variant={caseData.status === 'Open' ? 'default' : 'secondary'}>
                  {caseData.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Shipment Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Shipment Information
                </h3>
                <div className="space-y-2">
                  {caseData.trackingId && (
                    <DataField
                      label="Tracking Number"
                      value={caseData.trackingId}
                      onCopy={() => copyToClipboard(caseData.trackingId!, 'Tracking number')}
                    />
                  )}
                  {caseData.carrier && (
                    <DataField
                      label="Carrier"
                      value={caseData.carrier}
                      onCopy={() => copyToClipboard(caseData.carrier!, 'Carrier')}
                    />
                  )}
                  {caseData.shipDate && (
                    <DataField
                      label="Ship Date"
                      value={new Date(caseData.shipDate).toLocaleDateString()}
                      onCopy={() => copyToClipboard(new Date(caseData.shipDate!).toLocaleDateString(), 'Ship date')}
                    />
                  )}
                  {caseData.deliveryDate && (
                    <DataField
                      label="Delivery Date"
                      value={new Date(caseData.deliveryDate).toLocaleDateString()}
                      onCopy={() => copyToClipboard(new Date(caseData.deliveryDate!).toLocaleDateString(), 'Delivery date')}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Recipient Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Recipient Information
                </h3>
                <div className="space-y-2">
                  {caseData.recipientName && (
                    <DataField
                      label="Name"
                      value={caseData.recipientName}
                      onCopy={() => copyToClipboard(caseData.recipientName!, 'Recipient name')}
                    />
                  )}
                  {caseData.recipientEmail && (
                    <DataField
                      label="Email"
                      value={caseData.recipientEmail}
                      onCopy={() => copyToClipboard(caseData.recipientEmail!, 'Email')}
                    />
                  )}
                  {caseData.recipientPhone && (
                    <DataField
                      label="Phone"
                      value={caseData.recipientPhone}
                      onCopy={() => copyToClipboard(caseData.recipientPhone!, 'Phone')}
                    />
                  )}
                  {caseData.recipientAddress && (
                    <DataField
                      label="Address"
                      value={caseData.recipientAddress}
                      onCopy={() => copyToClipboard(caseData.recipientAddress!, 'Address')}
                    />
                  )}
                  {caseData.recipientCity && (
                    <DataField
                      label="City"
                      value={caseData.recipientCity}
                      onCopy={() => copyToClipboard(caseData.recipientCity!, 'City')}
                    />
                  )}
                  {caseData.recipientState && (
                    <DataField
                      label="State"
                      value={caseData.recipientState}
                      onCopy={() => copyToClipboard(caseData.recipientState!, 'State')}
                    />
                  )}
                  {caseData.recipientZip && (
                    <DataField
                      label="ZIP Code"
                      value={caseData.recipientZip}
                      onCopy={() => copyToClipboard(caseData.recipientZip!, 'ZIP code')}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Dispute Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dispute Information
                </h3>
                <div className="space-y-2">
                  {caseData.disputeAmount && (
                    <DataField
                      label="Dispute Amount"
                      value={`$${caseData.disputeAmount.toFixed(2)}`}
                      onCopy={() => copyToClipboard(caseData.disputeAmount!.toString(), 'Dispute amount')}
                      highlight
                    />
                  )}
                  {caseData.disputeReason && (
                    <DataField
                      label="Reason"
                      value={caseData.disputeReason}
                      onCopy={() => copyToClipboard(caseData.disputeReason!, 'Dispute reason')}
                      multiline
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Package Dimensions - Actual */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Actual Package Dimensions
                </h3>
                <div className="space-y-2">
                  {caseData.actualWeight && (
                    <DataField
                      label="Weight"
                      value={`${caseData.actualWeight} lbs`}
                      onCopy={() => copyToClipboard(caseData.actualWeight!.toString(), 'Actual weight')}
                    />
                  )}
                  {caseData.actualLength && caseData.actualWidth && caseData.actualHeight && (
                    <>
                      <DataField
                        label="Dimensions (L×W×H)"
                        value={`${caseData.actualLength} × ${caseData.actualWidth} × ${caseData.actualHeight} in`}
                        onCopy={() => copyToClipboard(
                          `${caseData.actualLength}x${caseData.actualWidth}x${caseData.actualHeight}`,
                          'Dimensions'
                        )}
                      />
                      <DataField
                        label="Length"
                        value={`${caseData.actualLength} in`}
                        onCopy={() => copyToClipboard(caseData.actualLength!.toString(), 'Length')}
                      />
                      <DataField
                        label="Width"
                        value={`${caseData.actualWidth} in`}
                        onCopy={() => copyToClipboard(caseData.actualWidth!.toString(), 'Width')}
                      />
                      <DataField
                        label="Height"
                        value={`${caseData.actualHeight} in`}
                        onCopy={() => copyToClipboard(caseData.actualHeight!.toString(), 'Height')}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Package Dimensions - Claimed */}
              {(caseData.claimedWeight || caseData.claimedLength) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      Carrier Claimed Dimensions
                    </h3>
                    <div className="space-y-2">
                      {caseData.claimedWeight && (
                        <DataField
                          label="Weight"
                          value={`${caseData.claimedWeight} lbs`}
                          onCopy={() => copyToClipboard(caseData.claimedWeight!.toString(), 'Claimed weight')}
                        />
                      )}
                      {caseData.claimedLength && caseData.claimedWidth && caseData.claimedHeight && (
                        <DataField
                          label="Dimensions (L×W×H)"
                          value={`${caseData.claimedLength} × ${caseData.claimedWidth} × ${caseData.claimedHeight} in`}
                          onCopy={() => copyToClipboard(
                            `${caseData.claimedLength}x${caseData.claimedWidth}x${caseData.claimedHeight}`,
                            'Claimed dimensions'
                          )}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resize Handle */}
        <div
          className="w-2 bg-border hover:bg-primary cursor-col-resize relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={expandLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={expandRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel - Embedded Browser */}
        <div
          className="overflow-y-auto pl-2"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <EmbeddedBrowser caseData={caseData} />
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying data fields
interface DataFieldProps {
  label: string;
  value: string;
  onCopy: () => void;
  highlight?: boolean;
  multiline?: boolean;
}

function DataField({ label, value, onCopy, highlight, multiline }: DataFieldProps) {
  return (
    <div
      className={`flex items-start justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors group ${
        highlight ? 'bg-primary/5 border-primary/20' : ''
      }`}
      onClick={onCopy}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className={`font-medium ${multiline ? '' : 'truncate'} ${highlight ? 'text-primary' : ''}`}>
          {value}
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}
