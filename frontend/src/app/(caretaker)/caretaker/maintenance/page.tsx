'use client';

import * as React from 'react';
import { 
  Wrench, 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Home,
  Camera,
  MessageSquare
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMaintenanceRequests, useUpdateMaintenanceStatus } from '@/features/caretaker';
import { useAuth } from '@/features/auth';
import { cn } from '@/lib/utils/cn';

export default function Page() {
  const { user } = useAuth();
  const { data: requests = [], isLoading } = useMaintenanceRequests();
  const updateStatusMutation = useUpdateMaintenanceStatus();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');

  const filteredRequests = React.useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = searchQuery === '' ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchQuery, statusFilter, priorityFilter]);

  const stats = React.useMemo(() => {
    const total = filteredRequests.length;
    const received = filteredRequests.filter(r => r.status === 'received').length;
    const inProgress = filteredRequests.filter(r => r.status === 'in_progress').length;
    const resolved = filteredRequests.filter(r => r.status === 'resolved').length;

    return { total, received, inProgress, resolved };
  }, [filteredRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return Clock;
      case 'in_progress':
        return Wrench;
      case 'resolved':
        return CheckCircle2;
      default:
        return AlertCircle;
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Maintenance Requests
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Track and manage all maintenance and repair requests
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Received</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.received}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No maintenance requests</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'There are no maintenance requests at this time'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            
            return (
              <Card key={request.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:items-start md:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-lg shrink-0",
                          request.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20' :
                          request.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/20' :
                          'bg-blue-100 dark:bg-blue-900/20'
                        )}>
                          <Wrench className={cn(
                            "h-5 w-5",
                            request.priority === 'high' ? 'text-red-600' :
                            request.priority === 'medium' ? 'text-amber-600' :
                            'text-blue-600'
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="font-semibold text-lg">{request.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={cn("capitalize", getStatusColor(request.status))}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {request.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={cn("capitalize", getPriorityColor(request.priority))}>
                                {request.priority}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span>Room {request.roomNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                            </div>
                            {request.photosBefore && request.photosBefore.length > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Camera className="h-4 w-4 text-muted-foreground" />
                                <span>{request.photosBefore.length} {request.photosBefore.length === 1 ? 'photo' : 'photos'}</span>
                              </div>
                            )}
                          </div>

                          {request.assignedTo && (
                            <div className="mt-3 pt-3 border-t text-sm">
                              <span className="text-muted-foreground">Assigned to: </span>
                              <span className="font-medium">{request.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      {request.status === 'received' && (
                        <Button 
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({
                            id: request.id,
                            update: {
                              status: 'in_progress',
                              message: 'Caretaker has started working on this request',
                              updatedBy: user?.id || '',
                              updatedByName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Caretaker'
                            }
                          })}
                        >
                          Start Work
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatusMutation.mutate({
                            id: request.id,
                            update: {
                              status: 'resolved',
                              message: 'Maintenance request has been resolved',
                              updatedBy: user?.id || '',
                              updatedByName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Caretaker'
                            }
                          })}
                        >
                          Mark Resolved
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
