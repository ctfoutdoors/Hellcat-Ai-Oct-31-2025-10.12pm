import { useState, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, DollarSign, Package, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface VendorHoverCardProps {
  vendorId: number;
  children: React.ReactNode;
}

export function VendorHoverCard({ vendorId, children }: VendorHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Delay fetch by 1 second after hover
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        setShouldFetch(true);
      }, 1000);
    } else {
      setShouldFetch(false);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const { data, isLoading } = trpc.crm.vendors.get.useQuery(
    { id: vendorId },
    { enabled: shouldFetch }
  );

  return (
    <HoverCard openDelay={0} closeDelay={200} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        align="start"
        sideOffset={5}
        alignOffset={-50}
        collisionPadding={{ top: 20, right: 20, bottom: 20, left: 20 }}
        className="w-96 p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=top]:slide-in-from-bottom-2 duration-200"
      >
        {isLoading || !data ? (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {data.vendor.name}
                  </h3>
                  <p className="text-sm text-slate-400">#{data.vendor.vendorNumber}</p>
                </div>
                {data.vendor.status && (
                  <Badge 
                    variant="outline" 
                    className={
                      data.vendor.status === 'active' 
                        ? "bg-green-500/20 text-green-300 border-green-500/50"
                        : "bg-red-500/20 text-red-300 border-red-500/50"
                    }
                  >
                    {data.vendor.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Contact</h4>
              {data.vendor.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-200">{data.vendor.email}</span>
                </div>
              )}
              {data.vendor.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-slate-200">{data.vendor.phone}</span>
                </div>
              )}
              {data.vendor.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-red-400 mt-0.5" />
                  <span className="text-slate-200">{data.vendor.address}</span>
                </div>
              )}
            </div>

            <Separator className="bg-slate-700" />

            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 uppercase">Total Spend</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${data.purchaseOrders?.reduce((sum: number, po: any) => sum + (parseFloat(po.totalAmount) || 0), 0).toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-slate-500 mt-1">From {data.purchaseOrders?.length || 0} POs</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-400 uppercase">Avg PO Value</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${data.purchaseOrders?.length 
                    ? (data.purchaseOrders.reduce((sum: number, po: any) => sum + (parseFloat(po.totalAmount) || 0), 0) / data.purchaseOrders.length).toFixed(2)
                    : '0.00'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Per order</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-slate-400 uppercase">Shipments</span>
                </div>
                <p className="text-2xl font-bold text-white">{data.shipments?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Active deliveries</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-slate-400 uppercase">Partner Since</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {new Date(data.vendor.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {Math.floor((Date.now() - new Date(data.vendor.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            {data.activities && data.activities.length > 0 && (
              <>
                <Separator className="bg-slate-700" />
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                    Recent Activity
                  </h4>
                  <div className="space-y-2">
                    {data.activities.slice(0, 3).map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                        <div>
                          <p className="text-slate-200 font-medium">{activity.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(activity.activityDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Open Issues */}
            {data.openIssues && data.openIssues > 0 && (
              <>
                <Separator className="bg-slate-700" />
                <div className="p-4 bg-amber-500/10 border-t border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <p className="text-sm text-amber-300 font-medium">
                      {data.openIssues} open issue{data.openIssues > 1 ? 's' : ''} requiring attention
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="p-4 bg-slate-800/30 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Right-click or double-click for quick actions
              </p>
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
