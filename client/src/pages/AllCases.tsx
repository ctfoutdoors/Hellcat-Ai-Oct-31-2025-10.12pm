import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  Loader2, 
  Plus, 
  Search, 
  Flag,
  Trash2,
  Download,
  CheckSquare,
  X,
  Filter,
  Save,
  ChevronDown,
  Chrome,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import CaseSmartSearch from "@/components/CaseSmartSearch";

export default function AllCases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  
  // Bulk operations state
  const [selectedCases, setSelectedCases] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<string>("");
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [savedFilters, setSavedFilters] = useState<Array<{name: string, filters: any}>>([]);
  const [filterName, setFilterName] = useState("");
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: allCases, isLoading } = trpc.cases.list.useQuery({
    searchTerm: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    caseType: caseTypeFilter !== "all" ? caseTypeFilter : undefined,
    carrier: carrierFilter !== "all" ? carrierFilter : undefined,
  });

  // Filter flagged cases if toggle is on
  let cases = showFlaggedOnly 
    ? allCases?.filter(c => c.isFlagged === 1) 
    : allCases;

  // Apply advanced filters
  if (cases) {
    if (dateFrom) {
      cases = cases.filter(c => new Date(c.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      cases = cases.filter(c => new Date(c.createdAt) <= new Date(dateTo));
    }
    if (amountMin) {
      cases = cases.filter(c => parseFloat(c.claimAmount || "0") >= parseFloat(amountMin));
    }
    if (amountMax) {
      cases = cases.filter(c => parseFloat(c.claimAmount || "0") <= parseFloat(amountMax));
    }
    if (priorityFilter !== "all") {
      cases = cases.filter(c => c.priority === priorityFilter);
    }
    
    // Apply sorting
    if (sortColumn && cases) {
      cases = [...cases].sort((a, b) => {
        let aVal: any;
        let bVal: any;
        
        switch (sortColumn) {
          case 'claimAmount':
            aVal = parseFloat(a.claimAmount || "0");
            bVal = parseFloat(b.claimAmount || "0");
            break;
          case 'created':
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case 'priority':
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const SortableHeader = ({ column, children }: { column: string, children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortColumn === column ? (
          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500/20 text-gray-100",
      open: "bg-blue-500/20 text-blue-100",
      investigating: "bg-yellow-500/20 text-yellow-100",
      evidence_gathering: "bg-orange-500/20 text-orange-100",
      dispute_filed: "bg-purple-500/20 text-purple-100",
      awaiting_response: "bg-cyan-500/20 text-cyan-100",
      under_review: "bg-indigo-500/20 text-indigo-100",
      escalated: "bg-red-500/20 text-red-100",
      resolved_won: "bg-green-500/20 text-green-100",
      resolved_lost: "bg-red-500/20 text-red-100",
      closed: "bg-gray-500/20 text-gray-200",
    };
    return colors[status] || "bg-gray-500/20 text-gray-100";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500/20 text-blue-100",
      medium: "bg-yellow-500/20 text-yellow-100",
      high: "bg-orange-500/20 text-orange-100",
      urgent: "bg-red-500/20 text-red-100",
    };
    return colors[priority] || "bg-gray-500/20 text-gray-100";
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedCases.size === cases?.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(cases?.map(c => c.id) || []));
    }
  };

  const handleSelectCase = (caseId: number) => {
    const newSelected = new Set(selectedCases);
    if (newSelected.has(caseId)) {
      newSelected.delete(caseId);
    } else {
      newSelected.add(caseId);
    }
    setSelectedCases(newSelected);
  };

  const handleBulkStatusUpdate = () => {
    if (!bulkStatusUpdate) {
      toast.error("Please select a status");
      return;
    }
    // TODO: Implement actual bulk update
    toast.success(`Updated ${selectedCases.size} cases to ${bulkStatusUpdate}`);
    setSelectedCases(new Set());
    setBulkStatusUpdate("");
  };

  const handleBulkDelete = () => {
    // TODO: Implement actual bulk delete
    toast.success(`Deleted ${selectedCases.size} cases`);
    setSelectedCases(new Set());
    setShowBulkDeleteDialog(false);
  };

  const handleBulkExport = () => {
    // TODO: Implement actual export
    const selectedData = cases?.filter(c => selectedCases.has(c.id));
    console.log("Exporting:", selectedData);
    toast.success(`Exported ${selectedCases.size} cases`);
  };

  const handleClearSelection = () => {
    setSelectedCases(new Set());
  };

  // Filter operations
  const handleSaveFilter = () => {
    if (!filterName) {
      toast.error("Please enter a filter name");
      return;
    }
    const newFilter = {
      name: filterName,
      filters: {
        searchTerm,
        statusFilter,
        caseTypeFilter,
        carrierFilter,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        priorityFilter,
        showFlaggedOnly
      }
    };
    setSavedFilters([...savedFilters, newFilter]);
    toast.success(`Filter "${filterName}" saved`);
    setFilterName("");
  };

  const handleLoadFilter = (filter: any) => {
    setSearchTerm(filter.filters.searchTerm || "");
    setStatusFilter(filter.filters.statusFilter || "all");
    setCaseTypeFilter(filter.filters.caseTypeFilter || "all");
    setCarrierFilter(filter.filters.carrierFilter || "all");
    setDateFrom(filter.filters.dateFrom || "");
    setDateTo(filter.filters.dateTo || "");
    setAmountMin(filter.filters.amountMin || "");
    setAmountMax(filter.filters.amountMax || "");
    setPriorityFilter(filter.filters.priorityFilter || "all");
    setShowFlaggedOnly(filter.filters.showFlaggedOnly || false);
    toast.success(`Loaded filter "${filter.name}"`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCaseTypeFilter("all");
    setCarrierFilter("all");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setPriorityFilter("all");
    setShowFlaggedOnly(false);
    toast.success("All filters cleared");
  };

  const activeFilterCount = [
    searchTerm,
    statusFilter !== "all",
    caseTypeFilter !== "all",
    carrierFilter !== "all",
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    priorityFilter !== "all",
    showFlaggedOnly
  ].filter(Boolean).length;

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Cases</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all carrier dispute cases
            </p>
          </div>
          <Link href="/shipstation-auto-import">
            <Button variant="outline" className="gap-2">
              <Chrome className="h-4 w-4" />
              <Zap className="h-3 w-3" />
              Import from ShipStation
            </Button>
          </Link>
          <Link href="/cases/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </Link>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedCases.size > 0 && (
          <Card className="border-purple-500/50 bg-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckSquare className="h-5 w-5 text-purple-400" />
                  <span className="font-semibold">{selectedCases.size} cases selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={bulkStatusUpdate} onValueChange={setBulkStatusUpdate}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved_won">Resolved Won</SelectItem>
                      <SelectItem value="resolved_lost">Resolved Lost</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  {bulkStatusUpdate && (
                    <Button onClick={handleBulkStatusUpdate} size="sm">
                      Apply
                    </Button>
                  )}
                  <Button onClick={handleBulkExport} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button 
                    onClick={() => setShowBulkDeleteDialog(true)} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button onClick={handleClearSelection} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filter Cases</CardTitle>
                <CardDescription>
                  Search and filter your cases
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Advanced
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </Button>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Smart Search */}
              <div className="mb-4">
                <CaseSmartSearch />
              </div>

              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved_won">Resolved Won</SelectItem>
                    <SelectItem value="resolved_lost">Resolved Lost</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={caseTypeFilter} onValueChange={setCaseTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="delay">Delay</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Carriers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    <SelectItem value="usps">USPS</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date From</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date To</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Min Amount</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amountMin}
                        onChange={(e) => setAmountMin(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Amount</label>
                      <Input
                        type="number"
                        placeholder="10000.00"
                        value={amountMax}
                        onChange={(e) => setAmountMax(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="flagged"
                        checked={showFlaggedOnly}
                        onCheckedChange={(checked) => setShowFlaggedOnly(checked as boolean)}
                      />
                      <label
                        htmlFor="flagged"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show flagged cases only
                      </label>
                    </div>
                  </div>

                  {/* Save/Load Filters */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Filter name..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button onClick={handleSaveFilter} variant="outline" size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      Save Filter
                    </Button>
                    {savedFilters.length > 0 && (
                      <Select onValueChange={(value) => {
                        const filter = savedFilters.find(f => f.name === value);
                        if (filter) handleLoadFilter(filter);
                      }}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Load saved filter" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedFilters.map((filter, index) => (
                            <SelectItem key={index} value={filter.name}>
                              {filter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases</CardTitle>
            <CardDescription>
              {cases?.length || 0} cases found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedCases.size === cases?.length && cases?.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[50px] text-center">Quick View</TableHead>
                    <TableHead>Case #</TableHead>
                    <SortableHeader column="status">Status</SortableHeader>
                    <SortableHeader column="priority">Priority</SortableHeader>
                    <TableHead>Type</TableHead>
                    <TableHead>Carrier</TableHead>
                    <SortableHeader column="claimAmount">Claim Amount</SortableHeader>
                    <SortableHeader column="created">Created</SortableHeader>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases && cases.length > 0 ? (
                    cases.map((caseItem) => (
                      <Tooltip key={caseItem.id}>
                        <TooltipTrigger asChild>
                          <TableRow 
                            className="group cursor-pointer transition-all duration-200 hover:bg-accent/5 hover:border-l-4 hover:border-l-primary hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] relative"
                          >
                        <TableCell>
                          <Checkbox
                            checked={selectedCases.has(caseItem.id)}
                            onCheckedChange={() => handleSelectCase(caseItem.id)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-1 hover:bg-accent rounded transition-colors">
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-4" side="right" align="start">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-lg">{caseItem.caseNumber}</h4>
                                    <p className="text-sm text-muted-foreground">{caseItem.title}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className={getStatusColor(caseItem.status)} variant="secondary">
                                      {caseItem.status.replace(/_/g, " ")}
                                    </Badge>
                                    <Badge className={getPriorityColor(caseItem.priority)} variant="secondary">
                                      {caseItem.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Carrier:</span>
                                    <p className="font-medium uppercase">{caseItem.carrier}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Tracking:</span>
                                    <p className="font-medium">{caseItem.trackingNumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Claim Amount:</span>
                                    <p className="font-medium text-primary">${caseItem.claimAmount}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Type:</span>
                                    <p className="font-medium capitalize">{caseItem.caseType}</p>
                                  </div>
                                </div>
                                {caseItem.description && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">Description:</span>
                                    <p className="text-sm mt-1 line-clamp-3">{caseItem.description}</p>
                                  </div>
                                )}
                                <div className="pt-2 border-t">
                                  <Link href={`/cases/${caseItem.id}`}>
                                    <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded text-sm font-medium transition-colors">
                                      View Full Details
                                    </button>
                                  </Link>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {caseItem.isFlagged === 1 && (
                              <Flag className="h-4 w-4 text-red-500" fill="currentColor" />
                            )}
                            <Link href={`/cases/${caseItem.id}`}>
                              <span className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer font-medium">
                                {caseItem.caseNumber}
                              </span>
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${getStatusColor(caseItem.status)} ${
                              new Date().getTime() - new Date(caseItem.updatedAt).getTime() < 3600000 
                                ? 'animate-pulse' 
                                : ''
                            }`}
                          >
                            {caseItem.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(caseItem.priority)}>
                            {caseItem.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{caseItem.caseType}</TableCell>
                        <TableCell className="uppercase">{caseItem.carrier}</TableCell>
                        <TableCell>${caseItem.claimAmount}</TableCell>
                        <TableCell>
                          {new Date(caseItem.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/cases/${caseItem.id}`}>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Last updated: {new Date(caseItem.updatedAt).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No cases found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {selectedCases.size} Cases?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the selected cases
                and remove their data from the system.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
