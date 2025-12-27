"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users,
  Search,
  CheckCircle2,
  XCircle,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserTable } from "@/features/admin";
import { useUsers, useUpdateUserStatus, useLandlordVerifications, useVerifyLandlord } from "@/features/users";
import { User } from '@/features/users';
import { toast } from "sonner";
import { format } from "date-fns";

export default function Page() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch Landlords
  const { data: landlords, isLoading: isLoadingLandlords } = useUsers({ 
    role: 'landlord',
    search: searchTerm 
  });

  // Fetch Verifications
  const { data: verifications, isLoading: isLoadingVerifications } = useLandlordVerifications();
  const verifyLandlordMutation = useVerifyLandlord();
  const updateUserStatus = useUpdateUserStatus();

  const handleVerify = (id: string, action: 'approve' | 'reject') => {
    verifyLandlordMutation.mutate({ id, action }, {
        onSuccess: () => {
            toast.success(`Landlord verification ${action}ed successfully`);
        },
        onError: () => {
            toast.error(`Failed to ${action} verification`);
        }
    });
  };

  const handleViewDetails = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleSuspendUser = (user: User) => {
      const newStatus = user.status === "suspended" ? "active" : "suspended";
      updateUserStatus.mutate({ id: user.id, status: newStatus });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Landlord Management</h1>
          <p className="mt-1 text-muted-foreground">Oversee landlord accounts and handle verification requests.</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1">
          <TabsTrigger value="list">All Landlords</TabsTrigger>
          <TabsTrigger value="verifications" className="relative">
            Verifications
            {verifications?.results?.length > 0 && (
                <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {verifications.results.length}
                </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Registered Landlords</CardTitle>
                      <CardDescription>Browse and manage all landlord accounts</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search landlords..."
                          className="pl-9 bg-background"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <UserTable 
                        users={landlords || []} 
                        isLoading={isLoadingLandlords} 
                        onViewDetails={handleViewDetails}
                        onSuspendUser={handleSuspendUser}
                    />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="verifications">
             <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Pending Verifications</CardTitle>
                    <CardDescription>Review and approve landlord identity documents</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingVerifications ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">Loading verifications...</div>
                    ) : verifications?.results?.length === 0 ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">No pending verifications</div>
                    ) : (
                        <div className="rounded-md border border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Landlord</TableHead>
                                        <TableHead>Document Type</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {verifications?.results?.map((req: any) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">
                                                {req.landlord_name || 'Unknown Landlord'}
                                                <div className="text-xs text-muted-foreground">{req.landlord_email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{req.document_type || 'ID Card'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {req.created_at ? format(new Date(req.created_at), "MMM d, yyyy") : '-'}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                 <Button size="sm" variant="outline" onClick={() => window.open(req.document_url, '_blank')}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Doc
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleVerify(req.landlord_id, 'approve')}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleVerify(req.landlord_id, 'reject')}>
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Reject
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
