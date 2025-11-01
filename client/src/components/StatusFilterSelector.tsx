import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, X } from 'lucide-react';

export type CaseStatus = 'DRAFT' | 'FILED' | 'AWAITING_RESPONSE' | 'RESOLVED' | 'CLOSED' | 'REJECTED';

interface StatusFilterSelectorProps {
  selectedStatuses: CaseStatus[];
  onStatusesChange: (statuses: CaseStatus[]) => void;
}

const STATUS_OPTIONS: { value: CaseStatus; label: string; description: string }[] = [
  { value: 'DRAFT', label: 'Draft', description: 'Cases being prepared' },
  { value: 'FILED', label: 'Open/Processing', description: 'Filed with carrier' },
  { value: 'AWAITING_RESPONSE', label: 'Awaiting Response', description: 'Pending carrier reply' },
  { value: 'RESOLVED', label: 'Resolved', description: 'Successfully resolved' },
  { value: 'CLOSED', label: 'Closed', description: 'Case closed' },
  { value: 'REJECTED', label: 'Rejected', description: 'Claim rejected' },
];

const StatusFilterSelector: React.FC<StatusFilterSelectorProps> = ({
  selectedStatuses,
  onStatusesChange,
}) => {
  const toggleStatus = (status: CaseStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const clearAll = () => {
    onStatusesChange([]);
  };

  const selectAll = () => {
    onStatusesChange(STATUS_OPTIONS.map((opt) => opt.value));
  };

  const getStatusColor = (status: CaseStatus) => {
    const colors: Record<CaseStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      FILED: 'bg-blue-100 text-blue-800',
      AWAITING_RESPONSE: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter by Status
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-2">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel>Case Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selectedStatuses.includes(option.value)}
              onCheckedChange={() => toggleStatus(option.value)}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          <div className="flex items-center justify-between p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-7 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Chips */}
      {selectedStatuses.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectedStatuses.map((status) => {
            const option = STATUS_OPTIONS.find((opt) => opt.value === status);
            return (
              <Badge
                key={status}
                variant="outline"
                className={`${getStatusColor(status)} gap-1 pr-1`}
              >
                {option?.label}
                <button
                  onClick={() => toggleStatus(status)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 text-xs px-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default StatusFilterSelector;
