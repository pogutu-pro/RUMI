"use client";

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  CheckCircle2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTechSupportStore } from '@/stores/tech-support.store';
import { HostelTable } from '@/components/tech-support/hostel-table';

export default function HostelSupportPage() {
  const { hostels, isLoadingHostels, fetchHostels } = useTechSupportStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hostel Support</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Verify listings, manage visibility, and handle reports.
          </p>
        </div>
        <Button>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Review Pending (3)
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Hostels</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="flagged">Flagged / Reported</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Hostel Listings</CardTitle>
              <CardDescription>
                Overview of all hostels on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Search hostel, landlord, or location..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
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
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-medium text-slate-900">No Pending Approvals</h3>
            <p>All hostel listings have been reviewed.</p>
          </div>
        </TabsContent>

        <TabsContent value="flagged">
           <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-medium text-slate-900">No Flagged Hostels</h3>
            <p>There are no active investigations.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
