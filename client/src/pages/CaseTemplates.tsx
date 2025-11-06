import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export default function CaseTemplates() {
  const templates = [
    { name: "Late Delivery SLA", type: "SLA Violations", uses: 45 },
    { name: "Damaged Package", type: "Package Damages", uses: 32 },
    { name: "Lost Package", type: "Lost Packages", uses: 28 },
    { name: "Billing Adjustment", type: "Billing Adjustments", uses: 19 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Case Templates</h1>
          <p className="text-muted-foreground mt-2">Reusable templates for common dispute types</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />New Template</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.name} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {template.name}
              </CardTitle>
              <CardDescription>{template.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Used {template.uses} times</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
