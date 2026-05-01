'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardCheck, 
  ArrowRight, 
  MapPin, 
  Calendar,
  AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { InventoryReport } from '@/features/inventory';
import { inventoryApi } from '@/features/inventory';

export default function LandlordApprovalsPage() {
  const router = useRouter();
  const [reports, setReports] = React.useState<InventoryReport[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await inventoryApi.getPendingReports('landlord');
        setReports(data);
      } catch (err) {
        console.error('Failed to fetch landlord approvals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Approvals</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve Check-In/Check-Out reports verified by caretakers.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-lg">All Done!</h3>
            <p>No reports pending your approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push(`/landlord/approvals/${report.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={report.type === 'check_in' ? 'default' : 'destructive'} className="mb-2">
                    {report.type === 'check_in' ? 'Check-In' : 'Check-Out'}
                  </Badge>
                  {report.status === 'verified' && (
                     <Badge variant="secondary" className="bg-info/10 text-info">Verified</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">Room {report.roomNumber}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                   <MapPin className="h-3 w-3" /> Hostel A
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="text-sm space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                       <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</span>
                       <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    {report.items.some(i => i.isFlagged) && (
                       <div className="flex justify-between text-amber-600 font-medium">
                          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Issues</span>
                          <span>{report.items.filter(i => i.isFlagged).length} Flagged</span>
                       </div>
                    )}
                 </div>
                 <Button className="w-full">
                    Review Report <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
