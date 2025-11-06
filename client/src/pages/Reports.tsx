import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, CheckCircle } from "lucide-react";

export default function Reports() {
  const stats = [
    { title: "Total Cases", value: "247", change: "+12%", trend: "up", icon: Package },
    { title: "Success Rate", value: "89%", change: "+5%", trend: "up", icon: CheckCircle },
    { title: "Recovered Amount", value: "$45,230", change: "+18%", trend: "up", icon: DollarSign },
    { title: "Pending Cases", value: "34", change: "-8%", trend: "down", icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">Key metrics and performance indicators</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs flex items-center gap-1 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  <TrendIcon className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cases by Carrier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { carrier: "UPS", cases: 89, percent: 36 },
                { carrier: "FedEx", cases: 67, percent: 27 },
                { carrier: "USPS", cases: 54, percent: 22 },
                { carrier: "DHL", cases: 37, percent: 15 },
              ].map((item) => (
                <div key={item.carrier} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.carrier}</span>
                    <span className="text-muted-foreground">{item.cases} cases</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: "Open", count: 45, color: "bg-blue-500" },
                { status: "Investigating", count: 67, color: "bg-yellow-500" },
                { status: "Resolved", count: 102, color: "bg-green-500" },
                { status: "Closed", count: 33, color: "bg-gray-500" },
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
