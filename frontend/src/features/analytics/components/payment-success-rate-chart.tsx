'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const mockData = [
  { name: 'Successful', value: 850 },
  { name: 'Failed', value: 45 },
  { name: 'Pending', value: 25 },
];

const COLORS = ['#82ca9d', '#ff6b6b', '#ffd93d'];

export function PaymentSuccessRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350, minHeight: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {mockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
