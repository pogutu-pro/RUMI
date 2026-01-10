'use client';

import * as React from 'react';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Search, Filter, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useRoommateRequests, useApproveRoommateRequest, useRejectRoommateRequest } from '@/features/caretaker';

interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  phone: string;
  avatar?: string;
  course: string;
  year: number;
  university: string;
}

interface RoommateMatchRequest {
  id: string;
  requester: Student;
  requestedRoommate: Student;
  compatibilityScore: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  sharedInterests: string[];
  lifestyleCompatibility: {
    sleepSchedule: number;
    cleanliness: number;
    noiseTolerance: number;
    studyHabits: number;
  };
}


export default function RoommateMatchingPage() {
  // Use real API hooks
  const { data: apiRequests = [], isLoading: isLoadingRequests } = useRoommateRequests();
  const approveRequest = useApproveRoommateRequest();
  const rejectRequest = useRejectRoommateRequest();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [selectedRequest, setSelectedRequest] = React.useState<RoommateMatchRequest | null>(null);
  
  // Map API data to component format
  const requests: RoommateMatchRequest[] = apiRequests.map(req => ({
    id: req.id,
    requester: {
      id: req.requesterId,
      name: req.requesterName,
      studentId: req.requesterId,
      email: '',
      phone: '',
      course: '',
      year: 0,
      university: '',
    },
    requestedRoommate: {
      id: req.requesteeId,
      name: req.requesteeName,
      studentId: req.requesteeId,
      email: '',
      phone: '',
      course: '',
      year: 0,
      university: '',
    },
    compatibilityScore: req.matchScore,
    requestDate: req.createdAt,
    status: req.status,
    reason: req.requestReason,
    sharedInterests: [],
    lifestyleCompatibility: {
      sleepSchedule: 0,
      cleanliness: 0,
      noiseTolerance: 0,
      studyHabits: 0,
    },
  }));

  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchQuery === '' ||
      req.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedRoommate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.studentId.includes(searchQuery) ||
      req.requestedRoommate.studentId.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    avgCompatibility: Math.round(
      requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.compatibilityScore, 0) /
      Math.max(requests.filter(r => r.status === 'pending').length, 1)
    ),
  };


  const handleApprove = async (request: RoommateMatchRequest) => {
    approveRequest.mutate(request.id, {
      onSuccess: () => {
        setSelectedRequest(null);
        toast.success('Roommate match approved', {
          description: `${request.requester.name} and ${request.requestedRoommate.name} can now be assigned to the same room`,
        });
      },
      onError: (error: any) => {
        toast.error('Failed to approve request', {
          description: error.message || 'Please try again',
        });
      },
    });
  };


  const handleReject = async (request: RoommateMatchRequest) => {
    rejectRequest.mutate(
      { id: request.id, reason: 'Rejected by caretaker' },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          toast.error('Roommate match rejected', {
            description: 'Students will be notified of the decision',
          });
        },
        onError: (error: any) => {
          toast.error('Failed to reject request', {
            description: error.message || 'Please try again',
          });
        },
      }
    );
  };

  const getStatusBadge = (status: RoommateMatchRequest['status']) => {
    const variants = {
      pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    };
    
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

   return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Roommate Matching
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Review and approve roommate match requests based on compatibility
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to assign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground mt-1">Not compatible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgCompatibility}%</div>
            <p className="text-xs text-muted-foreground mt-1">Of pending requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No roommate requests found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Students Section */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Match Request</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("text-lg font-bold", getCompatibilityColor(request.compatibilityScore))}
                      >
                        {request.compatibilityScore}% Match
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      {/* Requester */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.requester.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {request.requester.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.requester.name}</p>
                            <p className="text-sm text-muted-foreground">{request.requester.studentId}</p>
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">{request.requester.course} - Year {request.requester.year}</p>
                          <p className="text-muted-foreground">{request.requester.university}</p>
                        </div>
                      </div>

                      {/* Requested Roommate */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.requestedRoommate.avatar} />
                            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                              {request.requestedRoommate.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.requestedRoommate.name}</p>
                            <p className="text-sm text-muted-foreground">{request.requestedRoommate.studentId}</p>
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">{request.requestedRoommate.course} - Year {request.requestedRoommate.year}</p>
                          <p className="text-muted-foreground">{request.requestedRoommate.university}</p>
                        </div>
                      </div>
                    </div>

                    {/* Compatibility Details */}
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Compatibility Analysis</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Sleep Schedule</p>
                          <div className="text-sm font-semibold text-primary">
                            {request.lifestyleCompatibility.sleepSchedule}%
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Cleanliness</p>
                          <div className="text-sm font-semibold text-primary">
                            {request.lifestyleCompatibility.cleanliness}%
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Noise Tolerance</p>
                          <div className="text-sm font-semibold text-primary">
                            {request.lifestyleCompatibility.noiseTolerance}%
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Study Habits</p>
                          <div className="text-sm font-semibold text-primary">
                            {request.lifestyleCompatibility.studyHabits}%
                          </div>
                        </div>
                      </div>

                      {request.sharedInterests.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-2">Shared Interests</p>
                          <div className="flex flex-wrap gap-2">
                            {request.sharedInterests.map((interest) => (
                              <Badge key={interest} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 p-3 rounded-lg bg-muted">
                        <p className="text-sm">{request.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="lg:w-48 flex lg:flex-col gap-3 lg:justify-start">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleReject(request)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Requested {new Date(request.requestDate).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approval Confirmation Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Roommate Match?</DialogTitle>
              <DialogDescription>
                Confirm that you want to approve this roommate match request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{selectedRequest.requester.name}</p>
                  <p className="text-sm text-muted-foreground">&</p>
                  <p className="font-medium">{selectedRequest.requestedRoommate.name}</p>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Compatibility Score:</strong> {selectedRequest.compatibilityScore}%
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                After approval, you can assign both students to the same room in the Roommates Management section.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApprove(selectedRequest)}
                disabled={approveRequest.isPending}
              >
                {approveRequest.isPending ? 'Approving...' : 'Confirm Approval'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
