"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  User,
  GraduationCap
} from "lucide-react";
import Link from "next/link";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock Data
const STUDENTS = Array.from({ length: 15 }).map((_, i) => ({
  id: `STU-${1000 + i}`,
  name: `Student ${i + 1}`,
  email: `student${i + 1}@university.edu`,
  university: "University of Nairobi",
  course: "Computer Science",
  year: `${(i % 4) + 1}st Year`,
  status: ["active", "suspended", "pending"][i % 3],
  joined: new Date(2024, 0, 1 + i).toLocaleDateString(),
}));

export default function Page() {
  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="mt-2 text-slate-500">Manage student accounts and verifications.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Add Student</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">All Students</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search students..."
                  className="pl-9 bg-white"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Student</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STUDENTS.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm">{student.university}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-900">{student.course}</span>
                        <span className="text-xs text-slate-500">{student.year}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          student.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" :
                          student.status === "suspended" ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" :
                          "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                        }
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{student.joined}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/students/${student.id}`}>
                              View profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Verify student ID</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Suspend account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
