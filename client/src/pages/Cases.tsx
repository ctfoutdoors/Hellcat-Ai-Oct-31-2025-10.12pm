import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Package, Loader2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import CreateCaseForm from "@/components/CreateCaseForm";
import { toast } from "sonner";

export default function Cases() {
  const { data: cases, isLoading } = trpc.cases.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      FILED: "bg-blue-100 text-blue-800",
      AWAITING_RESPONSE: "bg-yellow-100 text-yellow-800",
      RESOLVED: "bg-green-100 text-green-800",
      CLOSED: "bg-gray-100 text-gray-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-blue-100 text-blue-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleQuickLookup = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLookingUp(true);
    setLookupResult(null);
    
    try {
      const response = await fetch(`/api/shipstation/lookup?tracking=${encodeURIComponent(searchQuery.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        setLookupResult(data);
        
        // Show warning if using fallback data source
        if (data.isPartial && data.warning) {
          toast.warning(data.warning, { duration: 5000 });
        }
      } else if (response.status === 404) {
        toast.error('Order not found in ShipStation');
      } else {
        toast.error('Failed to lookup order');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error('Failed to lookup order');
    } finally {
      setIsLookingUp(false);
    }
  };

  const filteredCases = cases?.filter(c => 
    c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all carrier dispute cases
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Case
          </Button>
          <CreateCaseForm 
            open={createDialogOpen} 
            onOpenChange={setCreateDialogOpen}
            onSuccess={() => setCreateDialogOpen(false)}
          />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter tracking number to lookup order or search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleQuickLookup();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleQuickLookup}
                  disabled={!searchQuery.trim() || isLookingUp}
                  variant="default"
                >
                  {isLookingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Lookup Order
                    </>
                  )}
                </Button>
              </div>
              
              {/* Lookup Result Preview */}
              {lookupResult && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">Order Found in ShipStation</h3>
                      <p className="text-sm text-muted-foreground">Review details and create a case</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLookupResult(null)}
                    >
                      ×
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking</p>
                      <p className="font-medium">{lookupResult.trackingNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium">{lookupResult.shipTo?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service</p>
                      <p className="font-medium">{lookupResult.serviceCode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cost</p>
                      <p className="font-medium">${lookupResult.shipmentCost?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setCreateDialogOpen(true);
                      // TODO: Pass lookupResult to CreateCaseForm to pre-fill
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Case from This Order
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>All Cases</CardTitle>
            <CardDescription>
              {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading cases...
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No cases found</p>
                <p className="text-sm mt-2">Create your first case to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCases.map((caseItem) => (
                  <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{caseItem.caseNumber}</h3>
                            <Badge className={getStatusColor(caseItem.status)}>
                              {caseItem.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(caseItem.priority)}>
                              {caseItem.priority}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tracking ID:</span>
                              <p className="font-medium">{caseItem.trackingId}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Carrier:</span>
                              <p className="font-medium">{caseItem.carrier}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Claimed:</span>
                              <p className="font-medium">{formatCurrency(caseItem.claimedAmount)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created:</span>
                              <p className="font-medium">{formatDate(caseItem.createdAt)}</p>
                            </div>
                          </div>
                          {caseItem.customerName && (
                            <p className="text-sm text-muted-foreground">
                              Customer: {caseItem.customerName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
