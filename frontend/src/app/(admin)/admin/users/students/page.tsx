"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Plus,
  GraduationCap,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  School,
  Ban
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminStudents } from "@/features/admin";
import { useUpdateUserStatus } from "@/features/users";
import { AddUserModal } from "@/features/admin";
import { Pagination } from "@/components/ui/pagination"; // Assuming generic pagination or will use simple buttons

export default function StudentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: studentsResponse, isLoading } = useAdminStudents({ 
    search: searchTerm,
    // Add pagination params if needed
  });

  const updateUserStatus = useUpdateUserStatus();
  const students = studentsResponse?.data || [];

  const handleSuspendUser = (user: any) => {
      const newStatus = user.status === "suspended" ? "active" : "suspended";
      updateUserStatus.mutate({ id: user.id, status: newStatus });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Students
          </h1>
          <p className="mt-1 text-muted-foreground">Manage and monitor student accounts.</p>
        </div>
        <div className="flex gap-2">
           <AddUserModal defaultRole="student" />
        </div>
      </div>

      <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Student Directory</CardTitle>
              <CardDescription>Browse all registered students</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search students..."
                    className="pl-9 bg-background border-border/60 focus:border-primary/50 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No students found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {students.map((student: any) => (
                        <Card key={student.id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30 overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                     <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                        <AvatarImage src={student.profile_picture || student.avatar} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xl">
                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${student.id}`)}>
                                                View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleSuspendUser(student)} className={student.status === 'active' ? "text-destructive focus:text-destructive" : "text-emerald-600 focus:text-emerald-600"}>
                                                {student.status === 'active' ? (
                                                    <><Ban className="mr-2 h-4 w-4" /> Suspend User</>
                                                ) : (
                                                    <><Plus className="mr-2 h-4 w-4" /> Activate User</>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                        {student.first_name} {student.last_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="h-5 px-1.5 text-[10px] pointer-events-none capitalize">
                                            {student.status}
                                        </Badge>
                                        {student.university && (
                                             <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm truncate max-w-[100px]">
                                                {student.university}
                                             </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5 opacity-70" />
                                        <span className="truncate">{student.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5 opacity-70" />
                                        <span>{student.phone_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                                        <span>Joined {student.created_at ? format(new Date(student.created_at), 'MMM yyyy') : '-'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
