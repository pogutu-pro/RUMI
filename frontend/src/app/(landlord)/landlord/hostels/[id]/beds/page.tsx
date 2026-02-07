"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BedManagementTable } from "@/features/landlord/components/bed-management-table";

export default function HostelBedsPage() {
  const params = useParams<{ id: string }>();
  const hostelId = params?.id || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/landlord/hostels/${hostelId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Hostel
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Bed Management</h1>
        <p className="text-muted-foreground">
          View and manage all beds in this hostel.
        </p>
      </div>

      <BedManagementTable hostelId={hostelId} />
    </div>
  );
}
