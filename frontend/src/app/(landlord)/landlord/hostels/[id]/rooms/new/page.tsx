"use client";

import { useParams, useRouter } from "next/navigation";
import RoomForm from "@/features/hostels/components/room-form";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function NewRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hostelId = params?.id ?? "";
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-xl h-12 w-12" asChild>
            <Link href={`/landlord/hostels/${hostelId}/rooms`}>
              <ChevronLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Add New Room</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Create a new room configuration
            </p>
          </div>
        </div>
        <Button variant="ghost" className="font-bold" onClick={() => router.push(`/landlord/hostels/${hostelId}/rooms`)}>
          Done
        </Button>
      </div>
      
      <Card className="border shadow-sm rounded-3xl overflow-hidden bg-card">
        <CardContent className="p-6 md:p-8">
          <p className="text-muted-foreground mb-6 font-medium">
            Fill in the details below to add a new room type or specific room to your hostel. You can add multiple rooms back-to-back.
          </p>
          <RoomForm hostelId={hostelId} />
        </CardContent>
      </Card>
    </div>
  );
}
