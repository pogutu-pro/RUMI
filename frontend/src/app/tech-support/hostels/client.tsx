"use client";

import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useTechSupportStore } from '@/features/support';
import { useHostels } from '@/features/hostels';
import { HostelTable } from '@/features/support';

interface HostelSupportClientProps {
  defaultStatus?: string;
}

export default function HostelSupportClient({ defaultStatus = "all" }: HostelSupportClientProps) {
  const { data: response, isLoading: isLoadingHostels } = useHostels();
  const rawHostels = response?.results || [];

  // Transform hostels data to match TechSupportHostel interface
  const hostels = rawHostels.map(hostel => ({
    id: String(hostel.id),
    name: hostel.name,
    landlord_name: `Landlord ${hostel.id}`, // Mock landlord name since it's not in the API
    location: `${hostel.address}, ${hostel.city}`,
    status: hostel.status as 'pending' | 'active' | 'hidden' | 'flagged',
    rooms_count: hostel.total_rooms,
    is_verified: hostel.is_verified
  }));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(defaultStatus);

  const filteredHostels = hostels.filter(hostel =>
    hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hostel.landlord_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hostel.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerify = (hostelId: string) => {
    console.log("Verify hostel", hostelId);
  };

  const handleToggleVisibility = (hostelId: string) => {
    console.log("Toggle visibility", hostelId);
  };

  const handleFlag = (hostelId: string) => {
    console.log("Flag hostel", hostelId);
  };

  const handleViewDetails = (hostelId: string) => {
    console.log("View details", hostelId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hostel Support
          </h1>
          <p className="text-muted-foreground mt-1">
            Verify listings, manage compliance, and handle safety reports.
          </p>
        </div>
        <Button variant="secondary" className="bg-background border border-input shadow-sm hover:bg-accent/50">
          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
          Review Pending (3)
        </Button>
      </div>

      <Tabs defaultValue={defaultStatus} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="all">All Hostels</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hostel Listings</CardTitle>
                  <CardDescription>
                    Comprehensive list of all hostels on the platform.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  Filter Location
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search hostel, landlord, or location..."
                    className="pl-9 bg-background/50 border-input/60 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <HostelTable
                hostels={filteredHostels}
                isLoading={isLoadingHostels}
                onVerify={handleVerify}
                onToggleVisibility={handleToggleVisibility}
                onFlag={handleFlag}
                onViewDetails={handleViewDetails}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed border-muted/50 hover:bg-muted/20 transition-colors">
            <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-500/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No Pending Approvals</h3>
            <p className="max-w-sm mt-2">All submitted hostel listings have been reviewed and processed.</p>
          </div>
        </TabsContent>

        <TabsContent value="flagged">
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed border-muted/50 hover:bg-muted/20 transition-colors">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No Flagged Hostels</h3>
            <p className="max-w-sm mt-2">There are no active safety investigations or flagged properties at the moment.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
