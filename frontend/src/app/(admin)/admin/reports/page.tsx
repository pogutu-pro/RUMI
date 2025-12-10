"use client";

import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  MoreHorizontal,
  Calendar
} from "lucide-react";

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

// Mock Data
const REPORTS = [
  { id: "RPT-001", name: "Monthly Financial Summary", type: "Financial", date: "Feb 1, 2025", size: "2.4 MB" },
  { id: "RPT-002", name: "User Growth Report", type: "Analytics", date: "Feb 1, 2025", size: "1.1 MB" },
  { id: "RPT-003", name: "Hostel Occupancy Audit", type: "Operational", date: "Jan 28, 2025", size: "3.5 MB" },
  { id: "RPT-004", name: "Support Ticket Analysis", type: "Support", date: "Jan 25, 2025", size: "0.8 MB" },
  { id: "RPT-005", name: "Annual Revenue Report 2024", type: "Financial", date: "Jan 15, 2025", size: "12.6 MB" },
];

export default function Page() {
  return (
    <div className="space-y-8 p-8 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="mt-2 text-muted-foreground">Access and download system reports.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <FileText className="mr-2 h-4 w-4" />
            Generate New Report
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Generated Reports</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  className="pl-9 bg-background"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REPORTS.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded text-muted-foreground">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-foreground">{report.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted text-foreground">
                        {report.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{report.date}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{report.size}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
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
