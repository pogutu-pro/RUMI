'use client';

import * as React from 'react';
import { UserCheck, Search, Clock, User, CheckCircle, Home, Calendar, LogOut, Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateVisitorLog } from '@/features/caretaker/hooks/use-security';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useVisitorLogs, useCheckOutVisitor } from '@/features/caretaker/hooks/use-security';

export default function VisitorLogsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isCheckInOpen, setIsCheckInOpen] = React.useState(false);
  
  // Use real API hooks
  const { data: logs = [], isLoading } = useVisitorLogs();
  const checkInMutation = useCreateVisitorLog(); // Assuming this hook exists from previous context
  const checkOutMutation = useCheckOutVisitor();

  // Form state for manual check-in
  const [formData, setFormData] = React.useState({
    visitorName: '',
    visitorPhone: '',
    visitorIdNumber: '',
    studentName: '',
    roomNumber: '',
    purpose: 'Visit'
  });

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    checkInMutation.mutate({
      visitorName: formData.visitorName,
      visitorPhone: formData.visitorPhone,
      visitorIdNumber: formData.visitorIdNumber,
      tenantId: 'manual-entry', // distinct from digital invite
      tenantName: formData.studentName,
      roomNumber: formData.roomNumber,
      purpose: formData.purpose,
      timeIn: new Date().toISOString(),
    }, {
      onSuccess: () => {
        setIsCheckInOpen(false);
        setFormData({ visitorName: '', visitorPhone: '', visitorIdNumber: '', studentName: '', roomNumber: '', purpose: 'Visit' });
        toast.success("Visitor Checked In", {
           description: "Entry time recorded successfully."
        });
      },
      onError: () => toast.error("Failed to log visitor")
    });
  };

  const filteredLogs = logs.filter(log =>
    searchQuery === '' ||
    log.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.roomNumber.includes(searchQuery) ||
    (log.visitorIdNumber && log.visitorIdNumber.includes(searchQuery))
  );

  const stats = {
    active: logs.filter(l => !l.timeOut).length,
    todayTotal: logs.filter(l => 
      new Date(l.timeIn).toDateString() === new Date().toDateString()
    ).length,
    weeklyTotal: logs.length // Simple total for now
  };

  const handleCheckOut = async (log: any) => {
    checkOutMutation.mutate({
      id: log.id,
      timeOut: new Date().toISOString(),
    }, {
        onSuccess: () => {
          toast.success("Visitor Checked Out", {
            description: `${log.visitorName} has departed.`
          });
        },
        onError: () => {
          toast.error("Check-out Failed", {
             description: "Could not update visitor record."
          });
        }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Visitor Logs
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
             Track and manage visitor entry and exit logs
          </p>
        </div>
        
        <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-4 w-4" />
              New Visitor Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Visitor Entry</DialogTitle>
              <DialogDescription>
                Record a new visitor arrival. Time is recorded automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleManualCheckIn} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visitorName">Visitor Name</Label>
                  <Input 
                    id="visitorName" 
                    required 
                    value={formData.visitorName}
                    onChange={e => setFormData({...formData, visitorName: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitorPhone">Phone (Optional)</Label>
                  <Input 
                    id="visitorPhone" 
                    value={formData.visitorPhone}
                    onChange={e => setFormData({...formData, visitorPhone: e.target.value})}
                    placeholder="07..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitorId">ID Number (Optional)</Label>
                <Input 
                  id="visitorId" 
                  value={formData.visitorIdNumber}
                  onChange={e => setFormData({...formData, visitorIdNumber: e.target.value})}
                  placeholder="ID/Passport"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="room">Room No.</Label>
                  <Input 
                    id="room" 
                    required 
                    value={formData.roomNumber}
                    onChange={e => setFormData({...formData, roomNumber: e.target.value})}
                    placeholder="e.g. 101"
                  />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="student">Student Name</Label>
                   <Input 
                     id="student" 
                     required 
                     value={formData.studentName}
                     onChange={e => setFormData({...formData, studentName: e.target.value})}
                     placeholder="Visiting who?"
                   />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input 
                  id="purpose" 
                  required 
                  value={formData.purpose}
                  onChange={e => setFormData({...formData, purpose: e.target.value})}
                  placeholder="e.g. Study, Visit, Delivery"
                />
              </div>

              <Button type="submit" disabled={checkInMutation.isPending} className="w-full mt-2">
                {checkInMutation.isPending ? "Recording..." : "Check In Visitor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currently Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Visitors in hostel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayTotal}</div>
            <p className="text-xs text-muted-foreground mt-1">Entries today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">{stats.weeklyTotal}</div>
            <p className="text-xs text-muted-foreground mt-1">All recorded records</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by visitor, tenant, room, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visitor Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recorded Visits</CardTitle>
          <CardDescription>History of visitor entries and exits</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Tenant & Room</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-24 text-center">
                        Loading visitor logs...
                     </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No visitor logs found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const isActive = !log.timeOut;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.visitorName}</p>
                            {log.visitorPhone && (
                              <p className="text-xs text-muted-foreground">{log.visitorPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.tenantName}</p>
                            <Badge variant="outline" className="font-mono text-xs mt-1">
                              Room {log.roomNumber}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.purpose}>
                           {log.purpose}
                        </TableCell>
                        <TableCell className="text-sm font-variant-numeric tabular-nums">
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                             <Clock className="h-3 w-3" />
                             {new Date(log.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-variant-numeric tabular-nums">
                          {log.timeOut ? (
                             <span className="text-muted-foreground">
                               {new Date(log.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                             </span>
                          ) : (
                             <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                           <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                             {isActive ? 'Active' : 'Departed'}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCheckOut(log)}
                              disabled={checkOutMutation.isPending}
                            >
                              Check Out
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
             {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
             ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                No visitor logs found
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isActive = !log.timeOut;
                return (
                  <Card key={log.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <User className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-base">{log.visitorName}</h3>
                            <p className="text-sm text-muted-foreground">{log.visitorPhone || 'No phone'}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={isActive ? "default" : "secondary"}
                          className={isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                        >
                          {isActive ? 'Active' : 'Departed'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
                        <div className="col-span-2 p-2 bg-muted/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-0.5">Visiting</span>
                          <span className="font-medium">{log.tenantName} <span className="text-muted-foreground">• Room {log.roomNumber}</span></span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs mb-0.5">Time In</span>
                          <span className="font-medium flex items-center gap-1.5">
                             <Clock className="h-3.5 w-3.5 text-green-600" />
                             {new Date(log.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs mb-0.5">Time Out</span>
                          <span className="font-medium">
                            {log.timeOut ? new Date(log.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleCheckOut(log)}
                          disabled={checkOutMutation.isPending}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Check Out Visitor
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
