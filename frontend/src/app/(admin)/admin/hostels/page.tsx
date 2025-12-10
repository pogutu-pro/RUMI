"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Filter
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useHostels } from "@/hooks/use-hostels";
import { useAdminStore } from "@/stores/admin.store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export default function Page() {
  const router = useRouter();
  const { hostelFilters, setHostelFilters } = useAdminStore();
  const [localSearch, setLocalSearch] = useState(hostelFilters.search || "");

  // Fetch real data
  const { data: hostels, isLoading } = useHostels({
     search: hostelFilters.search,
     status: hostelFilters.approvalStatus === 'all' ? undefined : hostelFilters.approvalStatus
  });

  // Calculate statistics (client-side aggregation for now if not provided by API)
  const stats = useMemo(() => {
    if (!hostels) return { total: 0, approved: 0, pending: 0, averageOccupancy: 0 };
    
    return {
      total: hostels.length,
      approved: hostels.filter(h => h.is_verified).length, // mapping verified to approved for simplicity or check status
      pending: hostels.filter(h => h.status === 'inactive' && !h.is_verified).length, // assumption
      averageOccupancy: Math.round(
        (hostels.reduce((acc, h) => {
           // Basic calculation if rooms data present, else mock logic or 0
           const total = h.total_rooms || 0;
           const avail = h.available_rooms || 0;
           const occupied = total - avail;
           return acc + (total > 0 ? (occupied / total) * 100 : 0);
        }, 0) / (hostels.length || 1))
      ),
    };
  }, [hostels]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    // Debounce this in production
    setHostelFilters({ ...hostelFilters, search: value });
  };

  const handleCreateHostel = () => {
      // In admin view, maybe not needed, or redirect to a form
  };

  if (isLoading) {
      return (
          <div className="space-y-6">
              <div className="flex justify-between">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
              <Skeleton className="h-96 rounded-xl" />
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hostel Management</h1>
          <p className="mt-1 text-muted-foreground">Manage all hostels, approvals, and property details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hostels</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">{stats.total}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active & Verified</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">{stats.approved}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">{stats.pending}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Occupancy</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">{stats.averageOccupancy}%</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                 <CardTitle className="text-lg font-semibold">All Hostels</CardTitle>
                 <CardDescription>View and manage property listings</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hostels..."
                  className="pl-9 bg-background"
                  value={localSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select
                value={hostelFilters.approvalStatus || 'all'}
                onValueChange={(value: any) => setHostelFilters({ ...hostelFilters, approvalStatus: value })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[400px]">
            <Table>
                <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Hostel</TableHead>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {hostels?.map((hostel) => (
                    <TableRow key={hostel.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/admin/hostels/${hostel.id}`)}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{hostel.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{hostel.hostel_type.replace('_', ' ')}</p>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{hostel.landlord_name}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {hostel.city}
                        </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {hostel.total_rooms > 0 
                            ? `${hostel.total_rooms - hostel.available_rooms}/${hostel.total_rooms} (${Math.round(((hostel.total_rooms - hostel.available_rooms) / hostel.total_rooms) * 100)}%)` 
                            : 'N/A'
                        }
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                       {hostel.total_rooms}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn(
                            "capitalize",
                            hostel.status === 'active' 
                             ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" 
                             : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                        )}>
                            {hostel.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/hostels/${hostel.id}`) }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                            </DropdownMenuItem>
                            {!hostel.is_verified && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400">
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Verify Hostel
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                {!hostels?.length && (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            No hostels found.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
