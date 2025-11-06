import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Plus, Search } from "lucide-react";

export default function CRMContacts() {
  const contacts = [
    { name: "John Smith", email: "john@acmecorp.com", phone: "(555) 123-4567", company: "Acme Corp" },
    { name: "Sarah Johnson", email: "sarah@techstart.io", phone: "(555) 234-5678", company: "TechStart" },
    { name: "Mike Chen", email: "mike@logistics.com", phone: "(555) 345-6789", company: "Global Logistics" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-2">Manage customer and carrier contacts</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />New Contact</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." className="pl-9" />
      </div>
      <div className="grid gap-4">
        {contacts.map((contact) => (
          <Card key={contact.email} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <div>
                  <div>{contact.name}</div>
                  <div className="text-sm text-muted-foreground font-normal">{contact.company}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {contact.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contact.phone}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
