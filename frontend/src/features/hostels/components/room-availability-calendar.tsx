'use client';

import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

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

  return (
    <Card className="p-4">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => {
          setSelected(date);
          onDateSelect?.(date);
        }}
        disabled={disabledDates}
        className="rounded-md border"
      />
      <p className="mt-3 text-sm text-gray-600">
        {selected
          ? `Selected: ${format(selected, 'PPP')}`
          : 'Pick a move-in date'}
      </p>
    </Card>
  );
}
