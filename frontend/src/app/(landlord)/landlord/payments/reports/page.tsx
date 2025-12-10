"use client";

import * as React from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const reports = [
    { name: 'Monthly Financial Summary', type: 'financial', date: 'Dec 1, 2024', size: '2.4 MB' },
    { name: 'Tenant Occupancy Report', type: 'occupancy', date: 'Dec 1, 2024', size: '1.1 MB' },
    { name: 'Maintenance Expense Log', type: 'maintenance', date: 'Nov 30, 2024', size: '850 KB' },
    { name: 'Annual Tax Statement 2024', type: 'tax', date: 'Nov 15, 2024', size: '4.2 MB' },
    { name: 'Booking Conversions Analysis', type: 'analytics', date: 'Nov 1, 2024', size: '3.5 MB' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <PieChart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Download detailed reports for your records and analysis
          </p>
        </div>
        <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Select Date Range
        </Button>
      </div>

       <div className="grid gap-6">
           <Card className="border-none shadow-md">
               <CardHeader>
                   <CardTitle>Generated Reports</CardTitle>
                   <CardDescription>Recently generated reports available for download</CardDescription>
               </CardHeader>
               <CardContent>
                   <div className="space-y-4">
                       {reports.map((report, i) => (
                           <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors group">
                               <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                       <FileText className="h-5 w-5" />
                                   </div>
                                   <div>
                                       <p className="font-semibold text-slate-900 dark:text-slate-100">{report.name}</p>
                                       <div className="flex items-center gap-2 text-xs text-slate-500">
                                           <span>{report.date}</span>
                                           <span>•</span>
                                           <span>{report.size}</span>
                                           <span>•</span>
                                           <Badge variant="secondary" className="text-[10px] h-5 capitalize">{report.type}</Badge>
                                       </div>
                                   </div>
                               </div>
                               <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                   <Download className="h-4 w-4 mr-2" />
                                   Download
                               </Button>
                           </div>
                       ))}
                   </div>
               </CardContent>
           </Card>

           <Card className="border-none shadow-md bg-gradient-to-r from-slate-900 to-slate-800 text-white">
               <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div>
                       <h3 className="text-xl font-bold mb-2">Need a Custom Report?</h3>
                       <p className="text-slate-300">Request specific data analysis for your properties.</p>
                   </div>
                   <Button className="bg-white text-slate-900 hover:bg-slate-100">
                       Request Custom Report
                   </Button>
               </CardContent>
           </Card>
       </div>
    </div>
  );
}
