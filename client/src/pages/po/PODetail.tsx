import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  FileText,
  Truck,
  Receipt,
  Calendar,
  DollarSign,
  Building2,
  Upload,
} from "lucide-react";

export default function PODetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const poId = parseInt(id || "0");

  const { data, isLoading, error } = trpc.po.getDetail.useQuery(
    { id: poId },
    { enabled: poId > 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading purchase order...</div>
      </div>
    );
  }

  if (error || !data?.po) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-destructive">Purchase order not found</div>
        {error && <div className="text-sm text-muted-foreground">{error.message}</div>}
        <Button onClick={() => navigate("/crm/vendors")}>
          Back to Vendors
        </Button>
      </div>
    );
  }

  const { po, lineItems, shipments, invoices } = data;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'in_transit': return 'bg-blue-500/10 text-blue-500';
      case 'delivered': return 'bg-green-500/10 text-green-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">PO #{po.poNumber}</h1>
            <p className="text-muted-foreground">
              Order Date: {new Date(po.orderDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(po.status || 'pending')}>
          {po.status || 'Pending'}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subtotal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(po.subtotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shipping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(po.shippingCost || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(po.tax || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(po.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Line Items ({lineItems?.length || 0})</TabsTrigger>
          <TabsTrigger value="shipments">Shipments ({shipments?.length || 0})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="font-medium">{new Date(po.orderDate).toLocaleDateString()}</span>
                </div>
                {po.shipDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ship Date:</span>
                    <span className="font-medium">{new Date(po.shipDate).toLocaleDateString()}</span>
                  </div>
                )}
                {po.expectedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-medium">{new Date(po.expectedDate).toLocaleDateString()}</span>
                  </div>
                )}
                {po.receivedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Received:</span>
                    <span className="font-medium">{new Date(po.receivedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge variant={po.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {po.paymentStatus || 'Unpaid'}
                  </Badge>
                </div>
                {po.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium">{po.paymentMethod}</span>
                  </div>
                )}
                {po.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Date:</span>
                    <span className="font-medium">{new Date(po.paidDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {po.shipToName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="font-medium">{po.shipToName}</div>
                  {po.shipToAddress && <div>{po.shipToAddress}</div>}
                  <div>
                    {po.shipToCity && `${po.shipToCity}, `}
                    {po.shipToState && `${po.shipToState} `}
                    {po.shipToZip}
                  </div>
                  {po.shipToCountry && <div>{po.shipToCountry}</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Line Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Products and quantities in this order</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lineItems && lineItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sku || '-'}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitCost || 0)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency((item.quantity || 0) * (item.unitCost || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No line items found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shipments</CardTitle>
                  <CardDescription>Tracking and delivery information</CardDescription>
                </div>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload BOL
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shipments && shipments.length > 0 ? (
                <div className="space-y-4">
                  {shipments.map((shipment) => (
                    <Card key={shipment.id}>
                      <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-sm text-muted-foreground">BOL Number</div>
                            <div className="font-medium">{shipment.bolNumber || '-'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Tracking Number</div>
                            <div className="font-medium">{shipment.trackingNumber || '-'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Carrier</div>
                            <div className="font-medium">{shipment.carrier || '-'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <Badge className={getStatusColor(shipment.status || 'pending')}>
                              {shipment.status || 'Pending'}
                            </Badge>
                          </div>
                          {shipment.shippedDate && (
                            <div>
                              <div className="text-sm text-muted-foreground">Shipped Date</div>
                              <div className="font-medium">{new Date(shipment.shippedDate).toLocaleDateString()}</div>
                            </div>
                          )}
                          {shipment.estimatedDelivery && (
                            <div>
                              <div className="text-sm text-muted-foreground">Est. Delivery</div>
                              <div className="font-medium">{new Date(shipment.estimatedDelivery).toLocaleDateString()}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No shipments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Invoice and payment records</CardDescription>
                </div>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id}>
                      <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Invoice Number</div>
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.status || 'Pending'}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Invoice Date</div>
                            <div className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Due Date</div>
                            <div className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Subtotal</div>
                            <div className="font-medium">{formatCurrency(invoice.subtotal)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Tax</div>
                            <div className="font-medium">{formatCurrency(invoice.tax || 0)}</div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-sm text-muted-foreground">Total</div>
                            <div className="text-2xl font-bold text-primary">{formatCurrency(invoice.total)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
