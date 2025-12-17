"use client";

import * as React from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DamageReportList, useDamageReports, useCreateDamageReport, DamageReportForm } from '@/features/inventory';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function DamageReportsPage() {
  const { data: reports, isLoading, error } = useDamageReports();
  const createReport = useCreateDamageReport();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const filteredReports = React.useMemo(() => {
    if (!reports) return [];
    return reports.filter(report => {
      const matchesSearch = report.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            report.items?.some(i => i.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filter === 'all' ? true : report.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [reports, searchQuery, filter]);

  const handleCreateReport = async (data: any) => {
    try {
      await createReport.mutateAsync(data);
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Damage Reports
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Track and manage reported damages to property and inventory.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm">
              <Plus className="h-5 w-5 mr-2" />
              Report Damage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report New Damage</DialogTitle>
              <DialogDescription>
                Create a new damage report for a unit or inventory item.
              </DialogDescription>
            </DialogHeader>
            <DamageReportForm 
              onSubmit={handleCreateReport} 
              isSubmitting={createReport.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_review">In Review</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search reports..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : error ? (
         <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
               <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
               <h3 className="font-semibold text-lg text-destructive">Error loading reports</h3>
               <p className="text-muted-foreground">Please try refreshing the page or contact support.</p>
            </CardContent>
         </Card>
      ) : filteredReports.length === 0 ? (
         <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
               <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                 <AlertTriangle className="h-6 w-6 text-muted-foreground" />
               </div>
               <h3 className="font-semibold text-lg">No Damage Reports</h3>
               <p className="text-muted-foreground max-w-sm mt-2">
                 There are currently no damage reports matching your criteria. Use the "Report Damage" button to create one.
               </p>
            </CardContent>
         </Card>
      ) : (
         <div className="min-h-[400px]">
            <DamageReportList reports={filteredReports} />
         </div>
      )}
    </div>
  );
}
