import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings2,
  Package,
  ShoppingCart,
  Mail,
  MessageSquare,
  Bot,
  Shield,
  Key,
  Globe
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function SettingsIntegrations() {
  const [activeTab, setActiveTab] = useState('overview');

  // Test connection mutations
  const testShipStation = trpc.integrations.testShipStation.useMutation();
  const testWooCommerce = trpc.integrations.testWooCommerce.useMutation();
  const testKlaviyo = trpc.integrations.testKlaviyo.useMutation();
  const testReamaze = trpc.integrations.testReamaze.useMutation();
  const testOpenAI = trpc.integrations.testOpenAI.useMutation();

  const handleTestConnection = async (service: string) => {
    try {
      let result;
      switch (service) {
        case 'shipstation':
          result = await testShipStation.mutateAsync();
          break;
        case 'woocommerce':
          result = await testWooCommerce.mutateAsync();
          break;
        case 'klaviyo':
          result = await testKlaviyo.mutateAsync();
          break;
        case 'reamaze':
          result = await testReamaze.mutateAsync();
          break;
        case 'openai':
          result = await testOpenAI.mutateAsync();
          break;
      }
      
      if (result?.connected) {
        toast.success(`${service} connection successful!`);
      } else {
        toast.error(`${service} connection failed: ${result?.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      toast.error(`Failed to test ${service}: ${error.message}`);
    }
  };

  const integrations = [
    {
      id: 'shipstation',
      name: 'ShipStation',
      description: 'Order fulfillment and shipping management',
      icon: Package,
      status: 'connected',
      lastSync: '2 minutes ago',
      color: 'text-blue-500',
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'E-commerce platform integration',
      icon: ShoppingCart,
      status: 'connected',
      lastSync: '5 minutes ago',
      color: 'text-purple-500',
    },
    {
      id: 'klaviyo',
      name: 'Klaviyo',
      description: 'Email marketing and customer data',
      icon: Mail,
      status: 'connected',
      lastSync: '10 minutes ago',
      color: 'text-green-500',
    },
    {
      id: 'reamaze',
      name: 'Re:amaze',
      description: 'Customer support and helpdesk',
      icon: MessageSquare,
      status: 'connected',
      lastSync: '15 minutes ago',
      color: 'text-orange-500',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'AI-powered chatbot and automation',
      icon: Bot,
      status: 'connected',
      lastSync: 'Never',
      color: 'text-cyan-500',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Manage your third-party service connections and API credentials
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <Card key={integration.id} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${integration.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <Badge 
                            variant={integration.status === 'connected' ? 'default' : 'destructive'}
                            className="mt-1"
                          >
                            {integration.status === 'connected' ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Disconnected</>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Last sync: {integration.lastSync}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(integration.id)}
                        disabled={testShipStation.isLoading || testWooCommerce.isLoading}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Test Connection
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveTab(integration.id)}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Options
              </CardTitle>
              <CardDescription>
                Configure security settings for your integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">API Key Rotation</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically rotate API keys every 90 days
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">IP Whitelisting</h3>
                    <p className="text-sm text-muted-foreground">
                      Restrict API access to specific IP addresses
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-1" />
                    Manage IPs
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Webhook Signatures</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify webhook authenticity with HMAC signatures
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-1" />
                    Enable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure webhooks for real-time data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>WooCommerce Webhook URL</Label>
                <Input 
                  value="https://your-domain.com/api/webhooks/woocommerce" 
                  readOnly 
                />
              </div>
              <div className="space-y-2">
                <Label>ShipStation Webhook URL</Label>
                <Input 
                  value="https://your-domain.com/api/webhooks/shipstation" 
                  readOnly 
                />
              </div>
              <Button>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate Webhook Secret
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual integration configuration tabs */}
        {integrations.map((integration) => (
          <TabsContent key={integration.id} value={integration.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{integration.name} Configuration</CardTitle>
                <CardDescription>
                  Manage API credentials and sync settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Credentials</Label>
                  <p className="text-sm text-muted-foreground">
                    API credentials are securely stored and encrypted. 
                    To update credentials, go to Settings → Secrets.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleTestConnection(integration.id)}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Test Connection
                  </Button>
                  <Button variant="outline">
                    View Sync History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
