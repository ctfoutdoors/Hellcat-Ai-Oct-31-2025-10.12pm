import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Package, DollarSign } from "lucide-react";

/**
 * Channel Analytics Widget
 * Displays order count and revenue breakdown by sales channel
 */
export default function ChannelAnalytics() {
  const { data, isLoading } = trpc.dashboard.getChannelAnalytics.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channel Analytics</CardTitle>
          <CardDescription>Order volume and revenue by channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const channels = data?.channels || [];
  const isDemo = data?.isDemo || false;

  // Calculate totals
  const totalOrders = channels.reduce((sum, ch) => sum + ch.orderCount, 0);
  const totalRevenue = channels.reduce((sum, ch) => sum + ch.revenue, 0);

  // Channel color mapping
  const channelColors: Record<string, string> = {
    eBay: "bg-blue-500",
    Amazon: "bg-orange-500",
    WooCommerce: "bg-purple-500",
    Shopify: "bg-green-500",
    Walmart: "bg-yellow-500",
    Unknown: "bg-gray-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Channel Analytics
          {isDemo && (
            <span className="text-xs font-normal text-muted-foreground">(Demo Data)</span>
          )}
        </CardTitle>
        <CardDescription>Order volume and revenue by channel</CardDescription>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No channel data available
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">
                    ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </div>

            {/* Channel Breakdown */}
            <div className="space-y-3">
              {channels.map((channel) => {
                const orderPercentage = totalOrders > 0 ? (channel.orderCount / totalOrders) * 100 : 0;
                const revenuePercentage = totalRevenue > 0 ? (channel.revenue / totalRevenue) * 100 : 0;
                const color = channelColors[channel.channel] || channelColors.Unknown;

                return (
                  <div key={channel.channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="font-medium">{channel.channel}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {channel.orderCount} orders • ${channel.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    {/* Order Volume Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Orders</span>
                        <span>{orderPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all`}
                          style={{ width: `${orderPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Revenue Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Revenue</span>
                        <span>{revenuePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all opacity-70`}
                          style={{ width: `${revenuePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
