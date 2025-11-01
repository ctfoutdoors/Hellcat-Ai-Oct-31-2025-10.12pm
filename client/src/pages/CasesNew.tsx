import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus, Download, Sparkles, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import CreateCaseForm from "@/components/CreateCaseForm";
import { toast } from "sonner";
import { AdvancedSearchFilters, SearchFilters } from "@/components/AdvancedSearchFilters";
import { EnhancedCaseCard } from "@/components/EnhancedCaseCard";

export default function Cases() {
  const { data: cases, isLoading } = trpc.cases.list.useQuery();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedCases, setSelectedCases] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filter cases based on search criteria
  const filteredCases = useMemo(() => {
    if (!cases) return [];

    return cases.filter((c) => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesQuery =
          c.caseNumber.toLowerCase().includes(query) ||
          c.trackingId.toLowerCase().includes(query) ||
          c.customerName?.toLowerCase().includes(query) ||
          c.recipientName?.toLowerCase().includes(query) ||
          c.recipientEmail?.toLowerCase().includes(query) ||
          c.recipientPhone?.toLowerCase().includes(query);
        
        if (!matchesQuery) return false;
      }

      // Carrier filter
      if (filters.carrier && c.carrier !== filters.carrier) {
        return false;
      }

      // Status filter
      if (filters.status && c.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority && c.priority !== filters.priority) {
        return false;
      }

      // Amount range filter
      const amount = parseFloat(c.claimedAmount?.toString() || "0") / 100;
      if (filters.minAmount !== undefined && amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && amount > filters.maxAmount) {
        return false;
      }

      // Date range filter
      if (filters.startDate) {
        const caseDate = new Date(c.createdAt);
        const startDate = new Date(filters.startDate);
        if (caseDate < startDate) return false;
      }
      if (filters.endDate) {
        const caseDate = new Date(c.createdAt);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (caseDate > endDate) return false;
      }

      // Shipper name filter
      if (filters.shipperName) {
        const shipperName = c.shipperName?.toLowerCase() || "";
        if (!shipperName.includes(filters.shipperName.toLowerCase())) {
          return false;
        }
      }

      // Shipper ZIP filter
      if (filters.shipperZip && c.shipperZip !== filters.shipperZip) {
        return false;
      }

      // Recipient ZIP filter
      if (filters.recipientZip && c.recipientZip !== filters.recipientZip) {
        return false;
      }

      // Product name filter
      if (filters.productName) {
        const productName = c.productName?.toLowerCase() || "";
        if (!productName.includes(filters.productName.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [cases, filters]);

  const handleSelectCase = (caseId: number, selected: boolean) => {
    const newSelected = new Set(selectedCases);
    if (selected) {
      newSelected.add(caseId);
    } else {
      newSelected.delete(caseId);
    }
    setSelectedCases(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCases.size === filteredCases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(filteredCases.map((c) => c.id)));
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleGenerateForm = async (caseId: number) => {
    try {
      const response = await fetch(`/api/forms/generate/${caseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ carrier: "FEDEX" }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dispute-form-${caseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Dispute form generated successfully");
      } else {
        toast.error("Failed to generate form");
      }
    } catch (error) {
      console.error("Form generation error:", error);
      toast.error("Failed to generate form");
    }
  };

  const handleAIReview = async (caseId: number) => {
    toast.info("AI Review feature coming soon!");
  };

  const handleBulkGenerateForms = async () => {
    if (selectedCases.size === 0) {
      toast.error("Please select at least one case");
      return;
    }

    setBulkActionLoading(true);
    try {
      for (const caseId of selectedCases) {
        await handleGenerateForm(caseId);
      }
      toast.success(`Generated ${selectedCases.size} dispute forms`);
      setSelectedCases(new Set());
    } catch (error) {
      toast.error("Failed to generate some forms");
    } finally {
      setBulkActionLoading(false);
    }
  };

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

        {/* Advanced Search & Filters */}
        <AdvancedSearchFilters
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
        />

        {/* Bulk Actions Bar */}
        {selectedCases.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    {selectedCases.size} case{selectedCases.size !== 1 ? "s" : ""} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                  >
                    {selectedCases.size === filteredCases.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkGenerateForms}
                    disabled={bulkActionLoading}
                    className="gap-2"
                  >
                    {bulkActionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Generate Forms
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCases(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>All Cases</CardTitle>
            <CardDescription>
              {filteredCases.length} {filteredCases.length === 1 ? "case" : "cases"} found
              {cases && filteredCases.length < cases.length && (
                <span className="ml-2 text-muted-foreground">
                  (filtered from {cases.length} total)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                Loading cases...
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No cases found</p>
                {Object.keys(filters).length > 0 ? (
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                ) : (
                  <p className="text-sm mt-2">Create your first case to get started</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCases.map((caseItem) => (
                  <EnhancedCaseCard
                    key={caseItem.id}
                    caseData={caseItem}
                    onGenerateForm={handleGenerateForm}
                    onAIReview={handleAIReview}
                    onSelect={handleSelectCase}
                    selected={selectedCases.has(caseItem.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
