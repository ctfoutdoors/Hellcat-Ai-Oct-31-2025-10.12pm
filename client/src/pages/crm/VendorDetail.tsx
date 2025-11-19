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
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  ArrowLeft,
  Users,
  FileText,
  Truck,
  DollarSign,
  Package,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { CalendarEventsTimeline } from "@/components/CalendarEventsTimeline";
import { FileUploadZone } from "@/components/FileUploadZone";
import { AttachmentsTimeline } from "@/components/AttachmentsTimeline";
import { ActivityFilters, ActivityFiltersState } from "@/components/ActivityFilters";

export default function VendorDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const vendorId = parseInt(params.id || "0");

  const { data, isLoading } = trpc.crm.vendors.get.useQuery(
    { id: vendorId },
    { enabled: vendorId > 0 }
  );

  // Fetch purchase orders for this vendor
  const { data: poData } = trpc.po.listByVendor.useQuery(
    { vendorId },
    { enabled: vendorId > 0 }
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading vendor...</div>
      </div>
    );
  }

  if (!data?.vendor) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Vendor not found</div>
      </div>
    );
  }

  const { vendor, contacts } = data;
  const purchaseOrders = poData?.orders || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/crm/vendors")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vendors
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{vendor.companyName}</h1>
              <Badge variant={vendor.active ? "default" : "secondary"}>
                {vendor.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">Vendor #{vendor.vendorNumber}</p>
          </div>
        </div>
        <Button variant="outline">Edit Vendor</Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders.filter(po => po.status === 'approved' || po.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders ({purchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Vendor Number</div>
                  <div className="text-lg">{vendor.vendorNumber}</div>
                </div>
                {vendor.customerNumber && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Our Customer #</div>
                    <div className="text-lg">{vendor.customerNumber}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {vendor.contactName && (
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{vendor.contactName}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                      {vendor.email}
                    </a>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                      {vendor.phone}
                    </a>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {vendor.website}
                    </a>
                  </div>
                )}
              </div>

              {vendor.paymentTerms && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Payment Terms</div>
                  <div>{vendor.paymentTerms}</div>
                </div>
              )}

              {vendor.notes && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Notes</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{vendor.notes}</div>
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
                <div>
                  <CardTitle>Vendor Contacts</CardTitle>
                  <CardDescription>Personnel and communication channels</CardDescription>
                </div>
                <Button size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-4">
                  {contacts.map((contact: any) => (
                    <div key={contact.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && (
                            <Badge variant="secondary" className="ml-2">Primary</Badge>
                          )}
                        </div>
                        {contact.title && (
                          <div className="text-sm text-muted-foreground">{contact.title}</div>
                        )}
                        <div className="mt-2 space-y-1">
                          {contact.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="mr-2 h-3 w-3" />
                              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-2 h-3 w-3" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts added yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>Order history and tracking</CardDescription>
                </div>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  New PO
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po: any) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                        <TableCell>
                          {new Date(po.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {po.expectedDeliveryDate
                            ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              po.status === "received"
                                ? "default"
                                : po.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/po/${po.id}`)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase orders yet
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
              <CardDescription>Inbound shipments from this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Shipment tracking map will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Upload Files</h3>
                <FileUploadZone
                  entityType="vendor"
                  entityId={vendorId}
                  onUploadComplete={() => {}}
                />
              </div>

              {/* Attachments Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Attachments & Documents</h3>
                <AttachmentsTimeline
                  entityType="vendor"
                  entityId={vendorId}
                />
              </div>

              {/* Calendar Events Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Meetings & Events</h3>
                <CalendarEventsTimeline
                  events={[]}
                  entityType="vendor"
                  entityId={vendorId}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
