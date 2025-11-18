import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  User,
  Package,
  Activity,
  FileText,
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import ShipmentMapLeaflet from "@/components/ShipmentMapLeaflet";

export default function CustomerDetail() {
  const [, params] = useRoute("/crm/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id ? parseInt(params.id) : 0;

  const { data, isLoading, error } = trpc.crm.customers.get.useQuery(
    { id: customerId },
    { enabled: customerId > 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Customer not found</h2>
          <Button
            variant="outline"
            onClick={() => setLocation("/crm/customers")}
            className="mt-4"
          >
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const { customer, contacts, activities, shipments, orders } = data;

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => {
    const amount = typeof order.totalAmount === 'string' 
      ? parseFloat(order.totalAmount) 
      : order.totalAmount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const displayName = customer.companyName || 
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
    'Unknown Customer';

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/crm/customers")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <Badge variant={customer.customerType === 'company' ? 'default' : 'secondary'}>
                {customer.customerType}
              </Badge>
              <Badge variant="outline">{customer.businessType}</Badge>
            </div>
            <p className="text-muted-foreground">
              Customer #{customer.customerNumber}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Edit</Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {orders.length} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length}</div>
            <p className="text-xs text-muted-foreground">
              Tracked packages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="shipments">Shipments ({shipments.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${customer.email}`} className="text-sm hover:underline">
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="text-sm">
                      {customer.phone}
                    </a>
                  </div>
                )}
                {customer.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                      {customer.website}
                    </a>
                  </div>
                )}
                {customer.billingAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {typeof customer.billingAddress === 'object' && customer.billingAddress !== null ? (
                        <>
                          <div>{(customer.billingAddress as any).street}</div>
                          <div>
                            {(customer.billingAddress as any).city}, {(customer.billingAddress as any).state} {(customer.billingAddress as any).zip}
                          </div>
                          <div>{(customer.billingAddress as any).country}</div>
                        </>
                      ) : (
                        <div>{String(customer.billingAddress)}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Source</div>
                  <div className="text-sm">{customer.source || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Customer Since</div>
                  <div className="text-sm">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                {customer.notes && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Notes</div>
                    <div className="text-sm whitespace-pre-wrap">{customer.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setLocation(`/orders/${order.id}`)}
                    >
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${typeof order.totalAmount === 'string' 
                            ? parseFloat(order.totalAmount).toFixed(2) 
                            : order.totalAmount?.toFixed(2) || '0.00'}
                        </div>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders found</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setLocation(`/orders/${order.id}`)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.channel} • {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${typeof order.totalAmount === 'string' 
                            ? parseFloat(order.totalAmount).toFixed(2) 
                            : order.totalAmount?.toFixed(2) || '0.00'}
                        </div>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shipments tracked</p>
              ) : (
                <div className="space-y-4">
                  {/* Map visualization would go here */}
                  <div className="space-y-2">
                    {shipments.map((shipment) => (
                      <div key={shipment.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{shipment.carrier}</div>
                          <Badge>{shipment.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tracking: {shipment.trackingNumber}
                        </div>
                        {shipment.currentLocation && (
                          <div className="text-sm text-muted-foreground">
                            Current: {shipment.currentLocation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activities recorded</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.activityDate ? new Date(activity.activityDate).toLocaleString() : 'N/A'}
                        </div>
                        {activity.description && (
                          <div className="text-sm mt-1">{activity.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contacts</CardTitle>
                <Button size="sm">Add Contact</Button>
              </div>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts added</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </div>
                          {contact.title && (
                            <div className="text-sm text-muted-foreground">{contact.title}</div>
                          )}
                        </div>
                        {contact.isPrimary && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {contact.email && (
                          <div className="text-sm flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-sm flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
