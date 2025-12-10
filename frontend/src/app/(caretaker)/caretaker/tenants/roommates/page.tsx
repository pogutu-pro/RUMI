'use client';

import * as React from 'react';
import { 
  Users, 
  Home, 
  Search, 
  UserPlus, 
  ArrowRightLeft,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Phone
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';

interface Tenant {
  id: string;
  name: string;
  studentId: string;
  email: string;
  phone: string;
  avatar?: string;
  course: string;
  checkInDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
}

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  roomType: 'single' | 'double' | 'triple' | 'quad';
  status: 'full' | 'partial' | 'empty' | 'maintenance';
  tenants: Tenant[];
  monthlyRent: number;
}

const mockRooms: Room[] = [
  {
    id: '1',
    roomNumber: '201',
    floor: 2,
    capacity: 2,
    currentOccupancy: 2,
    roomType: 'double',
    status: 'full',
    monthlyRent: 12000,
    tenants: [
      {
        id: 't1',
        name: 'John Omondi',
        studentId: 'STU2024001',
        email: 'john.omondi@student.ac.ke',
        phone: '+254712345678',
        course: 'Computer Science',
        checkInDate: '2024-09-01',
        paymentStatus: 'paid',
      },
      {
        id: 't2',
        name: 'Peter Mwangi',
        studentId: 'STU2024002',
        email: 'peter.mwangi@student.ac.ke',
        phone: '+254723456789',
        course: 'Engineering',
        checkInDate: '2024-09-01',
        paymentStatus: 'paid',
      },
    ],
  },
  {
    id: '2',
    roomNumber: '202',
    floor: 2,
    capacity: 2,
    currentOccupancy: 1,
    roomType: 'double',
    status: 'partial',
    monthlyRent: 12000,
    tenants: [
      {
        id: 't3',
        name: 'Sarah Wanjiku',
        studentId: 'STU2024003',
        email: 'sarah.wanjiku@student.ac.ke',
        phone: '+254734567890',
        course: 'Medicine',
        checkInDate: '2024-09-15',
        paymentStatus: 'paid',
      },
    ],
  },
  {
    id: '3',
    roomNumber: '203',
    floor: 2,
    capacity: 1,
    currentOccupancy: 1,
    roomType: 'single',
    status: 'full',
    monthlyRent: 15000,
    tenants: [
      {
        id: 't4',
        name: 'Grace Akinyi',
        studentId: 'STU2024004',
        email: 'grace.akinyi@student.ac.ke',
        phone: '+254745678901',
        course: 'Medicine',
        checkInDate: '2024-09-01',
        paymentStatus: 'pending',
      },
    ],
  },
  {
    id: '4',
    roomNumber: '204',
    floor: 2,
    capacity: 2,
    currentOccupancy: 0,
    roomType: 'double',
    status: 'empty',
    monthlyRent: 12000,
    tenants: [],
  },
  {
    id: '5',
    roomNumber: '205',
    floor: 2,
    capacity: 3,
    currentOccupancy: 3,
    roomType: 'triple',
    status: 'full',
    monthlyRent: 10000,
    tenants: [
      {
        id: 't5',
        name: 'David Kipchoge',
        studentId: 'STU2024005',
        email: 'david.kipchoge@student.ac.ke',
        phone: '+254756789012',
        course: 'Business',
        checkInDate: '2024-09-01',
        paymentStatus: 'paid',
      },
      {
        id: 't6',
        name: 'Brian Otieno',
        studentId: 'STU2024006',
        email: 'brian.otieno@student.ac.ke',
        phone: '+254767890123',
        course: 'Accounting',
        checkInDate: '2024-09-05',
        paymentStatus: 'paid',
      },
      {
        id: 't7',
        name: 'Michael Njoroge',
        studentId: 'STU2024007',
        email: 'michael.njoroge@student.ac.ke',
        phone: '+254778901234',
        course: 'Economics',
        checkInDate: '2024-09-10',
        paymentStatus: 'overdue',
      },
    ],
  },
  {
    id: '6',
    roomNumber: '206',
    floor: 2,
    capacity: 2,
    currentOccupancy: 0,
    roomType: 'double',
    status: 'maintenance',
    monthlyRent: 12000,
    tenants: [],
  },
];

