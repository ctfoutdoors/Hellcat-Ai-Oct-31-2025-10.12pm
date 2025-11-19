import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Package,
  ShoppingCart,
  Mail,
  MessageCircle,
  Bot,
  RefreshCw,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  package: Package,
  "shopping-cart": ShoppingCart,
  mail: Mail,
  "message-circle": MessageCircle,
  bot: Bot,
};

export default function Integrations() {
  const { user, loading: authLoading } = useAuth();

  // Fetch integrations status
  const { data, isLoading, refetch } = trpc.integrations.getStatus.useQuery();

  // Test connection mutations
  const testShipStation = trpc.integrations.testShipStation.useMutation({
    onSuccess: (result) => {
      if (result.connected) {
        toast.success("ShipStation connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    },
  });

  const testWooCommerce = trpc.integrations.testWooCommerce.useMutation({
    onSuccess: (result) => {
      if (result.connected) {
        toast.success("WooCommerce connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    },
  });

  const testKlaviyo = trpc.integrations.testKlaviyo.useMutation({
    onSuccess: (result) => {
      if (result.connected) {
        toast.success("Klaviyo connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    },
  });

  const testReamaze = trpc.integrations.testReamaze.useMutation({
    onSuccess: (result) => {
      if (result.connected) {
        toast.success("Re:amaze connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    },
  });

  const testOpenAI = trpc.integrations.testOpenAI.useMutation({
    onSuccess: (result) => {
      if (result.connected) {
        toast.success("OpenAI connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    },
  });

  const handleTestConnection = (integrationId: string) => {
    switch (integrationId) {
      case "shipstation":
        testShipStation.mutate();
        break;
      case "woocommerce":
        testWooCommerce.mutate();
        break;
      case "klaviyo":
        testKlaviyo.mutate();
        break;
      case "reamaze":
        testReamaze.mutate();
        break;
      case "openai":
        testOpenAI.mutate();
        break;
    }
  };

  const handleConfigure = (integrationId: string) => {
    toast.info(`Configuration for ${integrationId} coming soon`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to manage integrations</p>
      </div>
    );
  }

  const integrations = data?.integrations || [];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Manage your third-party service connections and API credentials
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map((integration: any) => {
                const Icon = iconMap[integration.icon] || Package;
                const isConnected = integration.connected;

                return (
                  <Card key={integration.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle>{integration.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {integration.description}
                            </CardDescription>
                          </div>
                        </div>
                        {isConnected ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {isConnected && integration.lastSync && (
                          <p className="text-sm text-muted-foreground">
                            Last sync: {integration.lastSync}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(integration.id)}
                            disabled={
                              testShipStation.isPending ||
                              testWooCommerce.isPending ||
                              testKlaviyo.isPending ||
                              testReamaze.isPending ||
                              testOpenAI.isPending
                            }
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Test Connection
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfigure(integration.id)}
                            className="gap-2"
                          >
                            <SettingsIcon className="h-4 w-4" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Security</CardTitle>
              <CardDescription>
                Manage API keys and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                API credentials are securely stored in environment variables. To update
                credentials, use the Manus platform secrets management.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>
                Configure webhooks for real-time event notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Webhook configuration coming soon. This will allow integrations to push
                updates to your system automatically.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
