'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentStore } from '@/features/student';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface CompareViewProps {
  baseHostelPath?: string; // e.g. '/student/hostels' or '/hostels'
  backPath?: string; // e.g. '/student/hostels'
}

export function CompareView({ 
  baseHostelPath = '/hostels', 
  backPath 
}: CompareViewProps) {
  const router = useRouter();
  const { compareList, removeFromCompare } = useStudentStore();

  const handleBack = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  if (compareList.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold mb-2">No hostels to compare</h2>
        <p className="text-muted-foreground mb-6">Select up to 3 hostels to compare them side by side.</p>
        <Button onClick={handleBack}>
          Browse Hostels
        </Button>
      </div>
    );
  }

  // Attributes definition for structured comparison
  const attributes = [
    { label: 'Price per month', key: 'price', format: (val: any) => `KSh ${val?.toLocaleString()}` },
    // { label: 'Deposit', key: 'deposit', format: (val: any) => val ? `KSh ${val.toLocaleString()}` : 'N/A' }, // Deposit not always in basic model, stubbing for now
    { label: 'Distance', key: 'distance', format: (val: any) => val ? `${val} km` : 'N/A' },
    { label: 'Rating', key: 'rating', format: (val: any) => val ? val.toFixed(1) : 'N/A' },
    { label: 'Rooms Left', key: 'rooms', format: (val: any) => val > 0 ? `${val} available` : 'Fully booked' },
    { label: 'Type', key: 'type', format: (val: string) => val?.replace('_', ' ') || 'N/A' },
    { label: 'Verified', key: 'verified', format: (val: boolean) => val ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <Minus className="h-5 w-5 text-muted-foreground mx-auto" /> },
  ];

  const getAttributeValue = (hostel: any, key: string) => {
    switch (key) {
      case 'price': return Number(hostel.base_price || 0);
      case 'distance': return hostel.distance_from_university ? parseFloat(hostel.distance_from_university) : 0;
      case 'rating': return hostel.rating ? parseFloat(hostel.rating) : 0;
      case 'rooms': return hostel.available_rooms ?? 0;
      case 'type': return hostel.hostel_type;
      case 'verified': return hostel.is_verified;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3 max-w-6xl mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Compare Hostels</h1>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-max px-4 mx-auto max-w-6xl">
            <div className="grid gap-4 grid-flow-col auto-cols-[minmax(140px,1fr)] sm:auto-cols-[minmax(250px,1fr)]">
            
            {/* First Column: Labels (Sticky) */}
            <div className="sticky left-0 z-20 bg-background shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] rounded-xl border border-border p-0 sm:p-0 flex flex-col w-[120px] sm:w-auto">
               <div className="h-[200px] sm:h-[280px] bg-muted/30 rounded-t-xl border-b border-border flex items-end p-3 sm:p-4">
                  <span className="font-semibold text-sm sm:text-base text-muted-foreground">Attributes</span>
               </div>
               <div className="flex-1 bg-card rounded-b-xl">
              {attributes.map((attr) => (
                <div key={attr.key} className="h-14 sm:h-16 flex items-center font-medium text-xs sm:text-sm text-muted-foreground border-b border-border last:border-0 px-3 sm:px-4">
                  {attr.label}
                </div>
              ))}
              <div className="h-14 sm:h-16 flex items-center font-medium text-xs sm:text-sm text-muted-foreground px-3 sm:px-4 italic">Amenities</div>
            </div>
          </div>

            {/* Hostel Columns */}
            {compareList.map((hostel) => (
              <div key={hostel.id} className="relative flex flex-col">
                <div className="absolute top-2 right-2 z-10">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 bg-background/50 hover:bg-background rounded-full"
                    onClick={() => removeFromCompare(hostel.id)}
                   >
                     <X className="h-3 w-3" />
                   </Button>
                </div>

                {/* Card Header & Image */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-4 h-[200px] sm:h-[280px] flex flex-col">
                  <div className="relative h-28 sm:h-44 w-full bg-muted shrink-0">
                     <Image 
                       src={hostel.images?.[0] || '/images/placeholder.jpg'} 
                       alt={hostel.name} 
                       fill 
                       className="object-cover"
                     />
                     {getAttributeValue(hostel, 'rooms') === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Badge variant="destructive">Fully Booked</Badge>
                        </div>
                     )}
                  </div>
                  <div className="p-2 sm:p-4 flex flex-col justify-between flex-1">
                    <div>
                        <h3 className="font-semibold text-xs sm:text-lg truncate text-foreground">{hostel.name}</h3>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{hostel.city}</p>
                    </div>
                    <div className="mt-2 text-center">
                        <Button size="sm" className="w-full text-xs h-7 sm:h-9" onClick={() => router.push(`${baseHostelPath}/${hostel.slug || hostel.id}`)}>
                            View
                        </Button>
                    </div>
                  </div>
                </div>

                {/* Attribute Values */}
                <div className="flex-1 bg-card rounded-xl shadow-sm border border-border">
                   {attributes.map((attr) => (
                    <div key={attr.key} className="h-14 sm:h-16 flex items-center justify-center text-xs sm:text-sm border-b border-border last:border-0 text-center text-foreground px-1">
                       {attr.format(getAttributeValue(hostel, attr.key))}
                    </div>
                  ))}
                  
                  {/* Amenities List */}
                  <div className="h-14 sm:h-16 flex items-center justify-center border-t border-border">
                     <div className="flex flex-wrap gap-1 justify-center px-1 max-h-full overflow-hidden items-center">
                        {(hostel.amenities_list || (Array.isArray(hostel.amenities) ? hostel.amenities : []))?.slice(0, 2).map((amenity: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                {amenity}
                            </Badge>
                        ))}
                         {((hostel.amenities_list || (Array.isArray(hostel.amenities) ? hostel.amenities : [])).length > 2) && (
                            <span className="text-[10px] text-muted-foreground">
                                +{(hostel.amenities_list || (Array.isArray(hostel.amenities) ? hostel.amenities : [])).length - 2}
                            </span>
                         )}
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
