"use client";

import * as React from 'react';
import { 
  CheckSquare,
  XCircle,
  Building2,
  MapPin,
  User,
  DollarSign,
  Calendar,
  Eye,
  Clock,
  AlertCircle,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getUserInitials } from "@/lib/utils/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Sample pending hostels - Replace with actual API call
const pendingHostels = [
  {
    id: "1",
    name: "Kilimani Suites",
    landlord: {
      name: "Michael Otieno",
      email: "michael.o@example.com",
      phone: "+254712345678",
      avatar: null,
    },
    location: "Kilimani, Nairobi",
    totalRooms: 30,
    priceRange: "KES 12,000 - 18,000",
    submittedDate: "2024-11-25",
    description: "Modern student accommodation with WiFi, 24/7 security, and fully furnished rooms",
    amenities: ["WiFi", "Security", "Parking", "Laundry", "Common Room"],
    images: ["/placeholder-hostel-1.jpg", "/placeholder-hostel-2.jpg"],
    verificationChecklist: [
      { item: "Location verified", status: "pending" },
      { item: "Amenities match", status: "pending" },
      { item: "Pricing reasonable", status: "pending" },
      { item: "Safety standards met", status: "pending" },
    ],
  },
  {
    id: "2",
    name: "Green Valley Residences",
    landlord: {
      name: "Jane Wanjiru",
      email: "jane.w@example.com",
      phone: "+254723456789",
      avatar: null,
    },
    location: "Kasarani, Nairobi",
    totalRooms: 42,
    priceRange: "KES 10,000 - 15,000",
    submittedDate: "2024-11-28",
    description: "Affordable student housing near universities with excellent transport links",
    amenities: ["WiFi", "Security", "Water", "Study Room"],
    images: ["/placeholder-hostel-3.jpg"],
    verificationChecklist: [
      { item: "Location verified", status: "pending" },
      { item: "Amenities match", status: "pending" },
      { item: "Pricing reasonable", status: "pending" },
      { item: "Safety standards met", status: "pending" },
    ],
  },
];

export default function Page() {
  const [approvalNotes, setApprovalNotes] = React.useState("");
  const [selectedHostel, setSelectedHostel] = React.useState<typeof pendingHostels[0] | null>(null);

  const handleApprove = (hostelId: string) => {
    console.log(`Approving hostel ${hostelId} with notes:`, approvalNotes);
    // API call to approve hostel
  };

  const handleReject = (hostelId: string) => {
    console.log(`Rejecting hostel ${hostelId} with notes:`, approvalNotes);
    // API call to reject hostel
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pending Hostel Approvals</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Review and approve new hostel listings</p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 text-base px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {pendingHostels.length} Pending
        </Badge>
      </div>

      {/* Pending Hostels List */}
      <div className="space-y-4">
        {pendingHostels.map((hostel) => (
          <Card key={hostel.id} className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">{hostel.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Submitted {hostel.submittedDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {hostel.location}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Landlord Info */}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Landlord</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={hostel.landlord.avatar || undefined} alt={hostel.landlord.name} />
                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-sm font-semibold">
                      {getUserInitials(hostel.landlord.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{hostel.landlord.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{hostel.landlord.email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Property Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Property Details</p>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {hostel.totalRooms} Total Rooms
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {hostel.priceRange}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {hostel.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Description</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{hostel.description}</p>
              </div>

              {/* Verification Checklist */}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Verification Checklist</p>
                <div className="space-y-2">
                  {hostel.verificationChecklist.map((check, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-slate-600 dark:text-slate-400">{check.item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex items-center justify-between gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{hostel.name}</DialogTitle>
                      <DialogDescription>Full hostel details and verification</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {hostel.images.map((img, idx) => (
                          <div key={idx} className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-slate-400" />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{hostel.description}</p>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Hostel</DialogTitle>
                        <DialogDescription>Provide a reason for rejection</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reject-notes">Rejection Reason</Label>
                          <Textarea
                            id="reject-notes"
                            placeholder="Explain why this hostel is being rejected..."
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" onClick={() => handleReject(hostel.id)}>
                          Reject Hostel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckSquare className="w-4 h-4" />
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Hostel</DialogTitle>
                        <DialogDescription>Confirm hostel approval</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="approve-notes">Approval Notes (Optional)</Label>
                          <Textarea
                            id="approve-notes"
                            placeholder="Add any notes about this approval..."
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(hostel.id)}>
                          Approve Hostel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingHostels.length === 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckSquare className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">All Caught Up!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">No pending hostel approvals at the moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
