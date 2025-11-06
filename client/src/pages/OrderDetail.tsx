import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Truck,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Mail,
  Phone,
  Building,
  Edit,
  Printer,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

// Mock order data - in production this would come from tRPC
const mockOrderData = {
  "1": {
    id: 1,
    orderNumber: "ORD-2024-001",
    channelOrderNumber: "AMZ-123456789",
    orderDate: new Date("2024-11-01"),
    customerName: "John Smith",
    customerEmail: "john.smith@email.com",
    customerPhone: "+1 (555) 123-4567",
    companyName: "Acme Corp",
    channelName: "Amazon",
    orderStatus: "processing",
    paymentStatus: "paid",
    shippingStatus: "not_shipped",
    fulfillmentStatus: "unfulfilled",
    totalAmount: 249.99,
    subtotal: 229.99,
    tax: 15.00,
    shipping: 5.00,
    discount: 0,
    itemCount: 3,
    shippingMethod: "Standard",
    warehouseName: "Main Warehouse",
    isRushOrder: false,
    hasFraudAlert: false,
    trackingNumber: null,
    shippingAddress: {
      name: "John Smith",
      company: "Acme Corp",
      address1: "123 Main Street",
      address2: "Suite 100",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
      phone: "+1 (555) 123-4567",
    },
    billingAddress: {
      name: "John Smith",
      company: "Acme Corp",
      address1: "123 Main Street",
      address2: "Suite 100",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
      phone: "+1 (555) 123-4567",
    },
    lineItems: [
      {
        id: 1,
        sku: "PROD-001",
        productName: "Premium Widget",
        quantity: 2,
        unitPrice: 79.99,
        totalPrice: 159.98,
        weight: 2.5,
        dimensions: "10x8x6",
      },
      {
        id: 2,
        sku: "PROD-002",
        productName: "Standard Gadget",
        quantity: 1,
        unitPrice: 70.01,
        totalPrice: 70.01,
        weight: 1.2,
        dimensions: "8x6x4",
      },
    ],
    statusHistory: [
      {
        id: 1,
        status: "created",
        timestamp: new Date("2024-11-01T10:00:00"),
        user: "System",
        note: "Order created from Amazon",
      },
      {
        id: 2,
        status: "payment_received",
        timestamp: new Date("2024-11-01T10:05:00"),
        user: "Payment Gateway",
        note: "Payment confirmed",
      },
      {
        id: 3,
        status: "processing",
        timestamp: new Date("2024-11-01T11:00:00"),
        user: "John Doe",
        note: "Order assigned to warehouse",
      },
    ],
  },
  "2": {
    id: 2,
    orderNumber: "ORD-2024-002",
    channelOrderNumber: "SHOP-987654321",
    orderDate: new Date("2024-11-02"),
    customerName: "Jane Doe",
    customerEmail: "jane.doe@email.com",
    customerPhone: "+1 (555) 987-6543",
    companyName: "Tech Solutions",
    channelName: "Shopify",
    orderStatus: "shipped",
    paymentStatus: "paid",
    shippingStatus: "in_transit",
    fulfillmentStatus: "fulfilled",
    totalAmount: 599.50,
    subtotal: 549.50,
    tax: 40.00,
    shipping: 10.00,
    discount: 0,
    itemCount: 5,
    shippingMethod: "Express",
    warehouseName: "East Coast",
    trackingNumber: "1Z999AA10123456784",
    isRushOrder: true,
    hasFraudAlert: false,
    shippingAddress: {
      name: "Jane Doe",
      company: "Tech Solutions",
      address1: "456 Tech Avenue",
      address2: "",
      city: "Boston",
      state: "MA",
      zip: "02101",
      country: "USA",
      phone: "+1 (555) 987-6543",
    },
    billingAddress: {
      name: "Jane Doe",
      company: "Tech Solutions",
      address1: "456 Tech Avenue",
      address2: "",
      city: "Boston",
      state: "MA",
      zip: "02101",
      country: "USA",
      phone: "+1 (555) 987-6543",
    },
    lineItems: [
      {
        id: 1,
        sku: "PROD-003",
        productName: "Enterprise Solution",
        quantity: 5,
        unitPrice: 109.90,
        totalPrice: 549.50,
        weight: 5.0,
        dimensions: "12x10x8",
      },
    ],
    statusHistory: [
      {
        id: 1,
        status: "created",
        timestamp: new Date("2024-11-02T09:00:00"),
        user: "System",
        note: "Order created from Shopify",
      },
      {
        id: 2,
        status: "payment_received",
        timestamp: new Date("2024-11-02T09:05:00"),
        user: "Payment Gateway",
        note: "Payment confirmed",
      },
      {
        id: 3,
        status: "processing",
        timestamp: new Date("2024-11-02T10:00:00"),
        user: "Jane Smith",
        note: "Rush order - priority processing",
      },
      {
        id: 4,
        status: "fulfilled",
        timestamp: new Date("2024-11-02T14:00:00"),
        user: "Warehouse Team",
        note: "Order picked and packed",
      },
      {
        id: 5,
        status: "shipped",
        timestamp: new Date("2024-11-02T16:00:00"),
        user: "Shipping Dept",
        note: "Shipped via UPS Express",
      },
    ],
  },
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    created: "bg-gray-500",
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
    shipped: "bg-green-500",
    delivered: "bg-teal-500",
    cancelled: "bg-red-500",
    refunded: "bg-orange-500",
    paid: "bg-green-500",
    unpaid: "bg-red-500",
    not_shipped: "bg-gray-500",
    in_transit: "bg-blue-500",
    fulfilled: "bg-green-500",
    unfulfilled: "bg-yellow-500",
  };
  return colors[status] || "bg-gray-500";
};

