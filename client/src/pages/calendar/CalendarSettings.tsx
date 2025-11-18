import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const CALENDAR_PROVIDERS = [
  { value: "google", label: "Google Calendar", icon: "🔵", color: "bg-blue-500" },
  { value: "outlook", label: "Outlook Calendar", icon: "🔷", color: "bg-sky-500" },
  { value: "apple", label: "Apple Calendar", icon: "🍎", color: "bg-gray-500" },
];

export default function CalendarSettings() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const { data: connections, isLoading } = trpc.calendar.listConnections.useQuery();
  const utils = trpc.useUtils();

  const connectMutation = trpc.calendar.connect.useMutation({
    onSuccess: () => {
      toast.success("Calendar connected successfully!");
      utils.calendar.listConnections.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to connect calendar: ${error.message}`);
    },
  });

  const disconnectMutation = trpc.calendar.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Calendar disconnected");
      utils.calendar.listConnections.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const toggleSyncMutation = trpc.calendar.toggleSync.useMutation({
    onSuccess: () => {
      utils.calendar.listConnections.invalidate();
    },
  });

  const syncNowMutation = trpc.calendar.syncNow.useMutation({
    onSuccess: () => {
      toast.success("Calendar synced successfully!");
      utils.calendar.listConnections.invalidate();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const setPrimaryMutation = trpc.calendar.setPrimary.useMutation({
    onSuccess: () => {
      toast.success("Primary calendar updated");
      utils.calendar.listConnections.invalidate();
    },
  });

  const handleConnect = (provider: string) => {
    if (provider === "google") {
      // Initiate Google OAuth flow
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/calendar/oauth/callback`;
      const scope = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      window.location.href = authUrl;
    } else {
      toast.info(`${provider} integration coming soon!`);
    }
  };

  const handleDisconnect = (connectionId: number) => {
    if (confirm("Are you sure you want to disconnect this calendar?")) {
      disconnectMutation.mutate({ connectionId });
    }
  };

  const handleToggleSync = (connectionId: number, enabled: boolean) => {
    toggleSyncMutation.mutate({ connectionId, enabled });
  };

  const handleSyncNow = (connectionId: number) => {
    syncNowMutation.mutate({ connectionId });
  };

  const handleSetPrimary = (connectionId: number) => {
    setPrimaryMutation.mutate({ connectionId });
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar Settings</h1>
        <p className="text-muted-foreground mt-2">
          Connect and manage your calendars for seamless CRM integration
        </p>
      </div>

      {/* Add New Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Connect New Calendar
          </CardTitle>
          <CardDescription>
            Choose a calendar provider to connect to your CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CALENDAR_PROVIDERS.map((provider) => (
              <Button
                key={provider.value}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => handleConnect(provider.value)}
              >
                <span className="text-3xl">{provider.icon}</span>
                <span className="font-medium">{provider.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connected Calendars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Connected Calendars ({connections?.length || 0})
          </CardTitle>
          <CardDescription>
            Manage your connected calendar accounts and sync settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading calendars...
            </div>
          ) : connections && connections.length > 0 ? (
            <div className="space-y-4">
              {connections.map((connection) => {
                const provider = CALENDAR_PROVIDERS.find(p => p.value === connection.provider);
                const lastSync = connection.lastSyncAt 
                  ? formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })
                  : "Never synced";

                return (
                  <Card key={connection.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="text-3xl">{provider?.icon}</div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{connection.calendarName || provider?.label}</h3>
                              {connection.isPrimary && (
                                <Badge variant="default">Primary</Badge>
                              )}
                              {connection.syncEnabled ? (
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Sync On
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Sync Off
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {connection.providerAccountEmail}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Last synced: {lastSync}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Sync</span>
                            <Switch
                              checked={connection.syncEnabled}
                              onCheckedChange={(checked) => handleToggleSync(connection.id, checked)}
                            />
                          </div>
                          <div className="flex gap-2">
                            {!connection.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetPrimary(connection.id)}
                              >
                                Set Primary
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSyncNow(connection.id)}
                              disabled={syncNowMutation.isPending}
                            >
                              <RefreshCw className={`h-4 w-4 ${syncNowMutation.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDisconnect(connection.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">No calendars connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect your first calendar to start syncing events with your CRM
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Calendars sync automatically every 15 minutes when sync is enabled</p>
          <p>• Events created in CRM will be pushed to your primary calendar</p>
          <p>• Calendar events will appear in CRM activity timelines for related contacts</p>
          <p>• You can manually trigger a sync anytime using the refresh button</p>
        </CardContent>
      </Card>
    </div>
  );
}