export default function RoommatesManagementPage() {
  const [rooms, setRooms] = React.useState<Room[]>(mockRooms);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = searchQuery === '' ||
      room.roomNumber.includes(searchQuery) ||
      room.tenants.some(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.studentId.includes(searchQuery)
      );

    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRooms: rooms.length,
    fullRooms: rooms.filter(r => r.status === 'full').length,
    partialRooms: rooms.filter(r => r.status === 'partial').length,
    emptyRooms: rooms.filter(r => r.status === 'empty').length,
    maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length,
    totalTenants: rooms.reduce((sum, r) => sum + r.currentOccupancy, 0),
    availableSpots: rooms
      .filter(r => r.status !== 'maintenance')
      .reduce((sum, r) => sum + (r.capacity - r.currentOccupancy), 0),
  };

  const getStatusBadge = (status: Room['status']) => {
    const variants = {
      full: { label: 'Full', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      partial: { label: 'Needs Roommate', icon: AlertCircle, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' },
      empty: { label: 'Empty', icon: Home, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      maintenance: { label: 'Maintenance', icon: AlertCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };
    
    const variant = variants[status];
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: Tenant['paymentStatus']) => {
    const variants = {
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };
    
    return <Badge className={`${variants[status].className} text-xs`}>{variants[status].label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Roommate Groups
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Manage roommate assignments and room occupancy
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalTenants} tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Need Roommates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.partialRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.availableSpots} spots available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Full Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.fullRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">All spots filled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empty Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.emptyRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.maintenanceRooms} in maintenance</p>
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
                  placeholder="Search by room number, student name, or ID..."
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
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="full">Full Occupancy</SelectItem>
                <SelectItem value="partial">Need Roommates</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <Card 
            key={room.id}
            className={cn(
              "hover:shadow-lg transition-all cursor-pointer",
              room.status === 'partial' && "border-amber-200 dark:border-amber-800",
              room.status === 'maintenance' && "opacity-60"
            )}
            onClick={() => setSelectedRoom(room)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                  <CardDescription>Floor {room.floor} • {room.roomType}</CardDescription>
                </div>
                {getStatusBadge(room.status)}
              </div>
            </CardHeader>
            <CardContent>
              {/* Occupancy Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-semibold">
                    {room.currentOccupancy}/{room.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      room.status === 'full' && "bg-green-600",
                      room.status === 'partial' && "bg-amber-500",
                      room.status === 'empty' && "bg-gray-400"
                    )}
                    style={{ width: `${(room.currentOccupancy / room.capacity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tenants */}
              {room.tenants.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Current Tenants</p>
                  {room.tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={tenant.avatar} />
                        <AvatarFallback className="text-xs">
                          {tenant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.studentId}</p>
                      </div>
                      {getPaymentBadge(tenant.paymentStatus)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {room.status === 'maintenance' ? 'Under maintenance' : 'No tenants assigned'}
                  </p>
                </div>
              )}

              {/* Available Spots */}
              {room.status === 'partial' && room.capacity - room.currentOccupancy > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                    {room.capacity - room.currentOccupancy} {room.capacity - room.currentOccupancy === 1 ? 'spot' : 'spots'} available
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Can assign {room.capacity - room.currentOccupancy} more {room.capacity - room.currentOccupancy === 1 ? 'student' : 'students'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No rooms found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Room Details Dialog */}
      {selectedRoom && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRoom(null)}
        >
          <Card 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Room {selectedRoom.roomNumber} Details</CardTitle>
                  <CardDescription>Floor {selectedRoom.floor} • {selectedRoom.roomType} • KES {selectedRoom.monthlyRent.toLocaleString()}/month</CardDescription>
                </div>
                {getStatusBadge(selectedRoom.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Occupancy Info */}
              <div>
                <h3 className="font-semibold mb-3">Occupancy Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-2xl font-bold">{selectedRoom.capacity}</p>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-2xl font-bold">{selectedRoom.currentOccupancy}</p>
                    <p className="text-xs text-muted-foreground">Occupied</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-2xl font-bold">{selectedRoom.capacity - selectedRoom.currentOccupancy}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </div>
              </div>

              {/* Tenants Details */}
              {selectedRoom.tenants.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Current Tenants</h3>
                  <div className="space-y-3">
                    {selectedRoom.tenants.map((tenant) => (
                      <div key={tenant.id} className="p-4 rounded-lg border">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={tenant.avatar} />
                            <AvatarFallback>
                              {tenant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{tenant.name}</p>
                                <p className="text-sm text-muted-foreground">{tenant.studentId}</p>
                              </div>
                              {getPaymentBadge(tenant.paymentStatus)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">{tenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{tenant.phone}</span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{tenant.course}</span>
                              <span>•</span>
                              <span>Checked in: {new Date(tenant.checkInDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedRoom.status !== 'maintenance' && selectedRoom.currentOccupancy < selectedRoom.capacity && (
                  <Button className="flex-1">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Student
                  </Button>
                )}
                {selectedRoom.currentOccupancy > 0 && (
                  <Button variant="outline" className="flex-1">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transfer Student
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRoom(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
