"use client";

import { useParams } from "next/navigation";
import { useHostel } from "@/features/hostels";
import HostelForm from "@/features/hostels/components/hostel-form";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditHostelPage() {
  const params = useParams<{ id: string }>();
  const hostelId = params?.id ?? "";
  
  const { data: hostel, isLoading, error } = useHostel(hostelId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-destructive mb-4">
          <AlertCircle className="h-6 w-6" />
          <h1 className="text-xl font-bold">Failed to load hostel data.</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/landlord/hostels/${hostelId}`}>Back to Hostel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="rounded-xl h-12 w-12" asChild>
          <Link href={`/landlord/hostels/${hostelId}`}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Edit Property</h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Update the details for <span className="text-foreground font-bold">{hostel.name}</span>
          </p>
        </div>
      </div>
      
      <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
        <HostelForm initialData={hostel} />
      </div>
    </div>
  );
}
