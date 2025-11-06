import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";

export default function CRMCompanies() {
  const companies = [
    { name: "Acme Corp", industry: "E-commerce", contacts: 5, deals: 3, revenue: "$45,000" },
    { name: "TechStart", industry: "Technology", contacts: 3, deals: 2, revenue: "$28,500" },
    { name: "Global Logistics", industry: "Shipping", contacts: 7, deals: 5, revenue: "$67,200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-2">Manage business relationships</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />New Company</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <Card key={company.name} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {company.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span>{company.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contacts:</span>
                  <span>{company.contacts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Deals:</span>
                  <span>{company.deals}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total Revenue:</span>
                  <span>{company.revenue}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
