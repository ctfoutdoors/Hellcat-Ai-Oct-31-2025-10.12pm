import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Package,
  Activity,
  FileText,
  Users,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { useLocation } from "wouter";

export default function CustomerProfile() {
  const [, params] = useRoute("/crm/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = parseInt(params?.id || "0");

  const { data, isLoading } = trpc.crm.customers.get.useQuery(
    { id: customerId },
    { enabled: customerId > 0 }
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading customer...</div>
      </div>
    );
  }

  if (!data?.customer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Customer not found</div>
      </div>
    );
  }

  const { customer, contacts, activities, shipments, orders } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/crm/customers")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              {customer.customerType === "company" ? (
                <Building2 className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
              <h1 className="text-3xl font-bold">
                {customer.customerType === "company"
                  ? customer.companyName
                  : `${customer.firstName} ${customer.lastName}`}
              </h1>
            </div>
            <p className="text-muted-foreground">{customer.customerNumber}</p>
          </div>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Customer
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{customer.customerType}</Badge>
            <Badge variant="secondary" className="ml-2">
              {customer.businessType}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">
            Orders ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="shipments">
            Shipments & Routes ({shipments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activities">
            Activities ({activities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Related Contacts ({contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={customer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {customer.website}
                    </a>
                  </div>
                )}
                {customer.taxId && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>Tax ID: {customer.taxId}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.billingAddress && (
                  <div>
                    <div className="font-medium mb-1">Billing Address</div>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(customer.billingAddress)}
                    </div>
                  </div>
                )}
                {customer.shippingAddress && (
                  <div>
                    <div className="font-medium mb-1">Shipping Address</div>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(customer.shippingAddress)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {customer.tags && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(customer.tags) &&
                    customer.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          {/* Map View - Placeholder for future Google Maps integration */}
          {shipments && shipments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Route Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-lg font-medium mb-2">🗺️ Map View</div>
                    <div className="text-sm">Google Maps integration coming soon</div>
                    <div className="text-sm">Will display shipment routes and locations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Shipments List */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment History</CardTitle>
            </CardHeader>
            <CardContent>
              {shipments && shipments.length > 0 ? (
                <div className="space-y-2">
                  {shipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {shipment.trackingNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {shipment.carrierCode} - {shipment.serviceCode}
                        </div>
                      </div>
                      <Badge>{shipment.status}</Badge>
                    </div>
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

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {activity.activityDate &&
                            new Date(activity.activityDate).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Related Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {contact.title}
                        </div>
                        <div className="text-sm">{contact.email}</div>
                      </div>
                      {contact.isPrimary && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No documents found
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
