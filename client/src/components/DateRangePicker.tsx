import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  onRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  defaultRange?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export function DateRangePicker({ onRangeChange, defaultRange = 'month' }: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const presetRanges = {
    week: { label: 'This Week', days: 7 },
    month: { label: 'This Month', days: 30 },
    quarter: { label: 'This Quarter', days: 90 },
    year: { label: 'This Year', days: 365 },
  };

  const handlePresetChange = (preset: string) => {
    setSelectedRange(preset);
    
    if (preset === 'custom') {
      // Don't automatically set dates for custom
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - presetRanges[preset as keyof typeof presetRanges].days);
    
    onRangeChange(start, end);
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      onRangeChange(new Date(startDate), new Date(endDate));
    }
  };

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(presetRanges).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => handlePresetChange(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRange === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => handlePresetChange('custom')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRange === 'custom'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Custom Range
        </button>
      </div>

      {/* Custom Date Inputs */}
      {selectedRange === 'custom' && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate) handleCustomDateChange();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (startDate) handleCustomDateChange();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {startDate && endDate && (
            <button
              onClick={handleCustomDateChange}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
