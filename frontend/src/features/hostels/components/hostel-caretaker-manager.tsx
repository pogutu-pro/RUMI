"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  Shield,
  MoreVertical,
  Eye,
  Edit,
  Award,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Building2,
  XCircle,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCaretakers } from '@/features/landlord';

interface HostelCaretakerManagerProps {
  hostelId: string;
}

export function HostelCaretakerManager({ hostelId }: HostelCaretakerManagerProps) {
  const { data: caretakersData, isLoading } = useCaretakers();
  
  const caretakers = (caretakersData || []).map(c => ({
      ...c,
      rating: c.rating || 0,
      tasksCompleted: c.tasksCompleted || 0,
  }));

  // Filter caretakers strictly by the current hostel
  const assignedCaretakers = caretakers.filter((caretaker) => {
    return String(caretaker.hostelId) === hostelId;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'CT';
  };

  if (isLoading) {
    return (
        <div className="space-y-4 mt-4">
            <Skeleton className="h-32 w-full rounded-xl" />
        </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Header/Actions */}
      <div className="flex items-center justify-between">
          <div>
              <h3 className="text-lg font-semibold text-foreground">Assigned Caretakers</h3>
              <p className="text-sm text-muted-foreground">Manage the staff assigned to this property.</p>
          </div>
          <Link href="/landlord/caretakers/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Assign Caretaker
            </Button>
          </Link>
      </div>

      <div className="grid gap-4">
        {assignedCaretakers.length === 0 ? (
           <Card className="border-dashed shadow-none py-12">
              <CardContent className="flex flex-col items-center justify-center text-center p-0">
                  <div className="p-4 rounded-full bg-muted mb-4">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">No caretakers assigned</h3>
                  <p className="text-muted-foreground mb-4">You have not assigned any caretakers to this hostel yet.</p>
                  <Link href="/landlord/caretakers/new">
                        <Button variant="outline">Assign Caretaker</Button>
                  </Link>
              </CardContent>
          </Card>
        ) : (
            <AnimatePresence mode='popLayout'>
              {assignedCaretakers.map((caretaker, index) => (
                <motion.div
                  key={caretaker.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 bg-card">
                    <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                             {/* Left: Main Info */}
                            <div className="flex-1 p-6 flex items-start gap-4">
                                <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                    <AvatarImage src={undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                                        {getInitials(caretaker.firstName, caretaker.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Link href={`/landlord/caretakers/${caretaker.id}`} className="hover:underline">
                                          <h3 className="text-lg font-bold text-foreground">
                                            {caretaker.firstName} {caretaker.lastName}
                                          </h3>
                                      </Link>
                                       <Badge
                                        variant="outline"
                                        className={cn(
                                          'font-medium border-0 px-2 py-0.5',
                                          caretaker.isActive
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        )}
                                      >
                                        {caretaker.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                    
                                     <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-1.5">
                                            <Phone className="h-4 w-4 opacity-70" />
                                            <span>{caretaker.phone}</span>
                                          </div>
                                           <div className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4 opacity-70" />
                                            <span>{caretaker.email}</span>
                                          </div>
                                     </div>
                                </div>
                            </div>
                            
                             {/* Middle: Performance & Activity */}
                             <div className="border-t lg:border-t-0 lg:border-l border-border bg-muted/5 p-6 min-w-[250px] flex flex-col justify-center gap-3">
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <Award className="h-4 w-4 text-yellow-500" />
                                          Rating
                                      </span>
                                      <span className="text-base font-bold text-foreground">{caretaker.rating?.toFixed(1) || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                          Check-ins
                                      </span>
                                      <span className="text-base font-bold text-foreground">{caretaker.tasksCompleted || 0}</span>
                                  </div>
                             </div>

                             {/* Right: Actions */}
                            <div className="border-t lg:border-t-0 lg:border-l border-border p-4 lg:p-6 flex lg:flex-col items-center justify-center gap-2">
                                <div className="flex w-full gap-2">
                                    <Link href={`/landlord/caretakers/${caretaker.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full gap-2 h-10 border-input hover:bg-accent hover:text-accent-foreground">
                                            <Eye className="h-4 w-4" />
                                            <span className="hidden lg:inline">Details</span>
                                        </Button>
                                    </Link>
                                    
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-10 w-10">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          <DropdownMenuLabel>Manage Caretaker</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem asChild>
                                            <Link href={`/landlord/caretakers/${caretaker.id}/edit`} className="cursor-pointer">
                                              <Edit className="h-4 w-4 mr-2" />
                                              Edit Permissions
                                            </Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="text-red-600 dark:text-red-400 cursor-pointer">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Revoke Access
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
        )}
      </div>
    </div>
  );
}
