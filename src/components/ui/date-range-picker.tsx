import React from 'react';
import { Button } from './button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (value: { from: Date; to: Date }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  // Simple placeholder implementation
  const formatDate = (date: Date) => format(date, 'MMM d, yyyy');
  
  return (
    <Button variant="outline" className="flex gap-2 h-10">
      <CalendarIcon className="h-4 w-4" />
      <span>
        {formatDate(value.from)} - {formatDate(value.to)}
      </span>
    </Button>
  );
}; 