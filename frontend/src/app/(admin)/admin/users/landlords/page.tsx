"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Home,
  MapPin,
  Phone
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
const LANDLORDS = Array.from({ length: 15 }).map((_, i) => ({
  id: `LL-${2000 + i}`,
  name: `Landlord ${i + 1}`,
  email: `landlord${i + 1}@example.com`,
  properties: 2 + (i % 5),
  location: "Nairobi, Kenya",
  phone: "+254 700 000 000",
  status: ["active", "suspended", "pending"][i % 3],
  joined: new Date(2023, 5, 1 + i).toLocaleDateString(),
}));

export default function Page() {
  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Landlords</h1>
          <p className="mt-2 text-slate-500">Manage landlord accounts and property listings.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Add Landlord</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">All Landlords</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search landlords..."
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
                  <TableHead>Landlord</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LANDLORDS.map((landlord) => (
                  <TableRow key={landlord.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <Home className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{landlord.name}</div>
                          <div className="text-xs text-slate-500">{landlord.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {landlord.properties} Hostels
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{landlord.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{landlord.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          landlord.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" :
                          landlord.status === "suspended" ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" :
                          "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                        }
                      >
                        {landlord.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/landlords/${landlord.id}`}>
                              View profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>View properties</DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/users/landlords/verification">
                              Verify identity
                            </Link>
                          </DropdownMenuItem>
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
