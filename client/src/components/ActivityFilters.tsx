import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, FileText, StickyNote, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ActivityFiltersState {
  dateFrom?: string;
  dateTo?: string;
  activityTypes: string[];
}

interface ActivityFiltersProps {
  filters: ActivityFiltersState;
  onChange: (filters: ActivityFiltersState) => void;
}

const ACTIVITY_TYPES = [
  { value: "email", label: "Emails", icon: Mail, color: "bg-blue-500/10 text-blue-500" },
  { value: "meeting", label: "Meetings", icon: Calendar, color: "bg-purple-500/10 text-purple-500" },
  { value: "note", label: "Notes", icon: StickyNote, color: "bg-yellow-500/10 text-yellow-500" },
  { value: "document", label: "Documents", icon: FileText, color: "bg-green-500/10 text-green-500" },
];

export function ActivityFilters({ filters, onChange }: ActivityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleActivityType = (type: string) => {
    const newTypes = filters.activityTypes.includes(type)
      ? filters.activityTypes.filter(t => t !== type)
      : [...filters.activityTypes, type];
    onChange({ ...filters, activityTypes: newTypes });
  };

  const clearFilters = () => {
    onChange({
      dateFrom: undefined,
      dateTo: undefined,
      activityTypes: [],
    });
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.activityTypes.length > 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filter Activities</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && !isExpanded && (
            <div className="flex flex-wrap gap-2">
              {filters.dateFrom && (
                <Badge variant="secondary">
                  From: {new Date(filters.dateFrom).toLocaleDateString()}
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="secondary">
                  To: {new Date(filters.dateTo).toLocaleDateString()}
                </Badge>
              )}
              {filters.activityTypes.map(type => {
                const typeConfig = ACTIVITY_TYPES.find(t => t.value === type);
                return typeConfig ? (
                  <Badge key={type} variant="secondary">
                    {typeConfig.label}
                  </Badge>
                ) : null;
              })}
            </div>
          )}

          {/* Expanded Filters */}
          {isExpanded && (
            <div className="space-y-4 pt-2">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-sm">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-sm">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>

              {/* Activity Type Toggles */}
              <div>
                <Label className="text-sm mb-2 block">Activity Types</Label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = filters.activityTypes.includes(type.value);
                    return (
                      <Button
                        key={type.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleActivityType(type.value)}
                        className={isActive ? "" : ""}
                      >
                        <Icon className="mr-1 h-3 w-3" />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
