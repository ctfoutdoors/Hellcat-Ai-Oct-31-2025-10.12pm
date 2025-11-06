import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus } from "lucide-react";

export default function CRMDeals() {
  const deals = [
    { name: "Q1 Shipping Contract", company: "Acme Corp", value: "$25,000", stage: "Negotiation", probability: "75%" },
    { name: "Annual Service Agreement", company: "TechStart", value: "$18,500", stage: "Proposal", probability: "50%" },
    { name: "Claims Recovery Service", company: "Global Logistics", value: "$42,000", stage: "Closed Won", probability: "100%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground mt-2">Track sales opportunities</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />New Deal</Button>
      </div>
      <div className="grid gap-4">
        {deals.map((deal) => (
          <Card key={deal.name} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5" />
                  <div>
                    <div>{deal.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">{deal.company}</div>
                  </div>
                </div>
                <Badge variant={deal.stage === "Closed Won" ? "default" : "secondary"}>{deal.stage}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Value:</span> <span className="font-bold">{deal.value}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Probability:</span> <span className="font-bold">{deal.probability}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
