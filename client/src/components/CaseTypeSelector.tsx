import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, DollarSign, Clock } from 'lucide-react';

interface CaseTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const caseTypes = [
  {
    value: 'DAMAGE',
    label: 'Damage Claim',
    description: 'Product damaged during shipping',
    icon: Package,
    color: 'text-red-600',
  },
  {
    value: 'ADJUSTMENT',
    label: 'Adjustment Claim',
    description: 'Billing or pricing adjustments',
    icon: DollarSign,
    color: 'text-blue-600',
  },
  {
    value: 'SLA',
    label: 'SLA Claim',
    description: 'Service level agreement violations',
    icon: Clock,
    color: 'text-orange-600',
  },
];

const CaseTypeSelector: React.FC<CaseTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const selectedType = caseTypes.find(t => t.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="case-type">Case Type</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="case-type">
          <SelectValue placeholder="Select case type...">
            {selectedType && (
              <div className="flex items-center gap-2">
                <selectedType.icon className={`h-4 w-4 ${selectedType.color}`} />
                <span>{selectedType.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {caseTypes.map((type) => {
            const Icon = type.icon;
            return (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-start gap-3 py-1">
                  <Icon className={`h-5 w-5 mt-0.5 ${type.color}`} />
                  <div className="flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedType && (
        <p className="text-sm text-muted-foreground">
          {selectedType.description}
        </p>
      )}
    </div>
  );
};

export default CaseTypeSelector;
