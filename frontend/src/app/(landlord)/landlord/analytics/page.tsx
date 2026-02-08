'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarDays, 
  Building2, 
  Users, 
  TrendingUp, 
  Activity,
  Zap,
  Filter,
  Download
} from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
    useLandlordRevenue, 
    useLandlordOccupancy, 
    useLandlordPerformance,
    useAnalytics
} from '@/features/analytics/hooks/use-analytics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RevenueDistribution {
  name: string;
  value: number;
  [key: string]: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-4 rounded-xl shadow-2xl">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-popover-foreground font-black text-lg">
          {typeof payload[0].value === 'number' && payload[0].value > 100 
            ? `KES ${payload[0].value.toLocaleString()}` 
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [period, setPeriod] = React.useState('30d');
  
  // Real World Hooks
  const { data: revenueData } = useLandlordRevenue(period as any);
  const { data: occupancyData } = useLandlordOccupancy(period as any);
  const { data: performanceData } = useLandlordPerformance();
  const { data: generalAnalytics } = useAnalytics(period as any);

  // Fallbacks for initial load / empty states if API returns null
  const revenueTrends = revenueData?.trends || [];
  const propertyPerformance = performanceData || [];

  // ROI Estimation (Based on real data)
  const activeTenants = generalAnalytics?.activeUsers || 0;
  // Assumption: 1.5hrs saved per tenant per month via automation
  const estimatedTimeSaved = Math.round(activeTenants * 1.5); 
  // Assumption: Value of time = 500 KES/hr
  const estimatedMoneySaved = estimatedTimeSaved * 500;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Property Intelligence</h1>
          <p className="text-muted-foreground max-w-xl text-lg md:text-xl font-medium">
            Deep insights into occupancy, revenue trends, and platform ROI.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] h-12 rounded-xl bg-card border-border font-black text-primary shadow-sm">
              <div className="flex items-center gap-2">
                 <CalendarDays className="h-5 w-5 text-muted-foreground" />
                 <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d" className="font-bold">Last 7 Days</SelectItem>
              <SelectItem value="30d" className="font-bold">Last 30 Days</SelectItem>
              <SelectItem value="90d" className="font-bold">Last Quarter</SelectItem>
              <SelectItem value="1y" className="font-bold">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-12 px-6 rounded-xl border-border font-black text-primary shadow-sm">
            <Filter className="mr-2 h-5 w-5" /> Compare Hostels
          </Button>
          <Button className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-black shadow-md">
            <Download className="mr-2 h-5 w-5" /> Export Report
          </Button>
        </div>
      </motion.div>

      {/* ROI & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* ROI Card - Highlight */}
         <motion.div variants={itemVariants} className="md:col-span-2">
           <Card className="h-full border border-border shadow-lg bg-card overflow-hidden relative">
             <CardContent className="p-10 relative z-10 flex flex-col justify-between h-full">
               <div className="flex justify-between items-start">
                 <div>
                   <Badge className="bg-success/10 text-success border-success/20 mb-6 px-4 py-1.5 hover:bg-success/20 font-black text-xs uppercase tracking-widest">Subscription ROI</Badge>
                   <h3 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">KES {estimatedMoneySaved.toLocaleString()}</h3>
                   <p className="text-muted-foreground font-bold text-lg mt-2">Estimated savings this month</p>
                 </div>
                 <div className="h-16 w-16 bg-success/10 rounded-2xl flex items-center justify-center border border-success/20 shadow-sm">
                   <Zap className="h-8 w-8 text-success" />
                 </div>
               </div>
               <div className="mt-10 pt-8 border-t border-border flex items-center gap-12">
                 <div>
                   <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest mb-1">Time Saved</p>
                   <p className="text-2xl font-black text-primary">{estimatedTimeSaved} Hours</p>
                 </div>
                 <div>
                   <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest mb-1">Efficiency Boost</p>
                   <p className="text-2xl font-black text-success">+145%</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </motion.div>

         {/* Standard Metrics */}
         {[
           {
             label: "Total Revenue",
             value: `KES ${(revenueData?.totalRevenue || 0).toLocaleString()}`,
             change: revenueData?.growth || 0,
             icon: Activity
           },
           {
             label: "Avg. Occupancy",
             value: `${occupancyData?.rate || 0}%`, 
             change: occupancyData?.growth || 0,
             icon: Users
           }
         ].map((metric, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full border border-border shadow-md bg-card p-8 flex flex-col justify-center hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-muted rounded-2xl border border-border shadow-sm">
                    <metric.icon className="h-7 w-7 text-primary" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "font-black px-3 py-1 text-sm border shadow-sm",
                      metric.change >= 0 ? "text-success bg-success/10 border-success/20" : "text-destructive bg-destructive/10 border-destructive/20"
                    )}
                  >
                    {metric.change >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                    {Math.abs(metric.change)}%
                  </Badge>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-primary tracking-tight">{metric.value}</h3>
                <p className="text-muted-foreground text-base font-black uppercase tracking-wider mt-2">{metric.label}</p>
              </Card>
            </motion.div>
         ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Trends */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-[450px] border shadow-sm bg-card overflow-hidden flex flex-col">
            <CardHeader className="p-10 pb-2">
              <CardTitle className="text-2xl font-black text-primary">Revenue Trends</CardTitle>
              <CardDescription className="text-muted-foreground font-bold text-base">Income performance over time</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6 flex-1 min-h-[300px]">
              <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrends}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.4} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#475569', fontSize: 13, fontWeight: 800}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#475569', fontSize: 13, fontWeight: 800}} 
                      tickFormatter={(value) => `K${value/1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Distribution */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="h-[450px] border border-border shadow-md bg-card overflow-hidden flex flex-col">
            <CardHeader className="p-10 pb-2">
              <CardTitle className="text-2xl font-black text-primary">Revenue Source</CardTitle>
              <CardDescription className="text-muted-foreground font-bold text-base">Breakdown by category</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-4 flex-1 min-h-[300px]">
              <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={generalAnalytics?.revenueDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(generalAnalytics?.revenueDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Property Performance Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="border border-border shadow-md bg-card overflow-hidden">
            <CardHeader className="p-10 pb-2">
              <CardTitle className="text-2xl font-black text-primary">Hostel Performance</CardTitle>
              <CardDescription className="text-muted-foreground font-bold text-base">Occupancy levels by property</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6 h-[400px]">
               <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={propertyPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.4} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#334155', fontSize: 13, fontWeight: 900}} 
                        width={170}
                      />
                      <Tooltip 
                        cursor={{fill: 'slate-100', opacity: 0.1}}
                        content={<CustomTooltip />}
                      />
                      <Bar dataKey="occupancy" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                         {
                           propertyPerformance.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.occupancy > 80 ? '#10b981' : entry.occupancy > 50 ? '#3b82f6' : '#ef4444'} />
                           ))
                         }
                      </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
