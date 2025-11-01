import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export default function CaseTemplates() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Templates</h1>
          <p className="text-gray-600 mt-2">
            Save and reuse case templates for common dispute scenarios
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Case template management feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              This feature will allow you to create reusable templates for common dispute types
            </p>
            <p className="text-sm text-gray-400">
              Save time by using pre-configured templates with standard evidence and arguments
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
