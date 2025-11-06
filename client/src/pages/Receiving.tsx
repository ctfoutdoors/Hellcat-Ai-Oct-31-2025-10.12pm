import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Truck,
  Plus
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

export default function Receiving() {
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const { data: receivingsData, isLoading } = trpc.receiving.list.useQuery({});
  const { data: pendingData } = trpc.receiving.getPending.useQuery();
  const { data: statsData } = trpc.receiving.getStats.useQuery({});

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getInspectionColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receiving</h1>
            <p className="text-muted-foreground mt-2">
              Receive purchase orders and update inventory
            </p>
          </div>
          <Button onClick={() => setShowReceiveDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Receive Items
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receivings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.stats.totalReceivings || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statsData?.stats.totalItems || 0} items received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Inspection</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statsData?.stats.byInspection.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting quality check
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed Inspection</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsData?.stats.byInspection.passed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Quality approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statsData?.stats.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Received this period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending POs */}
        {pendingData && pendingData.pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Purchase Orders</CardTitle>
              <CardDescription>
                {pendingData.pending.length} POs awaiting receiving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingData.pending.map((po: any) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>{formatDate(po.poDate)}</TableCell>
                      <TableCell>
                        {po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(po.totalAmount)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedPO(po);
                            setShowReceiveDialog(true);
                          }}
                        >
                          Receive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Receiving History */}
        <Card>
          <CardHeader>
            <CardTitle>Receiving History</CardTitle>
            <CardDescription>
              {receivingsData?.total || 0} receiving records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : receivingsData?.receivings && receivingsData.receivings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receiving #</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Inspection</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Received By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingsData.receivings.map((receiving: any) => (
                    <TableRow key={receiving.id}>
                      <TableCell className="font-medium">{receiving.receivingNumber}</TableCell>
                      <TableCell>{receiving.poNumber}</TableCell>
                      <TableCell>{formatDate(receiving.receivedDate)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(receiving.status)}>
                          {receiving.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getInspectionColor(receiving.inspectionStatus)}>
                          {receiving.inspectionStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>{receiving.warehouseLocation || 'N/A'}</TableCell>
                      <TableCell>{receiving.receivedByName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No receiving records yet</p>
                <Button onClick={() => setShowReceiveDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Receive Your First PO
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receive Dialog */}
        <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Receive Items</DialogTitle>
              <DialogDescription>
                Record received items and update inventory
              </DialogDescription>
            </DialogHeader>
            <ReceiveItemsForm 
              po={selectedPO}
              onComplete={() => {
                setShowReceiveDialog(false);
                setSelectedPO(null);
                toast.success('Items received successfully');
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function ReceiveItemsForm({ po, onComplete }: { po: any; onComplete: () => void }) {
  const [receivingNumber, setReceivingNumber] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const createReceiving = trpc.receiving.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createReceiving.mutateAsync({
        poId: po?.id || 1,
        receivingNumber,
        receivedDate: new Date().toISOString(),
        trackingNumber,
        warehouseLocation: location,
        items: [], // Would be populated from form
        notes,
      });

      onComplete();
    } catch (error) {
      toast.error('Failed to create receiving');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="receivingNumber">Receiving Number *</Label>
          <Input
            id="receivingNumber"
            value={receivingNumber}
            onChange={(e) => setReceivingNumber(e.target.value)}
            placeholder="RCV-001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trackingNumber">Tracking Number</Label>
          <Input
            id="trackingNumber"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="1Z999AA10123456784"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Warehouse Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Warehouse A - Bay 3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this receiving..."
          rows={3}
        />
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-4">Line Items</h4>
        <div className="text-sm text-muted-foreground text-center py-4">
          Item receiving interface would go here
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" disabled={createReceiving.isPending}>
          {createReceiving.isPending ? 'Creating...' : 'Complete Receiving'}
        </Button>
      </div>
    </form>
  );
}
