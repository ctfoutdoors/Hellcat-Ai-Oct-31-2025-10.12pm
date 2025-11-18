import { useState, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, DollarSign, Package, Calendar, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CustomerHoverCardProps {
  customerId: number;
  children: React.ReactNode;
}

export function CustomerHoverCard({ customerId, children }: CustomerHoverCardProps) {
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

  const { data, isLoading } = trpc.crm.customers.get.useQuery(
    { id: customerId },
    { enabled: shouldFetch }
  );

  return (
    <HoverCard openDelay={0} closeDelay={200} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="center"
        sideOffset={10}
        alignOffset={0}
        collisionPadding={20}
        className="w-96 p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 shadow-2xl z-50"
      >
        {isLoading || !data ? (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {data.customer.companyName || `${data.customer.firstName} ${data.customer.lastName}`}
                  </h3>
                  <p className="text-sm text-slate-400">#{data.customer.customerNumber}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                    {data.customer.customerType}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                    {data.customer.businessType}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Contact</h4>
              {data.customer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-200">{data.customer.email}</span>
                </div>
              )}
              {data.customer.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-slate-200">{data.customer.phone}</span>
                </div>
              )}
              {data.customer.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-red-400 mt-0.5" />
                  <span className="text-slate-200">
                    {data.customer.address}
                    {data.customer.city && `, ${data.customer.city}`}
                    {data.customer.state && `, ${data.customer.state}`}
                    {data.customer.zip && ` ${data.customer.zip}`}
                  </span>
                </div>
              )}
            </div>

            <Separator className="bg-slate-700" />

            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 uppercase">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${data.orders?.reduce((sum: number, order: any) => sum + (parseFloat(order.orderTotal) || 0), 0).toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-slate-500 mt-1">From {data.orders?.length || 0} orders</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-400 uppercase">Avg Order</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${data.orders?.length 
                    ? (data.orders.reduce((sum: number, order: any) => sum + (parseFloat(order.orderTotal) || 0), 0) / data.orders.length).toFixed(2)
                    : '0.00'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Per transaction</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-slate-400 uppercase">Shipments</span>
                </div>
                <p className="text-2xl font-bold text-white">{data.shipments?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Tracked packages</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-slate-400 uppercase">Customer Since</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {new Date(data.customer.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {Math.floor((Date.now() - new Date(data.customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
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
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
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
