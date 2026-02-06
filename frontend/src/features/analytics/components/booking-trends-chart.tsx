'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { date: 'Jan', bookings: 40 },
  { date: 'Feb', bookings: 55 },
  { date: 'Mar', bookings: 48 },
  { date: 'Apr', bookings: 70 },
  { date: 'May', bookings: 65 },
  { date: 'Jun', bookings: 85 },
];

export function BookingTrendsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350, minHeight: 350, minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
