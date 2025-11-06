import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle, DollarSign, RefreshCw, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ShipmentAudits() {
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const { data: audits, isLoading, refetch } = trpc.audits.list.useQuery();
  const runAudit = trpc.audits.runAudit.useMutation();
  const createCase = trpc.cases.create.useMutation();

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    try {
      await runAudit.mutateAsync();
      toast.success("Audit completed successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to run audit");
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleCreateCase = async (auditId: number) => {
    try {
      const audit = audits?.find(a => a.id === auditId);
      if (!audit) return;

      await createCase.mutateAsync({
        trackingNumber: audit.trackingNumber,
        carrier: audit.carrier,
        claimedAmount: Math.abs(audit.discrepancyAmount),
        disputeType: audit.discrepancyType === 'OVERCHARGE' ? 'OVERCHARGE' : 'UNDERCHARGE',
        status: 'OPEN',
        notes: `Auto-created from shipment audit. ${audit.discrepancyReason}`,
      });

      toast.success("Case created from audit");
    } catch (error) {
      toast.error("Failed to create case");
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const stats = {
    totalAudited: audits?.length || 0,
    overcharges: audits?.filter(a => a.discrepancyType === 'OVERCHARGE').length || 0,
    undercharges: audits?.filter(a => a.discrepancyType === 'UNDERCHARGE').length || 0,
    totalDiscrepancy: audits?.reduce((sum, a) => sum + Math.abs(a.discrepancyAmount), 0) || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shipment Audits</h1>
            <p className="text-muted-foreground mt-2">
              Automatic detection of overcharges and undercharges
            </p>
          </div>
          <Button
            onClick={handleRunAudit}
            disabled={isRunningAudit}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
            Run Audit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audited</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAudited}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overcharges</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overcharges}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Undercharges</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.undercharges}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Discrepancy</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.totalDiscrepancy)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Results</CardTitle>
            <CardDescription>
              Shipments with pricing discrepancies detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading audits...</div>
            ) : audits && audits.length > 0 ? (
              <div className="space-y-4">
                {audits.map((audit) => (
                  <div
                    key={audit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{audit.trackingNumber}</span>
                        <Badge variant={audit.discrepancyType === 'OVERCHARGE' ? 'destructive' : 'default'}>
                          {audit.discrepancyType}
                        </Badge>
                        {audit.caseCreated && (
                          <Badge variant="outline">Case Created</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {audit.carrier} • Quoted: {formatCurrency(audit.quotedAmount)} • 
                        Actual: {formatCurrency(audit.actualAmount)} • 
                        Difference: {formatCurrency(Math.abs(audit.discrepancyAmount))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {audit.discrepancyReason}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!audit.caseCreated && (
                        <Button
                          size="sm"
                          onClick={() => handleCreateCase(audit.id)}
                          disabled={createCase.isPending}
                        >
                          Create Case
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit results yet</p>
                <p className="text-sm mt-2">Click "Run Audit" to check for discrepancies</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
