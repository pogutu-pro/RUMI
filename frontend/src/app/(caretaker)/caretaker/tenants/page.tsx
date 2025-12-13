"use client";

import * as React from 'react';
import { Search, Filter, UserCircle, Phone, Mail, Home, Calendar, CreditCard, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenants } from "@/features/caretaker";
import { useCaretakerStore } from "@/features/caretaker";
import { getPaymentStatusColor, formatDate, getInitials } from "@/lib/utils/caretaker-helpers";
import { cn } from "@/lib/utils/cn";

export default function Page() {
  const { tenantFilters, setTenantFilters, resetTenantFilters } = useCaretakerStore();
  const { data: tenants = [], isLoading } = useTenants(tenantFilters);

  const [searchQuery, setSearchQuery] = React.useState(tenantFilters.search || '');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTenantFilters({ search: searchQuery });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, setTenantFilters]);

  const filteredTenants = React.useMemo(() => {
    let filtered = tenants;

    if (tenantFilters.paymentStatus && tenantFilters.paymentStatus !== 'all') {
      filtered = filtered.filter(t => t.paymentStatus === tenantFilters.paymentStatus);
    }

    if (tenantFilters.status && tenantFilters.status !== 'all') {
      filtered = filtered.filter(t => t.status === tenantFilters.status);
    }

    return filtered;
  }, [tenants, tenantFilters]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
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
          Student Tenants
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          Manage all students currently living in the hostel
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, room, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={tenantFilters.paymentStatus || 'all'}
              onValueChange={(value) => setTenantFilters({ paymentStatus: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={tenantFilters.status || 'active'}
              onValueChange={(value) => setTenantFilters({ status: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(tenantFilters.search || tenantFilters.paymentStatus !== 'all' || tenantFilters.status !== 'active') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTenantFilters}
              className="mt-4"
            >
              Reset Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold">{filteredTenants.length}</span> tenant{filteredTenants.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tenant List */}
      <div className="grid gap-4">
        {filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No tenants found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Tenant Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={tenant.profile_picture} alt={`${tenant.first_name} ${tenant.last_name}`} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                          {getInitials(tenant.first_name, tenant.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {tenant.first_name} {tenant.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Student ID: {tenant.studentId}
                            </p>
                          </div>
                          <Badge className={getPaymentStatusColor(tenant.paymentStatus)}>
                            {tenant.paymentStatus.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{tenant.email}</span>
                          </div>
                          {tenant.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{tenant.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>Room {tenant.roomNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Since {formatDate(tenant.checkInDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Guardian Contact */}
                  <div className="md:w-80 md:border-l md:pl-6">
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                      Guardian / Emergency Contact
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">{tenant.guardianName}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {tenant.guardianRelationship}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <a 
                          href={`tel:${tenant.guardianPhone}`}
                          className="text-primary hover:underline"
                        >
                          {tenant.guardianPhone}
                        </a>
                      </div>
                      
                      {tenant.emergencyContactName && (
                        <div className="pt-3 mt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Alternative Contact</p>
                          <p className="text-sm font-medium">{tenant.emergencyContactName}</p>
                          {tenant.emergencyContactPhone && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <a 
                                href={`tel:${tenant.emergencyContactPhone}`}
                                className="text-primary hover:underline text-sm"
                              >
                                {tenant.emergencyContactPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button variant="outline" size="sm" className="w-full mt-4">
                      View Full Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{tenant.university}</span>
                  {tenant.course && (
                    <>
                      <span>•</span>
                      <span>{tenant.course}</span>
                    </>
                  )}
                  {tenant.yearOfStudy && (
                    <>
                      <span>•</span>
                      <span>Year {tenant.yearOfStudy}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
