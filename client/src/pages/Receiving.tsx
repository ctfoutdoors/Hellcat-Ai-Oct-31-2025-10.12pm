import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PackageCheck } from "lucide-react";

export default function Receiving() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receiving</h1>
        <p className="text-muted-foreground mt-2">Receive and process incoming shipments</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Receive Shipment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>PO Number</Label>
            <Input placeholder="Enter PO number or scan barcode" />
          </div>
          <div className="space-y-2">
            <Label>Quantity Received</Label>
            <Input type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input placeholder="Any damage or discrepancies?" />
          </div>
          <Button className="w-full">Process Receipt</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span>PO-2025-003 - Staples</span>
              <span className="text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>PO-2025-002 - Grainger</span>
              <span className="text-muted-foreground">Yesterday</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
