'use client';

import * as React from 'react';
import { UserPlus, Calendar, Clock, User, Phone, IdCard, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';



import { useMyVisitorInvitations, useCreateVisitorInvitation } from '@/features/student';
import type { VisitorInvitation } from '@/features/student';

// Form schema stays same
const visitorInviteSchema = z.object({
  visitorName: z.string().min(2, 'Visitor name is required'),
  visitorPhone: z.string().optional(),
  visitorIdNumber: z.string().min(5, 'ID/Registration number is required'),
  expectedArrivalTime: z.string().min(1, 'Expected arrival time is required'),
  purpose: z.string().min(5, 'Purpose of visit is required'),
  durationHours: z.number().min(1).max(24, 'Duration must be between 1-24 hours'),
});

type VisitorInviteFormData = z.infer<typeof visitorInviteSchema>;

export default function VisitorInvitationsPage() {
  const { data: invitations = [], isLoading: isListLoading } = useMyVisitorInvitations();
  const createMutation = useCreateVisitorInvitation();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VisitorInviteFormData>({
    resolver: zodResolver(visitorInviteSchema),
    defaultValues: {
      durationHours: 2,
    },
  });

  const onSubmit = async (data: VisitorInviteFormData) => {
    try {
      await createMutation.mutateAsync(data);
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending;

  const filteredInvitations = invitations.filter(inv =>
    searchQuery === '' ||
    inv.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.visitorIdNumber.includes(searchQuery) ||
    inv.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: invitations.filter(i => i.status === 'pending').length,
    active: invitations.filter(i => i.status === 'checked_in').length,
    total: invitations.length,
  };

  const getStatusBadge = (status: VisitorInvitation['status']) => {
    const variants = {
      pending: { label: 'Pending Arrival', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
      checked_in: { label: 'In Hostel', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
      checked_out: { label: 'Checked Out', className: 'bg-muted text-muted-foreground border-border' },
      expired: { label: 'Expired', className: 'bg-destructive/15 text-destructive border-destructive/20' },
    };
    
    const variant = variants[status];
    return <Badge variant="outline" className={cn("border", variant.className)}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Visitor Invitations
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Invite visitors and track their check-in status
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite a Visitor</DialogTitle>
              <DialogDescription>
                Fill in visitor details. Caretaker will check them in when they arrive.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="visitorName">Visitor's Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="visitorName"
                    {...register('visitorName')}
                    placeholder="e.g., Jane Kamau"
                    className="pl-10"
                  />
                </div>
                {errors.visitorName && <p className="text-sm text-red-500">{errors.visitorName.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="visitorIdNumber">ID Number / Registration Number *</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="visitorIdNumber"
                    {...register('visitorIdNumber')}
                    placeholder="e.g., 34567890 or A123456"
                    className="pl-10"
                  />
                </div>
                {errors.visitorIdNumber && <p className="text-sm text-red-500">{errors.visitorIdNumber.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="visitorPhone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="visitorPhone"
                    {...register('visitorPhone')}
                    placeholder="+254712345678"
                    type="tel"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expectedArrivalTime">Expected Arrival *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="expectedArrivalTime"
                      type="datetime-local"
                      {...register('expectedArrivalTime')}
                      className="pl-10"
                    />
                  </div>
                  {errors.expectedArrivalTime && <p className="text-sm text-red-500">{errors.expectedArrivalTime.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="durationHours">Duration (Hours) *</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    min="1"
                    max="24"
                    {...register('durationHours', { valueAsNumber: true })}
                    placeholder="2"
                  />
                  {errors.durationHours && <p className="text-sm text-red-500">{errors.durationHours.message}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purpose">Purpose of Visit *</Label>
                <Textarea
                  id="purpose"
                  {...register('purpose')}
                  placeholder="e.g., Family visit for birthday celebration"
                  rows={3}
                />
                {errors.purpose && <p className="text-sm text-red-500">{errors.purpose.message}</p>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-background to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Arrivals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Waiting for check-in</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currently Visiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">In the hostel now</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by visitor name, ID number, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Visitor Invitations</CardTitle>
          <CardDescription>Track all visitors you've invited to the hostel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Expected Arrival</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No visitor invitations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invitation.visitorName}</p>
                          {invitation.visitorPhone && (
                            <p className="text-xs text-muted-foreground">{invitation.visitorPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{invitation.visitorIdNumber}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(invitation.expectedArrivalTime).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{invitation.purpose}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell className="text-sm">
                        {invitation.checkedInAt ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            {new Date(invitation.checkedInAt).toLocaleTimeString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {invitation.checkedOutAt ? (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            {new Date(invitation.checkedOutAt).toLocaleTimeString()}
                          </div>
                        ) : invitation.checkedInAt ? (
                          <span className="text-muted-foreground">Still visiting</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <IdCard className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">
                How Visitor Invitations Work
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Fill in visitor details including ID number and expected arrival time</li>
                <li>• Caretaker will check them in when they arrive at the gate</li>
                <li>• Caretaker will check them out when they leave</li>
                <li>• Times are automatically recorded for security purposes</li>
                <li>• All visitors must have valid ID for security</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
