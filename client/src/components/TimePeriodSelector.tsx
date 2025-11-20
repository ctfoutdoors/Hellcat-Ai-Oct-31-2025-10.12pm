import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { TimePeriod, getTimePeriodOptions } from "@shared/dateRanges";

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

/**
 * Time period selector for dashboard analytics
 * Allows users to filter metrics by different time ranges
 */
export default function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  const options = getTimePeriodOptions();

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(val) => onChange(val as TimePeriod)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
