'use client';

import { format, addDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RoomAvailabilityCalendarProps {
  bookedDates: (Date | string)[];
  onDateSelect?: (date: Date | undefined) => void;
}

export default function RoomAvailabilityCalendar({
  bookedDates,
  onDateSelect,
}: RoomAvailabilityCalendarProps) {
  const [selected, setSelected] = useState<Date>();

  const disabledDates = (bookedDates || [])
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()));

  const today = new Date();
  const tomorrow = addDays(today, 1);

  return (
    <Card className="p-4">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(date) => {
          setSelected(date);
          onDateSelect?.(date);
        }}
        disabled={[
          { before: tomorrow },
          ...disabledDates
        ]}
        className="rounded-md"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          ),
          day_range_end: "day-range-end",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
      <p className="mt-3 text-sm text-gray-600">
        {selected
          ? `Selected: ${format(selected, 'PPP')}`
          : 'Pick a move-in date'}
      </p>
    </Card>
  );
}
