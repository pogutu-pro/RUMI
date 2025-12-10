"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft,
  CheckCircle, 
  XCircle,
  FileText,
  Download,
  Eye,
  Clock,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getLandlordApplications, verifyLandlord } from "@/lib/api/admin";

interface LandlordApplication {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  businessName?: string;
  businessRegistrationNumber?: string;
  businessAddress?: string;
  idDocument?: string;
  businessLicense?: string;
  taxCertificate?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export default function LandlordVerificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<LandlordApplication | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["landlord-applications"],
    queryFn: getLandlordApplications,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      verifyLandlord(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-applications"] });
      toast.success(
        action === "approve"
          ? "Landlord approved successfully"
          : "Landlord application rejected"
      );
      setSelectedApplication(null);
      setAction(null);
      setReviewNotes("");
    },
    onError: () => {
      toast.error("Failed to process verification");
    },
  });

  const handleVerify = () => {
    if (!selectedApplication || !action) return;
    verifyMutation.mutate({ id: selectedApplication.id, action });
  };

  const pendingApplications = applications.filter(
    (app: LandlordApplication) => app.status === "pending"
  );

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users/landlords">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Landlord Verifications
            </h1>
            <p className="mt-2 text-slate-500">
              Review and approve landlord applications
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-amber-700 border-amber-300 bg-amber-50"
        >
          <Clock className="h-3 w-3 mr-1" />
          {pendingApplications.length} Pending
        </Badge>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : pendingApplications.length === 0 ? (
          <Card className="col-span-full border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-slate-500 max-w-sm">
                There are no pending landlord verification applications at the
                moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingApplications.map((application: LandlordApplication) => (
            <Card
              key={application.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-none"
              onClick={() => setSelectedApplication(application)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {application.user.firstName} {application.user.lastName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {application.businessName || "No business name"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 shrink-0">
                    {application.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{application.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4" />
                  <span>{application.user.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Documents</span>
                  <span className="font-medium text-slate-900">
                    {[
                      application.idDocument,
                      application.businessLicense,
                      application.taxCertificate,
                    ].filter(Boolean).length}{" "}
                    uploaded
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Landlord Verification</DialogTitle>
            <DialogDescription>
              Review the following information and documents carefully before
              approving
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Personal & Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-slate-500">Full Name</Label>
                    <p className="font-medium mt-1">
                      {selectedApplication.user.firstName}{" "}
                      {selectedApplication.user.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Email</Label>
                    <p className="font-medium mt-1">
                      {selectedApplication.user.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Phone</Label>
                    <p className="font-medium mt-1">
                      {selectedApplication.user.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Business Name</Label>
                    <p className="font-medium mt-1">
                      {selectedApplication.businessName || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Registration Number</Label>
                    <p className="font-medium mt-1">
                      {selectedApplication.businessRegistrationNumber || "—"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-slate-500">Business Address</Label>
                    <p className="font-medium mt-1">
                      {selectedApplication.businessAddress || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Uploaded Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      label: "ID Document",
                      url: selectedApplication.idDocument,
                    },
                    {
                      label: "Business License",
                      url: selectedApplication.businessLicense,
                    },
                    {
                      label: "Tax Certificate",
                      url: selectedApplication.taxCertificate,
                    },
                  ].map((doc) => (
                    <div
                      key={doc.label}
                      className="flex items-center justify-between p-3 rounded-lg border bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border">
                          <FileText className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.label}</p>
                          <p className="text-xs text-slate-500">
                            {doc.url ? "Uploaded" : "Not uploaded"}
                          </p>
                        </div>
                      </div>
                      {doc.url && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={doc.url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Review Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Review Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this verification..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedApplication(null)}
              disabled={verifyMutation.isPending}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setAction("reject");
                  handleVerify();
                }}
                disabled={verifyMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setAction("approve");
                  handleVerify();
                }}
                disabled={verifyMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
