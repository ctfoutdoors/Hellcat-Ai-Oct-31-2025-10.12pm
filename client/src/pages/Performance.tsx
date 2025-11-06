import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function Performance() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
        <p className="text-gray-600 mt-2">
          Track team performance and case resolution efficiency
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Performance analytics feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              This feature will provide detailed performance metrics and KPIs
            </p>
            <p className="text-sm text-gray-400">
              Monitor case resolution times, recovery rates, and team productivity
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
