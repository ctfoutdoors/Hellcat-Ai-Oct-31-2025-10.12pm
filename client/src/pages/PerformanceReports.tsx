import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Award, Target } from "lucide-react";

export default function PerformanceReports() {
  const team = [
    { name: "Sarah Johnson", cases: 45, recovered: "$12,340", successRate: "93%" },
    { name: "Mike Chen", cases: 38, recovered: "$9,870", successRate: "89%" },
    { name: "Emily Davis", cases: 34, recovered: "$8,450", successRate: "91%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Reports</h1>
        <p className="text-muted-foreground mt-2">Team member performance metrics</p>
      </div>

      <div className="grid gap-4">
        {team.map((member, idx) => (
          <Card key={member.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {member.name}
                </div>
                {idx === 0 && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Top Performer</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Cases Handled</div>
                  <div className="text-2xl font-bold">{member.cases}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount Recovered</div>
                  <div className="text-2xl font-bold">{member.recovered}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {member.successRate}
                    <Target className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
