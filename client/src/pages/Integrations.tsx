import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug } from "lucide-react";

export default function Integrations() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Manage API integrations and webhooks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            API integrations management feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Plug className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              This feature will allow you to manage third-party integrations
            </p>
            <p className="text-sm text-gray-400">
              Connect with ShipStation, WooCommerce, and other shipping platforms
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
