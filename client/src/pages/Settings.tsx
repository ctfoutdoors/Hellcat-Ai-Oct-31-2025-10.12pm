import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Link as LinkIcon, Bell, Shield, Mail } from "lucide-react";
import EmailManagement from "@/components/EmailManagement";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleSaveIntegration = () => {
    toast.success("Integration settings saved");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification settings saved");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure integrations and system preferences
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="vault" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vault">
              <Shield className="h-4 w-4 mr-2" />
              Credentials Vault
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email Accounts
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <LinkIcon className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="general">
              <SettingsIcon className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vault" className="space-y-4">
            {/* Credentials Vault */}
            <Card>
              <CardHeader>
                <CardTitle>API Credentials Vault</CardTitle>
                <CardDescription>
                  Securely store and manage all API credentials for third-party integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ShipStation */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">ShipStation API</h3>
                      <p className="text-sm text-muted-foreground">Multi-carrier shipping platform</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info("Testing credentials...")}>
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipstation-key">API Key</Label>
                      <Input
                        id="shipstation-key"
                        type="password"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipstation-secret">API Secret</Label>
                      <Input
                        id="shipstation-secret"
                        type="password"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* WooCommerce */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">WooCommerce API</h3>
                      <p className="text-sm text-muted-foreground">E-commerce platform integration</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info("Testing credentials...")}>
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="woo-consumer-key">Consumer Key</Label>
                      <Input
                        id="woo-consumer-key"
                        type="password"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="woo-consumer-secret">Consumer Secret</Label>
                      <Input
                        id="woo-consumer-secret"
                        type="password"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Zoho Desk */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Zoho Desk API</h3>
                      <p className="text-sm text-muted-foreground">Help desk and ticketing system</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info("Testing credentials...")}>
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zoho-org-id">Organization ID</Label>
                      <Input
                        id="zoho-org-id"
                        placeholder="Enter Organization ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zoho-access-token">Access Token</Label>
                      <Input
                        id="zoho-access-token"
                        type="password"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* OpenAI */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">OpenAI API</h3>
                      <p className="text-sm text-muted-foreground">AI assistant and automation</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info("Testing credentials...")}>
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-••••••••••••••••••••••••••••••••"
                    />
                  </div>
                </div>

                {/* Google Services */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Google Services</h3>
                      <p className="text-sm text-muted-foreground">Drive, Docs, Sheets, Gmail, Calendar</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info("OAuth flow coming soon")}>
                        Connect
                      </Button>
                      <Button variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>OAuth Status</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                      <span className="text-sm text-muted-foreground">Not connected</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSaveIntegration}>
                    Save All Credentials
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• All credentials are encrypted at rest using AES-256 encryption</p>
                <p>• Access to credentials is logged and audited</p>
                <p>• Only administrators can view or modify API credentials</p>
                <p>• OAuth tokens are automatically refreshed when needed</p>
                <p>• Test your credentials after saving to ensure they work correctly</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <EmailManagement />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            {/* Zoho Desk Integration */}
            <Card>
              <CardHeader>
                <CardTitle>Zoho Desk Integration</CardTitle>
                <CardDescription>
                  Connect to Zoho Desk for automatic ticket creation and synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zoho-org-id">Organization ID</Label>
                  <Input
                    id="zoho-org-id"
                    placeholder="Enter your Zoho Desk Organization ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoho-api-key">API Key</Label>
                  <Input
                    id="zoho-api-key"
                    type="password"
                    placeholder="Enter your Zoho Desk API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoho-department">Department ID</Label>
                  <Input
                    id="zoho-department"
                    placeholder="Enter the Department ID for tickets"
                  />
                </div>
                <Button onClick={handleSaveIntegration}>
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>

            {/* ShipStation Integration */}
            <Card>
              <CardHeader>
                <CardTitle>ShipStation Integration</CardTitle>
                <CardDescription>
                  Connect to ShipStation for automatic delivery monitoring and guarantee tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shipstation-api-key">API Key</Label>
                  <Input
                    id="shipstation-api-key"
                    type="password"
                    placeholder="Enter your ShipStation API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipstation-api-secret">API Secret</Label>
                  <Input
                    id="shipstation-api-secret"
                    type="password"
                    placeholder="Enter your ShipStation API Secret"
                  />
                </div>
                <Button onClick={handleSaveIntegration}>
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>

            {/* WooCommerce Integration */}
            <Card>
              <CardHeader>
                <CardTitle>WooCommerce Integration</CardTitle>
                <CardDescription>
                  Connect to WooCommerce for order data enrichment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="woo-url">Store URL</Label>
                  <Input
                    id="woo-url"
                    placeholder="https://yourstore.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="woo-consumer-key">Consumer Key</Label>
                  <Input
                    id="woo-consumer-key"
                    type="password"
                    placeholder="Enter your WooCommerce Consumer Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="woo-consumer-secret">Consumer Secret</Label>
                  <Input
                    id="woo-consumer-secret"
                    type="password"
                    placeholder="Enter your WooCommerce Consumer Secret"
                  />
                </div>
                <Button onClick={handleSaveIntegration}>
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Configure when to receive email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Case Created</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when a new case is created
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Case Status Changed</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when case status is updated
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delivery Guarantee Missed</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when automatic case is created for missed guarantee
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <Button onClick={handleSaveNotifications}>
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Alerts</CardTitle>
                <CardDescription>
                  Alerts for automated system actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Terms of Service Changes</p>
                    <p className="text-sm text-muted-foreground">
                      Alert when carrier terms are updated
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Systematic Issues Detected</p>
                    <p className="text-sm text-muted-foreground">
                      Alert when patterns indicate systematic problems
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <Button onClick={handleSaveNotifications}>
                  Save Alert Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Your company details for dispute letters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    defaultValue="CTF Group LLC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Input
                    id="company-address"
                    defaultValue="1458 Old Durham Rd. Roxboro, NC - 27573"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="herve@catchthefever.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <Button onClick={handleSaveIntegration}>
                  Save Company Information
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Shield className="h-5 w-5 inline mr-2" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage access and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Security settings are managed through your Google account.
                  Contact your administrator for access control changes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
