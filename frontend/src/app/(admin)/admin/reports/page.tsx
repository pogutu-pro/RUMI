"use client";

import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  BarChart,
  PieChart,
  Table as TableIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExportAnalytics } from "@/features/analytics";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

const REPORT_TYPES = [
  { id: 'financial', title: 'Financial Report', desc: 'Revenue, payouts, and commission summaries.', icon: BarChart, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'user_growth', title: 'User Growth', desc: 'New registrations, active users, and churn rate.', icon: PieChart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'bookings', title: 'Booking Activity', desc: 'Reservation trends, occupancy, and cancellations.', icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'audit', title: 'System Audit', desc: 'Admin actions, login logs, and system alerts.', icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
];

export default function Page() {
    const exportMutation = useExportAnalytics();

    const handleExport = (type: string, format: 'csv' | 'pdf') => {
        // Mapping type to period or category for the API
        exportMutation.mutate({ period: '30d', format });
    };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-muted-foreground">Generate and download detailed system reports.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
          {REPORT_TYPES.map((report) => (
               <Card key={report.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-xl", report.bg)}>
                                    <report.icon className={cn("w-6 h-6", report.color)} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{report.title}</CardTitle>
                                    <CardDescription className="mt-1">{report.desc}</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3 mt-2">
                             <Button variant="outline" className="flex-1 gap-2" onClick={() => handleExport(report.id, 'csv')}>
                                <TableIcon className="w-4 h-4 text-muted-foreground" />
                                CSV
                             </Button>
                             <Button variant="outline" className="flex-1 gap-2" onClick={() => handleExport(report.id, 'pdf')}>
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                PDF
                             </Button>
                        </div>
                    </CardContent>
               </Card>
          ))}
      </div>

      <Card className="border-border/50 shadow-sm mt-8">
          <CardHeader>
               <CardTitle className="text-lg font-semibold">Generated Reports History</CardTitle>
               <CardDescription>Recent exports created by administrators.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {[
                      { name: 'Financial_Report_Nov_2023.pdf', date: '2 hours ago', type: 'PDF', size: '2.4 MB' },
                      { name: 'User_Growth_Q3_2023.csv', date: 'Yesterday', type: 'CSV', size: '450 KB' },
                      { name: 'Bookings_Summary_2023.pdf', date: '3 days ago', type: 'PDF', size: '1.8 MB' },
                  ].map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                          <div className="flex items-center gap-4">
                              <div className="p-2 bg-background rounded border border-border">
                                  {file.type === 'PDF' ? <FileText className="w-5 h-5 text-red-500" /> : <TableIcon className="w-5 h-5 text-green-600" />}
                              </div>
                              <div>
                                  <p className="font-medium text-foreground">{file.name}</p>
                                  <p className="text-sm text-muted-foreground">{file.date} • {file.size}</p>
                              </div>
                          </div>
                          <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4 text-muted-foreground" />
                          </Button>
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
