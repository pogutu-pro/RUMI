'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { month: 'Jan', rate: 75 },
  { month: 'Feb', rate: 82 },
  { month: 'Mar', rate: 78 },
  { month: 'Apr', rate: 88 },
  { month: 'May', rate: 85 },
  { month: 'Jun', rate: 92 },
];

export function OccupancyChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rate" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
