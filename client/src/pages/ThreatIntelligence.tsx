import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ThreatIntelligence() {
  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Threat Intelligence</h1>
          <p className="text-muted-foreground">
            Intelligence gathering and analysis module
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Module Under Development
            </CardTitle>
            <CardDescription>
              This intelligence module will be implemented in a future phase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The Threat Intelligence module is part of the comprehensive intelligence system
              that will be built after the core carrier dispute management features are complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
