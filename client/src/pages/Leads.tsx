import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Leads() {
  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Leads</h1>
          <p className="text-muted-foreground">
            Lead management module
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Coming Soon
            </CardTitle>
            <CardDescription>
              This module will be implemented in Phase 3+
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The Leads module is part of the Intelligence system and will be built
              after the core carrier dispute management features are complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
