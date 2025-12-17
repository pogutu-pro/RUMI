'use client';

import * as React from 'react';
import { Moon, Search, Plus, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useNightCheckReports, useCreateNightCheckReport } from '@/features/caretaker';

const nightCheckSchema = z.object({
  checkTime: z.string().min(1, 'Check time is required'),
  floorsChecked: z.array(z.number()).min(1, 'Select at least one floor'),
  totalTenantsPresent: z.number().min(0),
  totalTenantsAbsent: z.number().min(0),
  notes: z.string().optional(),
});

type NightCheckFormData = z.infer<typeof nightCheckSchema>;

export default function Page() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: checks = [], isLoading } = useNightCheckReports();
  const createCheckMutation = useCreateNightCheckReport();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<NightCheckFormData>({
    resolver: zodResolver(nightCheckSchema),
    defaultValues: {
      checkTime: '22:00',
      floorsChecked: [],
      totalTenantsPresent: 0,
      totalTenantsAbsent: 0,
    }
  });

  const onSubmit = (data: NightCheckFormData) => {
    // Combine date and time
    const today = new Date().toISOString().split('T')[0];
    const checkDateTime = new Date(`${today}T${data.checkTime}`).toISOString();

    createCheckMutation.mutate({
      checkDate: new Date().toISOString(),
      checkTime: checkDateTime,
      floorsChecked: data.floorsChecked,
      totalTenantsPresent: data.totalTenantsPresent,
      totalTenantsAbsent: data.totalTenantsAbsent,
      notes: data.notes,
      issues: [], // For now, empty issues array or add UI to add issues
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        reset();
      }
    });
  };

  const handleFloorToggle = (floor: number) => {
    const current = watch('floorsChecked');
    if (current.includes(floor)) {
      setValue('floorsChecked', current.filter(f => f !== floor));
    } else {
      setValue('floorsChecked', [...current, floor]);
    }
  };

  const filteredChecks = checks.filter(check =>
    searchQuery === '' ||
    check.performedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (check.notes && check.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    week: checks.length,
    noIssues: checks.filter(c => c.issues.length === 0).length,
    issues: checks.filter(c => c.issues.length > 0).length,
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
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Night Check Reports
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Record nightly security checks and incidents
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Night Check
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Record Night Check</DialogTitle>
              <DialogDescription>
                Document your nightly security rounds
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="checkTime">Check Time</Label>
                <Input id="checkTime" type="time" {...register('checkTime')} />
                {errors.checkTime && <p className="text-sm text-red-500">{errors.checkTime.message}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label>Floors Checked</Label>
                <div className="flex flex-wrap gap-4">
                  {[1, 2, 3, 4].map(floor => (
                    <div key={floor} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`floor-${floor}`} 
                        checked={watch('floorsChecked').includes(floor)}
                        onCheckedChange={() => handleFloorToggle(floor)}
                      />
                      <label htmlFor={`floor-${floor}`} className="text-sm">
                        Floor {floor}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.floorsChecked && <p className="text-sm text-red-500">{errors.floorsChecked.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="totalTenantsPresent">Tenants Present</Label>
                  <Input 
                    id="totalTenantsPresent" 
                    type="number" 
                    {...register('totalTenantsPresent', { valueAsNumber: true })} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalTenantsAbsent">Tenants Absent</Label>
                  <Input 
                    id="totalTenantsAbsent" 
                    type="number" 
                    {...register('totalTenantsAbsent', { valueAsNumber: true })} 
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes & Observations</Label>
                <Textarea 
                  id="notes" 
                  {...register('notes')}
                  placeholder="Record any incidents, noise complaints, security concerns, or general observations..."
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCheckMutation.isPending}>
                  {createCheckMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Report
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.week}</div>
            <p className="text-xs text-muted-foreground mt-1">Checks completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">No Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.noIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Peaceful nights</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.issues}</div>
            <p className="text-xs text-muted-foreground mt-1">Incidents reported</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports by caretaker or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredChecks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Moon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No night check reports found</p>
          </div>
        ) : (
          filteredChecks.map((check) => (
            <Card key={check.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-lg ${check.issues.length === 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
                      <Moon className={`h-6 w-6 ${check.issues.length === 0 ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                          <h3 className="font-semibold text-lg">
                            Night Check - {new Date(check.checkDate).toLocaleDateString()}
                          </h3>
                          <Badge className={cn("w-fit", check.issues.length === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800')}>
                            {check.issues.length === 0 ? (
                              <>
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                No Issues
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                {check.issues.length} {check.issues.length === 1 ? 'Issue' : 'Issues'}
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Checked by {check.performedByName} at {new Date(check.checkTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Floors Checked</p>
                          <p className="font-medium">{check.floorsChecked.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Attendance</p>
                          <p className="font-medium">
                            {check.totalTenantsPresent} Present / {check.totalTenantsAbsent} Absent
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{check.notes || "No notes provided."}</p>
                      </div>
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
