import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, TrendingUp, Package, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function SyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { data: syncHistory, isLoading, refetch } = trpc.shipstationSync.getSyncHistory.useQuery();
  const syncMutation = trpc.shipstationSync.syncShipments.useMutation();

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncMutation.mutateAsync();
      
      toast.success("Sync completed", {
        description: `Found ${result.adjustmentsDetected} adjustments, created ${result.casesCreated} draft cases`,
      });
      
      refetch();
    } catch (error: any) {
      toast.error("Sync failed", {
        description: error.message || "Failed to sync with ShipStation",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
      case "FAILED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const latestSync = syncHistory?.[0];
  const totalSyncs = syncHistory?.length || 0;
  const successfulSyncs = syncHistory?.filter(s => s.status === "SUCCESS").length || 0;
  const totalCasesCreated = syncHistory?.reduce((sum, s) => sum + (s.casesCreated || 0), 0) || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ShipStation Sync Status</h1>
          <p className="text-gray-600 mt-2">Monitor automatic syncs and trigger manual syncs</p>
        </div>
        <Button 
          onClick={handleManualSync} 
          disabled={isSyncing}
          size="lg"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </div>

      {/* Scheduler Status Banner */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Automatic Daily Sync Enabled</h3>
                <p className="text-sm text-gray-600">Scheduled to run every day at 2:00 AM Eastern Time</p>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSync ? new Date(latestSync.syncedAt).toLocaleString() : "Never"}
            </div>
            {latestSync && (
              <div className="mt-2">
                {getStatusBadge(latestSync.status)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Syncs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSyncs}</div>
            <p className="text-sm text-gray-500 mt-1">
              {successfulSyncs} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cases Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCasesCreated}</div>
            <p className="text-sm text-gray-500 mt-1">
              From all syncs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {successfulSyncs}/{totalSyncs} syncs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent ShipStation synchronization attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {!syncHistory || syncHistory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sync history available</p>
              <p className="text-sm text-gray-400 mt-2">Click "Sync Now" to start your first sync</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((sync: any) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      {getStatusBadge(sync.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(sync.syncedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Synced {sync.shipmentsProcessed || 0} shipments
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {sync.adjustmentsDetected || 0} adjustments detected
                    </p>
                    <p className="text-sm text-green-600">
                      {sync.casesCreated || 0} cases created
                    </p>
                    {sync.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {sync.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduler Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Automatic Sync Schedule</CardTitle>
          <CardDescription>ShipStation syncs run automatically every day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Daily at 2:00 AM EST</p>
              <p className="text-sm text-gray-500">
                Automatic syncs check for dimensional weight adjustments and create draft cases
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
