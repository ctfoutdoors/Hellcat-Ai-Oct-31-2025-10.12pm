import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { GlassCard, MetricCard, StatusBadge } from "@/components/trading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Download,
  FileText,
  Sparkles,
  Package,
  MapPin,
  Phone,
  Calendar as CalendarIcon,
  DollarSign,
  Truck,
  Copy,
  MoreVertical,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

// Carrier logos (using text for now, can be replaced with actual logos)
const CARRIER_LOGOS: Record<string, string> = {
  FEDEX: "🚚",
  UPS: "📦",
  USPS: "✉️",
  DHL: "🌐",
  ONTRAC: "🚛",
  LASERSHIP: "📮",
};

const CARRIER_COLORS: Record<string, string> = {
  FEDEX: "from-purple-500 to-orange-500",
  UPS: "from-yellow-600 to-amber-700",
  USPS: "from-blue-600 to-blue-800",
  DHL: "from-yellow-400 to-red-600",
  ONTRAC: "from-green-500 to-teal-600",
  LASERSHIP: "from-indigo-500 to-purple-600",
};

const CASE_TYPES = [
  { value: "damage", label: "Damage", icon: "💥", color: "red" },
  { value: "lost", label: "Lost", icon: "🔍", color: "orange" },
  { value: "delay", label: "Delay", icon: "⏰", color: "yellow" },
  { value: "other", label: "Other", icon: "📋", color: "gray" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "gray" },
  { value: "medium", label: "Medium", color: "yellow" },
  { value: "high", label: "High", color: "orange" },
  { value: "urgent", label: "Urgent", color: "red" },
];

const STATUSES = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "submitted", label: "Submitted", color: "blue" },
  { value: "under_review", label: "Under Review", color: "yellow" },
  { value: "approved", label: "Approved", color: "green" },
  { value: "denied", label: "Denied", color: "red" },
  { value: "closed", label: "Closed", color: "gray" },
];

export default function CasesEnhanced() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [claimAmountRange, setClaimAmountRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch cases
  const { data: cases, isLoading } = trpc.cases.list.useQuery({
    page: 1,
    limit: 50,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCarriers.length > 0) count++;
    if (selectedTypes.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedPriorities.length > 0) count++;
    if (dateRange.from || dateRange.to) count++;
    if (searchQuery) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCarriers([]);
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setDateRange({});
    setClaimAmountRange([0, 10000]);
  };

  const toggleFilter = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter(v => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <p className="text-lg">Please log in to view cases</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">All Cases</h1>
          <p className="text-gray-400">
            {cases?.cases?.length || 0} cases found
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            onClick={() => setLocation("/cases/new")}
          >
            <FileText className="w-4 h-4" />
            New Case
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by case ID, tracking, or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge className="ml-2 bg-blue-500">{getActiveFilterCount()}</Badge>
            )}
          </Button>

          {/* Clear Filters */}
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="gap-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Carrier Filter */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Carrier</label>
              <div className="space-y-2">
                {Object.keys(CARRIER_LOGOS).map((carrier) => (
                  <label key={carrier} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedCarriers.includes(carrier)}
                      onCheckedChange={() => toggleFilter(carrier, selectedCarriers, setSelectedCarriers)}
                    />
                    <span className="text-2xl">{CARRIER_LOGOS[carrier]}</span>
                    <span className="text-sm">{carrier}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Case Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Case Type</label>
              <div className="space-y-2">
                {CASE_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTypes.includes(type.value)}
                      onCheckedChange={() => toggleFilter(type.value, selectedTypes, setSelectedTypes)}
                    />
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
              <div className="space-y-2">
                {STATUSES.map((status) => (
                  <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => toggleFilter(status.value, selectedStatuses, setSelectedStatuses)}
                    />
                    <span className="text-sm">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Priority</label>
              <div className="space-y-2">
                {PRIORITIES.map((priority) => (
                  <label key={priority.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPriorities.includes(priority.value)}
                      onCheckedChange={() => toggleFilter(priority.value, selectedPriorities, setSelectedPriorities)}
                    />
                    <span className="text-sm">{priority.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Cases List */}
      <div className="space-y-4">
        {isLoading ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-400">Loading cases...</p>
          </GlassCard>
        ) : cases?.cases && cases.cases.length > 0 ? (
          cases.cases.map((caseItem: any) => (
            <GlassCard 
              key={caseItem.id} 
              className="p-6 hover:bg-white/10 transition-all cursor-pointer group"
              onClick={() => setLocation(`/cases/${caseItem.id}`)}
            >
              <div className="flex items-start gap-6">
                {/* Checkbox */}
                <div className="pt-1">
                  <Checkbox onClick={(e) => e.stopPropagation()} />
                </div>

                {/* Carrier Logo */}
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${CARRIER_COLORS[caseItem.carrier] || 'from-gray-500 to-gray-700'} flex items-center justify-center text-3xl shadow-lg`}>
                  {CARRIER_LOGOS[caseItem.carrier] || "📦"}
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">{caseItem.caseId}</h3>
                        <StatusBadge 
                          status={caseItem.status} 
                          variant={caseItem.status === 'draft' ? 'neutral' : caseItem.status === 'approved' ? 'positive' : 'warning'}
                        />
                        <Badge className={`
                          ${caseItem.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/50' : ''}
                          ${caseItem.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : ''}
                          ${caseItem.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : ''}
                          ${caseItem.priority === 'low' ? 'bg-gray-500/20 text-gray-400 border-gray-500/50' : ''}
                        `}>
                          {caseItem.priority?.toUpperCase() || 'MEDIUM'}
                        </Badge>
                      </div>
                      
                      {/* Customer Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{caseItem.recipientName || 'N/A'}</span>
                        </div>
                        {caseItem.recipientCity && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{caseItem.recipientCity}, {caseItem.recipientState} {caseItem.recipientZip}</span>
                          </div>
                        )}
                        {caseItem.recipientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{caseItem.recipientPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <Truck className="w-3 h-3" />
                        Tracking
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-white">
                          {caseItem.trackingNumber || 'N/A'}
                        </span>
                        {caseItem.trackingNumber && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(caseItem.trackingNumber);
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <Package className="w-3 h-3" />
                        Carrier
                      </div>
                      <div className="text-sm font-medium text-white">
                        {caseItem.carrier}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <DollarSign className="w-3 h-3" />
                        Claimed
                      </div>
                      <div className="text-sm font-bold text-green-400">
                        ${(caseItem.claimedAmount || 0).toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <CalendarIcon className="w-3 h-3" />
                        Created
                      </div>
                      <div className="text-sm text-white">
                        {caseItem.createdAt ? format(new Date(caseItem.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      Generate Form
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Review
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No cases found</h3>
            <p className="text-gray-400 mb-6">Create your first case to get started</p>
            <Button 
              className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500"
              onClick={() => setLocation("/cases/new")}
            >
              <FileText className="w-4 h-4" />
              New Case
            </Button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
