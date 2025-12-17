'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useInventoryStore } from '@/features/inventory';
import { useMyInventoryReport, useSubmitInventoryReport } from '@/features/inventory/hooks/use-inventory-query';
import { useMyBooking } from '@/features/bookings/hooks/use-my-booking';
import { 
  CheckCircle2, 
  Utensils, 
  Bed, 
  Bath, 
  Sofa, 
  Package, 
  Save, 
  Send 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InventoryCategorySection } from '@/features/inventory';
import { InventoryItemRow } from '@/features/inventory';
import type { InventoryCategory } from '@/features/inventory';
import { toast } from 'sonner';

export default function CheckInPage() {
  const router = useRouter();
  const { data: currentBooking, isLoading: bookingLoading } = useMyBooking();
  
  // React Query for Server State
  const { data: serverReport, isLoading: reportLoading } = useMyInventoryReport(currentBooking?.id, 'check_in');
  const submitMutation = useSubmitInventoryReport();

  // Zustand for Client Draft State
  const { 
    activeReport, 
    setReport,
    updateItemConditionLocal 
  } = useInventoryStore();

  // Sync Server State to Client Draft
  React.useEffect(() => {
    if (serverReport) {
      setReport(serverReport);
    }
  }, [serverReport, setReport]);

  const isLoading = bookingLoading || reportLoading;

  const categoryIcons: Record<InventoryCategory, React.ElementType> = {
    kitchen: Utensils,
    bedroom: Bed,
    bathroom: Bath,
    living_area: Sofa,
    shared: Package,
  };

  const groupedItems = React.useMemo(() => {
    if (!activeReport?.items) return {};
    
    const groups: Partial<Record<InventoryCategory, typeof activeReport.items>> = {};
    
    activeReport.items.forEach(item => {
      const cat = item.itemSnapshot.category || 'shared';
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(item);
    });

    return groups;
  }, [activeReport?.items]);

  const categories = Object.keys(groupedItems) as InventoryCategory[];

  const progress = React.useMemo(() => {
    if (!activeReport?.items) return { total: 0, completed: 0, percent: 0 };
    const total = activeReport.items.length;
    // Assuming 'good' is the default and doesn't count as "user checked" unless we explicitly track interaction ?
    // Actually, usually user must verify EVERYTHING. 
    // For this prototype, let's say "completed" means user explicitly interacted?
    // Or for simplicity in UI, we just show total items.
    // Let's count items where studentCondition is set (it's always set to something, usually default 'working' from initial creation? 
    // Use Store logic: usually we might start with 'good' or 'unverified'. 
    // If backend initializes as 'good', it's pre-filled.
    return { total, completed: total, percent: 100 }; 
  }, [activeReport]);

  const handleSubmit = async () => {
    if (!activeReport) return;
    
    // Transform to payload
    const payload = {
      reportId: activeReport.id,
      items: activeReport.items.map(item => ({
        itemId: item.itemId,
        condition: item.studentCondition,
        comment: item.studentComment,
      })),
    };

    submitMutation.mutate(payload, {
        onSuccess: () => router.push('/student/dashboard')
    });
  };

  if (!currentBooking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">No Active Booking</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          You need an active room booking to perform an inventory check-in.
        </p>
        <Button className="mt-6" onClick={() => router.push('/student/bookings')}>
          View Bookings
        </Button>
      </div>
    );
  }

  if (isLoading || bookingLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (activeReport?.status !== 'draft' && activeReport?.status) {
    // If report exists but not draft (submitted/approved), show read-only view or redirect
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold">Check-In Submitted</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Your inventory report has been submitted for verification. You can view the status in your dashboard.
        </p>
        <div className="flex gap-4 mt-6">
          <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push(`/student/check-in/view/${activeReport.id}`)}>
            View Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Inventory Check-In</h1>
          <p className="text-muted-foreground mt-1">
            Please verify the condition of items in Room {currentBooking.room.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="gap-2">
             <Save className="h-4 w-4" />
             Save Draft
           </Button>
        </div>
      </div>

      <Alert className="bg-primary/5 text-primary border-primary/20">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Mark items as "Not Working" or "Damaged" if they are not in perfect condition. 
          Once submitted, you cannot edit this report.
        </AlertDescription>
      </Alert>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const catItems = groupedItems[category] || [];
          const Icon = categoryIcons[category] || Package;
          const completedCount = catItems.length; // Simplified for now

          return (
            <InventoryCategorySection
              key={category}
              title={category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              icon={Icon}
              count={catItems.length}
              completedCount={completedCount}
            >
              <div className="space-y-3">
                {catItems.map((item) => (
                  <InventoryItemRow
                    key={item.itemId}
                    item={item}
                    onConditionChange={(condition) => 
                      updateItemConditionLocal(item.itemId, condition)
                    }
                    onCommentChange={(comment) => 
                      updateItemConditionLocal(item.itemId, item.studentCondition, comment)
                    }
                  />
                ))}
              </div>
            </InventoryCategorySection>
          );
        })}
      </div>

      {/* Footer / Submit */}
      <Card className="sticky bottom-4 border-t-4 border-t-primary shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Ready to Submit?</h3>
            <p className="text-sm text-muted-foreground">
              By submitting, you confirm the accuracy of this condition report.
            </p>
          </div>
          <Button size="lg" onClick={handleSubmit} className="w-full md:w-auto gap-2">
            Submit Report <Send className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      
      {/* Spacer for sticky footer */}
      <div className="h-12" />
    </div>
  );
}
