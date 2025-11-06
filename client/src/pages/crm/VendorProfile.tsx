import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  FileText,
  Users,
  ArrowLeft,
  Edit,
  Plus,
} from "lucide-react";
import { useLocation } from "wouter";

export default function VendorProfile() {
  const [, params] = useRoute("/crm/vendors/:id");
  const [, setLocation] = useLocation();
  const vendorId = parseInt(params?.id || "0");

  const { data, isLoading } = trpc.crm.vendors.get.useQuery(
    { id: vendorId },
    { enabled: vendorId > 0 }
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading vendor...</div>
      </div>
    );
  }

  if (!data?.vendor) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Vendor not found</div>
      </div>
    );
  }

  const { vendor, contacts } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/crm/vendors")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6" />
              <h1 className="text-3xl font-bold">{vendor.companyName}</h1>
            </div>
            <p className="text-muted-foreground">{vendor.vendorNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Vendor
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        {vendor.active ? (
          <Badge className="bg-green-600">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vendor.contactName && (
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Primary Contact
                  </div>
                  <div className="font-medium">{vendor.contactName}</div>
                </div>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{vendor.email}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{vendor.phone}</span>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {vendor.website}
                </a>
              </div>
            )}
            {vendor.taxId && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Tax ID: {vendor.taxId}</span>
              </div>
            )}
            {vendor.paymentTerms && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Payment Terms
                </div>
                <Badge variant="outline">{vendor.paymentTerms}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        {vendor.address && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{JSON.stringify(vendor.address)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts ({contacts?.length || 0})</CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </div>
                    {contact.title && (
                      <div className="text-sm text-muted-foreground">
                        {contact.title}
                        {contact.department && ` • ${contact.department}`}
                      </div>
                    )}
                    <div className="text-sm mt-1">
                      {contact.email && <div>{contact.email}</div>}
                      {contact.phone && (
                        <div className="text-muted-foreground">
                          {contact.phone}
                        </div>
                      )}
                    </div>
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

      {/* Notes */}
      {vendor.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{vendor.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
