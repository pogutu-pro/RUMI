'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useInventoryStore } from '@/features/inventory';
import { 
  CheckCircle2, 
  Utensils, 
  Bed, 
  Bath, 
  Sofa, 
  Package, 
  Save, 
  Send,
  ArrowLeft,
  User,
  Calendar
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { InventoryCategorySection } from '@/features/inventory';
import { ComparisonView } from '@/features/inventory';
import type { InventoryCategory } from '@/features/inventory';
import { toast } from 'sonner';

import { use } from 'react';

interface PageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default function VerificationPage({ params }: PageProps) {
  const { reportId } = use(params);
  const router = useRouter();
  const { 
    activeReport, 
    isLoading, 
    error, 
    fetchReportById, 
    verifyItemLocal, 
    submitVerification 
  } = useInventoryStore();

  const [generalNote, setGeneralNote] = React.useState('');

  React.useEffect(() => {
    if (reportId) {
      fetchReportById(reportId);
    }
  }, [reportId, fetchReportById]);

  // Group items logic (reused from student view mostly)
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
  
  const categoryIcons: Record<InventoryCategory, React.ElementType> = {
    kitchen: Utensils,
    bedroom: Bed,
    bathroom: Bath,
    living_area: Sofa,
    shared: Package,
  };

  const handleSubmit = async () => {
    await submitVerification(generalNote);
    router.push('/caretaker/inventory');
  };

  if (isLoading) {
    return (
       <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!activeReport) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Report not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Verify {activeReport.type === 'check_in' ? 'Check-In' : 'Check-Out'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
               <User className="h-4 w-4" /> Student ID: {activeReport.studentId}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
               <Package className="h-4 w-4" /> Room {activeReport.roomNumber}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
               <Calendar className="h-4 w-4" /> {new Date(activeReport.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="ml-auto">
             <Badge variant={
                 activeReport.status === 'submitted' ? 'secondary' : 
                 activeReport.status === 'verified' ? 'default' : 'outline'
             }>
                 {activeReport.status.toUpperCase()}
             </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content (Items) */}
        <div className="lg:col-span-2 space-y-6">
          {categories.map((category) => {
            const catItems = groupedItems[category] || [];
            const Icon = categoryIcons[category] || Package;
            const completedCount = catItems.filter(i => i.caretakerCondition).length;

            return (
              <InventoryCategorySection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                icon={Icon}
                count={catItems.length}
                completedCount={completedCount}
                defaultOpen={true}
              >
                <div className="space-y-4">
                  {catItems.map((item) => (
                    <ComparisonView
                      key={item.itemId}
                      item={item}
                      onVerify={(condition, isFlagged, comment, isChargeable, damageCost) => 
                        verifyItemLocal(item.itemId, condition, isFlagged, comment, isChargeable, damageCost)
                      }
                    />
                  ))}
                </div>
              </InventoryCategorySection>
            );
          })}
        </div>

        {/* Sidebar (Summary & Actions) */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Verification Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                     <span className="text-muted-foreground">Total Items</span>
                     <span className="font-medium">{activeReport.items.length}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-muted-foreground">Flagged Issues</span>
                     <span className="font-bold text-amber-600">
                         {activeReport.items.filter(i => i.isFlagged).length}
                     </span>
                 </div>
                 {activeReport.type === 'check_out' && (
                     <div className="flex justify-between pt-2 border-t mt-2">
                         <span className="font-semibold">Total Damage Cost</span>
                         <span className="font-bold text-destructive">
                             KES {activeReport.items.reduce((acc, curr) => acc + (curr.damageCost || 0), 0).toLocaleString()}
                         </span>
                     </div>
                 )}
              </div>

              <div className="space-y-2">
                  <label className="text-sm font-medium">General Notes</label>
                  <Textarea 
                      placeholder="Any final remarks for the landlord..."
                      value={generalNote}
                      onChange={(e) => setGeneralNote(e.target.value)}
                      className="resize-none h-24"
                  />
              </div>

              <Button className="w-full gap-2" size="lg" onClick={handleSubmit}>
                 Complete Verification <CheckCircle2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