export default function OrderDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const orderId = params.id;

  // Get order data
  const order = mockOrderData[orderId as keyof typeof mockOrderData];

  if (!order) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The order you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Channel Order: {order.channelOrderNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        {order.isRushOrder && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Rush Order
          </Badge>
        )}
        {order.hasFraudAlert && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Fraud Alert
          </Badge>
        )}
        <Badge className={getStatusColor(order.orderStatus)}>
          Order: {order.orderStatus}
        </Badge>
        <Badge className={getStatusColor(order.paymentStatus)}>
          Payment: {order.paymentStatus}
        </Badge>
        <Badge className={getStatusColor(order.shippingStatus)}>
          Shipping: {order.shippingStatus}
        </Badge>
        <Badge className={getStatusColor(order.fulfillmentStatus)}>
          Fulfillment: {order.fulfillmentStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {order.orderDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Channel</p>
                  <p className="font-medium">{order.channelName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{order.warehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Shipping Method
                  </p>
                  <p className="font-medium">{order.shippingMethod}</p>
                </div>
                {order.trackingNumber && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Tracking Number
                    </p>
                    <p className="font-medium font-mono">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.itemCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.weight} lbs • {item.dimensions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === order.statusHistory.length - 1
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      {index < order.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium capitalize">
                          {history.status.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {history.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {history.note}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {history.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Addresses */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customerName}</p>
                {order.companyName && (
                  <p className="text-sm text-muted-foreground">
                    {order.companyName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="text-primary hover:underline"
                >
                  {order.customerEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.customerPhone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.name}</p>
                {order.shippingAddress.company && (
                  <p className="text-muted-foreground">
                    {order.shippingAddress.company}
                  </p>
                )}
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="text-muted-foreground pt-2">
                  {order.shippingAddress.phone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Billing Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.billingAddress.name}</p>
                {order.billingAddress.company && (
                  <p className="text-muted-foreground">
                    {order.billingAddress.company}
                  </p>
                )}
                <p>{order.billingAddress.address1}</p>
                {order.billingAddress.address2 && (
                  <p>{order.billingAddress.address2}</p>
                )}
                <p>
                  {order.billingAddress.city}, {order.billingAddress.state}{" "}
                  {order.billingAddress.zip}
                </p>
                <p>{order.billingAddress.country}</p>
                <p className="text-muted-foreground pt-2">
                  {order.billingAddress.phone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
