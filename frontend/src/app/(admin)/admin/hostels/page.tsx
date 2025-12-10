"use client";

import * as React from 'react';
import { 
  Search, 
  Download,
  Building2,
  MapPin,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  CheckSquare,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/stores/admin.store";

// Sample hostel data - Replace with actual API call
const sampleHostels = [
  {
    id: "1",
    name: "Parklands Heights",
    landlord: "John Kamau",
    location: "Parklands, Nairobi",
    totalRooms: 45,
    occupiedRooms: 38,
    monthlyRevenue: 425000,
    approvalStatus: "approved",
    isActive: true,
    createdDate: "2024-01-10",
  },
  {
    id: "2",
    name: "Westlands Plaza",
    landlord: "Sarah Wanjiru",
    location: "Westlands, Nairobi",
    totalRooms: 60,
    occupiedRooms: 55,
    monthlyRevenue: 680000,
    approvalStatus: "approved",
    isActive: true,
    createdDate: "2023-11-20",
  },
  {
    id: "3",
    name: "Kilimani Suites",
    landlord: "Michael Otieno",
    location: "Kilimani, Nairobi",
    totalRooms: 30,
    occupiedRooms: 0,
    monthlyRevenue: 0,
    approvalStatus: "pending",
    isActive: false,
    createdDate: "2024-11-25",
  },
  {
    id: "4",
    name: "Campus View Residence",
    landlord: "Jane Mwangi",
    location: "Karen, Nairobi",
    totalRooms: 52,
    occupiedRooms: 48,
    monthlyRevenue: 560000,
    approvalStatus: "approved",
    isActive: true,
    createdDate: "2024-02-15",
  },
  {
    id: "5",
    name: "University Heights",
    landlord: "David Odhiambo",
    location: "Ruaraka, Nairobi",
    totalRooms: 40,
    occupiedRooms: 0,
    monthlyRevenue: 0,
    approvalStatus: "rejected",
    isActive: false,
    createdDate: "2024-11-01",
  },
];

export default function Page() {
  const { hostelFilters, setHostelFilters } = useAdminStore();

  // Filter hostels
  const filteredHostels = React.useMemo(() => {
    return sampleHostels.filter((hostel) => {
      if (hostelFilters.search && !hostel.name.toLowerCase().includes(hostelFilters.search.toLowerCase()) &&
          !hostel.landlord.toLowerCase().includes(hostelFilters.search.toLowerCase()) &&
          !hostel.location.toLowerCase().includes(hostelFilters.search.toLowerCase())) {
        return false;
      }
      if (hostelFilters.approvalStatus !== 'all' && hostel.approvalStatus !== hostelFilters.approvalStatus) {
        return false;
      }
      if (hostelFilters.location && !hostel.location.toLowerCase().includes(hostelFilters.location.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [hostelFilters]);

  // Calculate statistics
  const stats = React.useMemo(() => ({
    total: sampleHostels.length,
    approved: sampleHostels.filter(h => h.approvalStatus === 'approved').length,
    pending: sampleHostels.filter(h => h.approvalStatus === 'pending').length,
    averageOccupancy: Math.round(
      (sampleHostels.reduce((acc, h) => acc + (h.totalRooms > 0 ? (h.occupiedRooms / h.totalRooms) * 100 : 0), 0) / sampleHostels.length)
    ),
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Hostel Management</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Manage all hostels, approvals, and property details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Hostels</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</h3>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.approved}</h3>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Approval</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.pending}</h3>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Occupancy</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.averageOccupancy}%</h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">All Hostels</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search hostels..."
                  className="pl-9 bg-white dark:bg-slate-800"
                  value={hostelFilters.search}
                  onChange={(e) => setHostelFilters({ search: e.target.value })}
                />
              </div>
              <Select
                value={hostelFilters.approvalStatus}
                onValueChange={(value: any) => setHostelFilters({ approvalStatus: value })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Approval Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostel</TableHead>
                <TableHead>Landlord</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHostels.map((hostel) => (
                <TableRow key={hostel.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{hostel.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{hostel.totalRooms} rooms</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{hostel.landlord}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {hostel.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {hostel.totalRooms > 0 ? `${hostel.occupiedRooms}/${hostel.totalRooms} (${Math.round((hostel.occupiedRooms / hostel.totalRooms) * 100)}%)` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    KES {hostel.monthlyRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {hostel.approvalStatus === 'approved' && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {hostel.approvalStatus === 'pending' && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {hostel.approvalStatus === 'rejected' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {hostel.approvalStatus === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400">
                              <CheckSquare className="mr-2 h-4 w-4" />
                              Approve Hostel
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Hostel
                            </DropdownMenuItem>
                          </>
                        )}
                        {hostel.approvalStatus === 'approved' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend Hostel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
