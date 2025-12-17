'use client';

import * as React from 'react';
import { Clock, Search, Plus, AlertCircle, User, Home, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/utils/caretaker-helpers';
import { useLateEntryLogs, useCreateLateEntryLog } from '@/features/caretaker';

const lateEntrySchema = z.object({
  tenantId: z.string().min(1, 'Student ID is required'),
  tenantName: z.string().min(2, 'Student name is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  entryTime: z.string().min(1, 'Entry time is required'),
  reason: z.string().min(2, 'Reason is required'),
});

type LateEntryFormData = z.infer<typeof lateEntrySchema>;

export default function Page() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: entries = [], isLoading } = useLateEntryLogs();
  const createEntryMutation = useCreateLateEntryLog();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LateEntryFormData>({
    resolver: zodResolver(lateEntrySchema),
    defaultValues: {
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
  });

  const onSubmit = (data: LateEntryFormData) => {
    // Combine date and time for entryTime
    const today = new Date().toISOString().split('T')[0];
    const entryDateTime = new Date(`${today}T${data.entryTime}`).toISOString();

    createEntryMutation.mutate({
      tenantId: data.tenantId, 
      tenantName: data.tenantName,
      roomNumber: data.roomNumber,
      entryTime: entryDateTime,
      reason: data.reason,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        reset();
      }
    });
  };

  const filteredEntries = entries.filter(entry =>
    searchQuery === '' ||
    entry.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.roomNumber.includes(searchQuery)
  );

  // Use entries length for stats
  const stats = {
    today: entries.filter(e => new Date(e.entryTime).toDateString() === new Date().toDateString()).length,
    week: entries.length, 
    // real frequent calculation
    frequent: Object.values(entries.reduce((acc, curr) => {
      acc[curr.tenantId] = (acc[curr.tenantId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).filter(count => count >= 3).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
             <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Late Entry Logs
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Track student entries after curfew hours
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Late Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Late Entry</DialogTitle>
              <DialogDescription>
                Document student entry after curfew hours
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tenantName">Student Name</Label>
                <Input id="tenantName" {...register('tenantName')} placeholder="Search student..." />
                {errors.tenantName && <p className="text-sm text-red-500">{errors.tenantName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input id="roomNumber" {...register('roomNumber')} placeholder="e.g. 204" />
                {errors.roomNumber && <p className="text-sm text-red-500">{errors.roomNumber.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entryTime">Entry Time</Label>
                <Input id="entryTime" type="time" {...register('entryTime')} />
                {errors.entryTime && <p className="text-sm text-red-500">{errors.entryTime.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Late Entry</Label>
                <Textarea 
                  id="reason" 
                  {...register('reason')}
                  placeholder="e.g., Late study session, Emergency, Work shift..."
                  rows={3}
                />
                {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEntryMutation.isPending}>
                  {createEntryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground mt-1">Late entries logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.week}</div>
            <p className="text-xs text-muted-foreground mt-1">Total late entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Frequent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.frequent}</div>
            <p className="text-xs text-muted-foreground mt-1">Students (3+ entries)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name or room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Entry Logs */}
      <div className="grid gap-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No late entry logs found</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getInitials(entry.tenantName, '')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {entry.tenantName}
                        </h3>
                        <p className="text-sm text-muted-foreground">Room {entry.roomNumber}</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Late Entry
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(entry.entryTime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Logged by {entry.loggedByName}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Reason:</p>
                      <p className="text-sm">{entry.reason}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
