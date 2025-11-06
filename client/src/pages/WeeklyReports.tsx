import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WeeklyReports() {
  const weeks = [
    { week: "Week of Jan 20, 2025", cases: 23, recovered: "$5,430", successRate: "91%" },
    { week: "Week of Jan 13, 2025", cases: 19, recovered: "$4,210", successRate: "87%" },
    { week: "Week of Jan 6, 2025", cases: 21, recovered: "$4,890", successRate: "89%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Weekly Reports</h1>
          <p className="text-muted-foreground mt-2">Weekly performance summaries</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      <div className="grid gap-4">
        {weeks.map((week) => (
          <Card key={week.week}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {week.week}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Cases Handled</div>
                  <div className="text-2xl font-bold">{week.cases}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount Recovered</div>
                  <div className="text-2xl font-bold">{week.recovered}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-2xl font-bold">{week.successRate}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
