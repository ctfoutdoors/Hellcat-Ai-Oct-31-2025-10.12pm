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
import { Layers, X } from 'lucide-react';

export type CaseType = 'DAMAGE' | 'ADJUSTMENT' | 'SLA';

interface CaseTypeFilterProps {
  selectedTypes: CaseType[];
  onTypesChange: (types: CaseType[]) => void;
}

const CASE_TYPE_OPTIONS: { value: CaseType; label: string; description: string; color: string }[] = [
  { 
    value: 'DAMAGE', 
    label: 'Damage Claims', 
    description: 'Product damage during shipping',
    color: 'bg-red-100 text-red-800'
  },
  { 
    value: 'ADJUSTMENT', 
    label: 'Adjustment Claims', 
    description: 'Billing or pricing adjustments',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    value: 'SLA', 
    label: 'SLA Claims', 
    description: 'Service level agreement violations',
    color: 'bg-orange-100 text-orange-800'
  },
];

const CaseTypeFilter: React.FC<CaseTypeFilterProps> = ({
  selectedTypes,
  onTypesChange,
}) => {
  const toggleType = (type: CaseType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const clearAll = () => {
    onTypesChange([]);
  };

  const selectAll = () => {
    onTypesChange(CASE_TYPE_OPTIONS.map((opt) => opt.value));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Layers className="h-4 w-4" />
            Filter by Type
            {selectedTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-2">
                {selectedTypes.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          <DropdownMenuLabel>Case Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {CASE_TYPE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selectedTypes.includes(option.value)}
              onCheckedChange={() => toggleType(option.value)}
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
      {selectedTypes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTypes.map((type) => {
            const option = CASE_TYPE_OPTIONS.find((opt) => opt.value === type);
            return (
              <Badge
                key={type}
                variant="outline"
                className={`${option?.color} gap-1 pr-1`}
              >
                {option?.label}
                <button
                  onClick={() => toggleType(type)}
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

export default CaseTypeFilter;
