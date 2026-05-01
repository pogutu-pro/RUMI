"use client";

import * as React from 'react';
import { useState } from 'react';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Star,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCaretakers } from '@/features/landlord';

export default function CaretakerPerformancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const { data: caretakersData, isLoading } = useCaretakers();
  const caretakers = caretakersData || [];

  // Use API data directly
  // Backend should provide performance metrics
  const performanceData = caretakers;

  const filteredCaretakers = performanceData.filter(caretaker =>
    caretaker.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caretaker.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caretaker.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCaretakers = [...filteredCaretakers].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'tasks') return (b.tasksCompleted || 0) - (a.tasksCompleted || 0);
    if (sortBy === 'occupancy') return (b.occupancyRate || 0) - (a.occupancyRate || 0);
    return 0;
  });

  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-success" />
            Caretaker Performance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and analyze the performance of your property managers
          </p>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-none shadow-md h-32">
                  <CardContent className="p-6 flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                  </CardContent>
                </Card>
             ))
        ) : (
            sortedCaretakers.slice(0, 3).map((caretaker, index) => (
            <motion.div
                key={caretaker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
            >
                <Card className="border-none shadow-md bg-gradient-to-br from-card to-surface overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Star className="h-24 w-24 text-warning" />
                </div>
                <CardContent className="p-6 flex items-center gap-4 relative z-10">
                    <Avatar className="h-16 w-16 border-2 border-success/20">
                    <AvatarFallback className="bg-success/10 text-success font-bold text-xl">
                        {getInitials(caretaker.firstName, caretaker.lastName)}
                    </AvatarFallback>
                    </Avatar>
                    <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground">
                        {caretaker.firstName} {caretaker.lastName}
                        </h3>
                        {index === 0 && (
                        <Badge className="bg-warning/10 text-warning border-0 text-xs">Top Rated</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-warning text-sm font-medium mt-1">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{caretaker.rating?.toFixed(1) || 'N/A'} Rating</span>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </motion.div>
            ))
        )}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search caretakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="tasks">Tasks Completed</SelectItem>
                <SelectItem value="occupancy">Occupancy Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <div className="grid gap-6">
        {isLoading ? (
            <div className="space-y-4">
                 <Skeleton className="h-24 w-full" />
                 <Skeleton className="h-24 w-full" />
            </div>
        ) : sortedCaretakers.length === 0 ? (
            <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No caretakers found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                </CardContent>
            </Card>
        ) : (
            sortedCaretakers.map((caretaker, index) => (
            <motion.div
                key={caretaker.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
            >
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                        <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                            {getInitials(caretaker.firstName, caretaker.lastName)}
                        </AvatarFallback>
                        </Avatar>
                        <div>
                        <h4 className="font-semibold text-foreground">
                            {caretaker.firstName} {caretaker.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">{caretaker.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                        <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Performance Rating</p>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{caretaker.rating?.toFixed(1) || '-'}</span>
                            <Progress value={(caretaker.rating || 0) * 20} className="h-2 w-20" />
                        </div>
                        </div>
                        <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tasks Completed</p>
                        <p className="font-bold text-foreground">{caretaker.tasksCompleted || 0}</p>
                        </div>
                        <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Avg Response Time</p>
                        <p className="font-bold text-foreground">{caretaker.responseTime ? `${caretaker.responseTime} mins` : '-'}</p>
                        </div>
                        <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Occupancy Rate</p>
                        <p className="font-bold text-success">{caretaker.occupancyRate ? `${caretaker.occupancyRate}%` : '-'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Detailed Report</DropdownMenuItem>
                            <DropdownMenuItem>Manage Assignments</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Remove Caretaker</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </motion.div>
            ))
        )}
      </div>
    </div>
  );
}
