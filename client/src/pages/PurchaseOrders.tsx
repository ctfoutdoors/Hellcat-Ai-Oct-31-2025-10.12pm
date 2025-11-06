import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Search, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: posData, isLoading } = trpc.purchaseOrders.list.useQuery({});

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_approval: 'bg-yellow-500',
      approved: 'bg-blue-500',
      ordered: 'bg-purple-500',
      partially_received: 'bg-orange-500',
      received: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage vendor purchase orders with AI-powered scanning</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Scan PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>AI Purchase Order Scanner</DialogTitle>
                <DialogDescription>
                  Upload a PO document (PDF, image) and our AI will extract all details
                </DialogDescription>
              </DialogHeader>
              <POScannerUpload onComplete={() => setShowUploadDialog(false)} />
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PO number, vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Received</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* PO List */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            {posData?.total || 0} purchase orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : posData?.purchaseOrders && posData.purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>AI Scanned</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posData.purchaseOrders.map((po: any) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.vendorName}</TableCell>
                    <TableCell>{new Date(po.poDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(po.status)}>
                        {po.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                    <TableCell>
                      {po.scannedFromDocument && (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {po.aiConfidence}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No purchase orders yet</p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Scan Your First PO
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function POScannerUpload({ onComplete }: { onComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const scanMutation = trpc.purchaseOrders.scanDocument.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // In real implementation, upload to S3 first
      const mockUrl = 'https://example.com/po.pdf';

      const result = await scanMutation.mutateAsync({
        documentUrl: mockUrl,
      });

      setScanResult(result.data);
      toast.success('PO scanned successfully!');
    } catch (error) {
      toast.error('Failed to scan PO');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!scanResult ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Upload Purchase Order</p>
          <p className="text-sm text-muted-foreground mb-4">
            PDF, PNG, JPG up to 10MB
          </p>
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="max-w-xs mx-auto"
          />
          {file && (
            <div className="mt-4">
              <p className="text-sm mb-2">Selected: {file.name}</p>
              <Button onClick={handleScan} disabled={uploading}>
                {uploading ? 'Scanning...' : 'Scan with AI'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scan Results</h3>
            <Badge variant="outline">
              {scanResult.confidence}% Confidence
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vendor Name</p>
                <p className="font-medium">{scanResult.vendor.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PO Number</p>
                <p className="font-medium">{scanResult.poNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PO Date</p>
                <p className="font-medium">{scanResult.poDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">
                  ${(scanResult.totals.total / 100).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items ({scanResult.lineItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanResult.lineItems.map((item: any) => (
                    <TableRow key={item.lineNumber}>
                      <TableCell className="font-mono text-sm">{item.vendorSku}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${(item.unitPrice / 100).toFixed(2)}</TableCell>
                      <TableCell>${(item.lineTotal / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.confidence}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setScanResult(null)}>
              Scan Another
            </Button>
            <Button onClick={onComplete}>
              Create Purchase Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
