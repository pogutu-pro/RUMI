"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2, Save, X } from "lucide-react";

import { useHostel, updateBed } from "@/features/hostels";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { Bed, Room } from "@/features/hostels/types";

interface BedManagementTableProps {
  hostelId: string;
}

export function BedManagementTable({ hostelId }: BedManagementTableProps) {
  const { data: hostel, isLoading } = useHostel(hostelId, { includeRooms: true });
  const queryClient = useQueryClient();
  
  // Flatten beds from rooms
  const allBeds = useMemo(() => {
    if (!hostel?.rooms) return [];
    
    const beds: (Bed & { roomNumber: string })[] = [];
    hostel.rooms.forEach((room) => {
      if (room.beds) {
        room.beds.forEach((bed) => {
          beds.push({
            ...bed,
            roomNumber: room.room_number,
          });
        });
      }
    });
    return beds.sort((a, b) => a.full_code.localeCompare(b.full_code));
  }, [hostel]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const updateBedMutation = useMutation({
    mutationFn: async ({ bedId, accountNumber }: { bedId: string, accountNumber: string | null }) => {
      return updateBed(bedId, { custom_account_number: accountNumber });
    },
    onSuccess: () => {
      toast.success("Account number updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.hostel(hostelId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.custom_account_number?.[0] || "Failed to update");
    }
  });

  const handleEdit = (bed: Bed) => {
    setEditingId(bed.id);
    setEditValue(bed.custom_account_number || "");
  };

  const handleSave = (bedId: string) => {
    // If empty string, treat as null to clear
    const val = editValue.trim() === "" ? null : editValue.trim();
    updateBedMutation.mutate({ bedId, accountNumber: val });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  // Auto-generate helper
  const handleAutoGenerate = () => {
    // Basic logic: ROOM-{roomNumber}-{BedIndex}
    // We need to group by room to determine index?
    // Actually simplicity is better: ROOM-{roomNumber}-{bedChar}
    // Let's iterate and find beds without numbers
    
    // This is a client-side simulation of "Auto-Fill" for the user to then save
    // But since we have a mutation per bed, maybe we just want to highlight them?
    // Or we provide a button that iterates and calls mutation for each?
    // Let's do the latter for "Auto-Fill All Missing"

    const missingBeds = allBeds.filter(b => !b.custom_account_number);
    let delay = 0;
    
    toast.promise(
      (async () => {
        for (const bed of missingBeds) {
          // Generate: ROOM-{roomNumber}-{BedTypeChar}
          // e.g. ROOM-101-U (Upper), L (Lower), S (Single)
          // Ensure unique suffix if multiple same type in room? 
          // Let's use bed.full_code logic if possible, or just a simple reliable format.
          // Format: ROOM-{roomNumber}-{bed.full_code.split('-').pop()}
          // bed.full_code is likely "HOSTEL-ROOM-BED"
          
          const suffix = bed.full_code.split('-').pop() || 'A';
          const autoVal = `ROOM-${bed.roomNumber}-${suffix}`;
          
          await new Promise(r => setTimeout(r, delay)); 
          await updateBedMutation.mutateAsync({ bedId: bed.id, accountNumber: autoVal });
          delay += 100; // Stagger requests slightly
        }
      })(),
      {
        loading: 'Auto-generating account numbers...',
        success: 'All missing account numbers generated!',
        error: 'Failed to generate some numbers'
      }
    );
  };

  const missingCount = allBeds.filter(b => !b.custom_account_number).length;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="border-b bg-muted/40 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">Bed Account Management</CardTitle>
            <CardDescription className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Assign unique Paybill account numbers per bed
            </CardDescription>
          </div>
          {missingCount > 0 && (
            <Button 
              size="sm"
              variant="outline" 
              onClick={handleAutoGenerate}
              className="gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                 <span className="flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                Auto-Fill {missingCount} Missing
              </div>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground h-11">Bed Code</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground h-11">Room</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground h-11">Type</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground h-11">Status</TableHead>
                <TableHead className="w-[350px] font-mono text-xs uppercase tracking-wider text-muted-foreground h-11">M-Pesa Account Number</TableHead>
                <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground h-11">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                    No beds found in this hostel.
                  </TableCell>
                </TableRow>
              ) : (
                allBeds.map((bed) => (
                  <TableRow key={bed.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-mono font-medium text-xs">{bed.full_code}</TableCell>
                    <TableCell className="text-sm">{bed.roomNumber}</TableCell>
                    <TableCell className="capitalize text-sm text-muted-foreground">{bed.bed_type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={bed.is_active 
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" 
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border-zinc-200"}
                      >
                        {bed.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === bed.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="e.g. ROOM1-A"
                            className="h-8 font-mono text-xs bg-background"
                            autoFocus
                          />
                        </div>
                      ) : (
                         <div className="flex items-center gap-2">
                          {bed.custom_account_number ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono text-xs font-medium">
                              {bed.custom_account_number}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-600 text-xs font-medium px-2 py-0.5 rounded bg-amber-50/50">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Required
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === bed.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={handleCancel}
                            disabled={updateBedMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-7 w-7 bg-black text-white hover:bg-zinc-800"
                            onClick={() => handleSave(bed.id)}
                            disabled={updateBedMutation.isPending}
                          >
                            {updateBedMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-medium text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => handleEdit(bed)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
