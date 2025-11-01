import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface SearchFilters {
  query?: string;
  carrier?: string;
  status?: string;
  priority?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  shipperName?: string;
  shipperZip?: string;
  recipientZip?: string;
  productName?: string;
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onClear: () => void;
}

export function AdvancedSearchFilters({ onFiltersChange, onClear }: AdvancedSearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    // Treat 'ALL' as undefined (no filter)
    const filterValue = value === 'ALL' ? undefined : (value || undefined);
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onClear();
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case number, tracking number, customer name..."
                value={filters.query || ''}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setExpanded(!expanded)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.carrier && (
                <Badge variant="secondary" className="gap-1">
                  Carrier: {filters.carrier}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('carrier', undefined)}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('status', undefined)}
                  />
                </Badge>
              )}
              {filters.priority && (
                <Badge variant="secondary" className="gap-1">
                  Priority: {filters.priority}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('priority', undefined)}
                  />
                </Badge>
              )}
              {(filters.minAmount || filters.maxAmount) && (
                <Badge variant="secondary" className="gap-1">
                  Amount: ${filters.minAmount || 0} - ${filters.maxAmount || '∞'}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      updateFilter('minAmount', undefined);
                      updateFilter('maxAmount', undefined);
                    }}
                  />
                </Badge>
              )}
              {(filters.startDate || filters.endDate) && (
                <Badge variant="secondary" className="gap-1">
                  Date: {filters.startDate || 'Any'} to {filters.endDate || 'Any'}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      updateFilter('startDate', undefined);
                      updateFilter('endDate', undefined);
                    }}
                  />
                </Badge>
              )}
              {filters.shipperName && (
                <Badge variant="secondary" className="gap-1">
                  Shipper: {filters.shipperName}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('shipperName', undefined)}
                  />
                </Badge>
              )}
              {filters.shipperZip && (
                <Badge variant="secondary" className="gap-1">
                  Shipper ZIP: {filters.shipperZip}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('shipperZip', undefined)}
                  />
                </Badge>
              )}
              {filters.recipientZip && (
                <Badge variant="secondary" className="gap-1">
                  Recipient ZIP: {filters.recipientZip}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('recipientZip', undefined)}
                  />
                </Badge>
              )}
              {filters.productName && (
                <Badge variant="secondary" className="gap-1">
                  Product: {filters.productName}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('productName', undefined)}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Expanded Filters */}
          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              {/* Carrier */}
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Select
                  value={filters.carrier || ''}
                  onValueChange={(value) => updateFilter('carrier', value)}
                >
                  <SelectTrigger id="carrier">
                    <SelectValue placeholder="All Carriers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Carriers</SelectItem>
                    <SelectItem value="FEDEX">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => updateFilter('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="FILED">Filed</SelectItem>
                    <SelectItem value="AWAITING_RESPONSE">Awaiting Response</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={filters.priority || ''}
                  onValueChange={(value) => updateFilter('priority', value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min $"
                    value={filters.minAmount || ''}
                    onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max $"
                    value={filters.maxAmount || ''}
                    onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Shipper Name */}
              <div className="space-y-2">
                <Label htmlFor="shipperName">Shipper Name</Label>
                <Input
                  id="shipperName"
                  placeholder="Enter shipper name"
                  value={filters.shipperName || ''}
                  onChange={(e) => updateFilter('shipperName', e.target.value)}
                />
              </div>

              {/* Shipper ZIP */}
              <div className="space-y-2">
                <Label htmlFor="shipperZip">Shipper ZIP Code</Label>
                <Input
                  id="shipperZip"
                  placeholder="Enter ZIP code"
                  value={filters.shipperZip || ''}
                  onChange={(e) => updateFilter('shipperZip', e.target.value)}
                />
              </div>

              {/* Recipient ZIP */}
              <div className="space-y-2">
                <Label htmlFor="recipientZip">Recipient ZIP Code</Label>
                <Input
                  id="recipientZip"
                  placeholder="Enter ZIP code"
                  value={filters.recipientZip || ''}
                  onChange={(e) => updateFilter('recipientZip', e.target.value)}
                />
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  placeholder="Enter product name"
                  value={filters.productName || ''}
                  onChange={(e) => updateFilter('productName', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
