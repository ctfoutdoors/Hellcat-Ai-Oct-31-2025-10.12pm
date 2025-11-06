import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";

export default function CRMAnalytics() {
  const stats = [
    { title: "Total Contacts", value: "247", icon: Users },
    { title: "Active Deals", value: "18", icon: Briefcase },
    { title: "Pipeline Value", value: "$145,500", icon: DollarSign },
    { title: "Win Rate", value: "68%", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Analytics</h1>
        <p className="text-muted-foreground mt-2">Sales and relationship metrics</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
