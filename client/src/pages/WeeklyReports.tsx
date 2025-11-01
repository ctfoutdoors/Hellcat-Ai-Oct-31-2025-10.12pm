import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download } from "lucide-react";

export default function WeeklyReports() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
          <p className="text-gray-600 mt-2">
            Automated weekly performance and recovery reports
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Automated weekly reporting feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileBarChart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              This feature will generate comprehensive weekly reports automatically
            </p>
            <p className="text-sm text-gray-400">
              Track recovery rates, case volumes, and carrier performance week over week
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
