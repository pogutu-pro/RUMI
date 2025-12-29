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
  Building2,
  Mail,
  Phone,
  Calendar,
  AlertCircle
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
  CardFooter,
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
import { getLandlordApplications, verifyLandlord } from "@/features/admin";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LandlordApplication {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    avatar?: string;
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
  const [reviewNotes, setReviewNotes] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["landlord-applications"],
    queryFn: getLandlordApplications,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      verifyLandlord(id, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["landlord-applications"] });
      toast.success(
        variables.action === "approve"
          ? "Landlord approved successfully"
          : "Landlord application rejected"
      );
      setSelectedApplication(null);
      setIsConfirmOpen(false);
      setReviewNotes("");
    },
    onError: () => {
      toast.error("Failed to process verification");
    },
  });

  const handleVerify = () => {
    if (!selectedApplication || !confirmAction) return;
    verifyMutation.mutate({ id: selectedApplication.id, action: confirmAction });
  };

  const pendingApplications = applications.filter(
    (app: LandlordApplication) => app.status === "pending"
  );

  return (
    <div className="space-y-8 p-6 md:p-8 pt-6 min-h-[calc(100vh-4rem)] animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/users/landlords">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Verifications
            </h1>
            <p className="text-muted-foreground">
              Review and manage landlord identity verifications
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="w-fit px-4 py-1.5 text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50"
        >
          <Clock className="h-3.5 w-3.5 mr-2" />
          {pendingApplications.length} Pending Requests
        </Badge>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50 bg-card/50">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-1">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : pendingApplications.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-xl bg-card/30">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              There are no pending verifications at the moment. Great job keeping up!
            </p>
          </div>
        ) : (
          pendingApplications.map((application: LandlordApplication) => (
            <Card
              key={application.id}
              className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={application.user.avatar} />
                            <AvatarFallback>{application.user.first_name[0]}{application.user.last_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base font-semibold leading-none">
                            {application.user.first_name} {application.user.last_name}
                            </CardTitle>
                            <CardDescription className="mt-1.5 text-xs">
                            Applied {format(new Date(application.submittedAt), "MMM d, yyyy")}
                            </CardDescription>
                        </div>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-3">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary/70" />
                        <span className="truncate">{application.user.email}</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary/70" />
                        <span className="truncate">{application.user.phone_number}</span>
                    </div>
                    {application.businessName && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 text-primary/70" />
                            <span className="truncate font-medium text-foreground">{application.businessName}</span>
                        </div>
                    )}
                </div>
                
                <Separator className="bg-border/60" />

                <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Documents Submitted</span>
                    <Badge variant="outline" className="bg-background">
                         {[
                          application.idDocument,
                          application.businessLicense,
                          application.taxCertificate,
                        ].filter(Boolean).length} / 3
                    </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                  <Button className="w-full" onClick={() => setSelectedApplication(application)}>
                      Review Application
                  </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
                <div>
                     <DialogTitle className="text-2xl font-bold">Application Review</DialogTitle>
                    <DialogDescription className="mt-1.5">
                    Verify applicant details and documents before approval.
                    </DialogDescription>
                </div>
                 <Badge variant="outline" className="h-6 bg-amber-500/10 text-amber-600 border-amber-200">
                    {selectedApplication?.status.toUpperCase()}
                 </Badge>
            </div>
          </DialogHeader>

          {selectedApplication && (
             <ScrollArea className="flex-1 p-6">
                <div className="grid gap-6">
                 {/* Applicant Details */}
                 <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-border/50 shadow-none">
                        <CardHeader className="pb-3 bg-muted/30">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                Business & Contact Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid gap-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                                    <p className="font-medium mt-0.5">{selectedApplication.user.first_name} {selectedApplication.user.last_name}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Business Name</Label>
                                    <p className="font-medium mt-0.5">{selectedApplication.businessName || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                     <Label className="text-xs text-muted-foreground">Address</Label>
                                    <p className="font-medium mt-0.5">{selectedApplication.businessAddress || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Reg. Number</Label>
                                    <p className="font-medium mt-0.5">{selectedApplication.businessRegistrationNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-none">
                        <CardHeader className="pb-3 bg-muted/30">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Submitted Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                             {[
                                { label: "National ID / Passport", url: selectedApplication.idDocument },
                                { label: "Business License", url: selectedApplication.businessLicense },
                                { label: "Tax Compliance Cert.", url: selectedApplication.taxCertificate },
                              ].map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-md border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded flex items-center justify-center ${doc.url ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-none">{doc.label}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{doc.url ? 'Attached' : 'Not Provided'}</p>
                                        </div>
                                    </div>
                                    {doc.url && (
                                        <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                <Eye className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                              ))}
                        </CardContent>
                    </Card>
                 </div>
                 
                 <Separator />

                 <div className="space-y-3">
                    <Label>Review Notes</Label>
                    <Textarea 
                        placeholder="Add internal notes about this verification decision..." 
                        className="resize-none min-h-[100px]"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                    />
                 </div>
                </div>
             </ScrollArea>
          )}

          <DialogFooter className="p-6 pt-2 bg-muted/10 border-t border-border/50">
             <div className="flex w-full items-center justify-between gap-4">
                <Button variant="ghost" onClick={() => setSelectedApplication(null)}>Cancel Review</Button>
                <div className="flex gap-2">
                    <Button 
                        variant="destructive" 
                        onClick={() => { setConfirmAction('reject'); setIsConfirmOpen(true); }}
                        className="w-32"
                    >
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button 
                        className="w-32 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => { setConfirmAction('approve'); setIsConfirmOpen(true); }}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                </div>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       {/* Confirmation Dialog */}
       <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{confirmAction === 'approve' ? 'Approve' : 'Reject'} Application?</DialogTitle>
                <DialogDescription>
                    Are you sure you want to {confirmAction} this verification request? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                <Button 
                    variant={confirmAction === 'reject' ? 'destructive' : 'default'}
                    className={confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    onClick={handleVerify}
                    disabled={verifyMutation.isPending}
                >
                    {verifyMutation.isPending ? 'Processing...' : 'Confirm Decision'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
