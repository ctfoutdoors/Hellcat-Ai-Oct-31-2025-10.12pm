import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  MapPin,
  Calendar,
  User,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface POCardProps {
  po: any;
}

export function POCard({ po }: POCardProps) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  
  // Fetch line items when expanded
  const { data: poDetail } = trpc.po.getDetail.useQuery(
    { id: po.id },
    { enabled: expanded }
  );

  const lineItems = poDetail?.lineItems || [];

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/po/${po.id}`);
  };

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="rounded-lg border">
      {/* Main Row with Hover Tooltip */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div
              className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
              onClick={handleToggle}
            >
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <div>
                  <p className="font-medium text-sm">PO #{po.poNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(po.orderDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(po.totalAmount)}</p>
                  <Badge variant="outline" className="text-xs">
                    {po.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewDetails}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="w-80">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">PO #{po.poNumber}</span>
                <Badge variant={po.status === 'delivered' ? 'default' : 'secondary'}>
                  {po.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Ordered: {new Date(po.orderDate).toLocaleDateString()}</span>
                </div>
                {po.expectedDeliveryDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
                  </div>
                )}
                {po.shipDate && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span>Shipped: {new Date(po.shipDate).toLocaleDateString()}</span>
                  </div>
                )}
                {po.receivedDate && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span>Received: {new Date(po.receivedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(po.subtotal || 0)}</span>
                </div>
                {po.shippingCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Shipping:</span>
                    <span>{formatCurrency(po.shippingCost)}</span>
                  </div>
                )}
                {po.tax > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Tax:</span>
                    <span>{formatCurrency(po.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-sm pt-1 border-t mt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(po.totalAmount)}</span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Expanded Line Items */}
      {expanded && (
        <div className="border-t bg-muted/20">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Line Items ({lineItems.length})</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleViewDetails}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Full Details
                </Button>
              </div>
            </div>
            
            {lineItems.length > 0 ? (
              <div className="space-y-2">
                {lineItems.map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between rounded-md bg-background p-3 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.sku || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Qty</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unit Cost</p>
                        <p className="font-medium">{formatCurrency(item.unitCost || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold">{formatCurrency((item.quantity || 0) * (item.unitCost || 0))}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loading line items...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
