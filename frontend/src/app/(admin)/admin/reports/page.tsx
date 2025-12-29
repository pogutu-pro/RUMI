"use client";

import { 
  FileText, 
  Download, 
  Table as TableIcon,
  BarChart,
  PieChart,
  Calendar,
  History,
  ShieldAlert
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useExportAnalytics } from "@/features/analytics";
import { cn } from "@/lib/utils/cn";
import { useAdminTaxReports, useAdminSystemActivity } from "@/features/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const REPORT_TYPES = [
  { id: 'financial', title: 'Financial Report', desc: 'Revenue, payouts, and commission summaries.', icon: BarChart, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'user_growth', title: 'User Growth', desc: 'New registrations, active users, and churn rate.', icon: PieChart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'bookings', title: 'Booking Activity', desc: 'Reservation trends, occupancy, and cancellations.', icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'audit', title: 'System Audit', desc: 'Admin actions, login logs, and system alerts.', icon: ShieldAlert, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
];

export default function ReportsPage() {
    const exportMutation = useExportAnalytics();
    
    // Fetch real reports
    const { data: taxReports, isLoading: isLoadingTax } = useAdminTaxReports();
    const { data: activityFeed, isLoading: isLoadingActivity } = useAdminSystemActivity();

    const handleExport = (type: string, format: 'csv' | 'pdf') => {
        exportMutation.mutate({ period: '30d', format });
    };

    const reportsList = taxReports?.results || taxReports?.data || [];
    const activities = activityFeed?.results || activityFeed?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Reports Center
          </h1>
          <p className="mt-1 text-muted-foreground">Generate, view, and download detailed system reports.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {REPORT_TYPES.map((report) => (
               <Card key={report.id} className="border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 group bg-card/60 backdrop-blur-md">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-xl transition-colors group-hover:bg-opacity-80", report.bg)}>
                                    <report.icon className={cn("w-6 h-6", report.color)} />
                                </div>
                            </div>
                        </div>
                        <CardTitle className="text-lg mt-4">{report.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{report.desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 pt-2">
                             <Button variant="outline" className="flex-1 gap-2 text-xs h-9 bg-background/50" onClick={() => handleExport(report.id, 'csv')}>
                                <TableIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                CSV
                             </Button>
                             <Button variant="outline" className="flex-1 gap-2 text-xs h-9 bg-background/50" onClick={() => handleExport(report.id, 'pdf')}>
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                PDF
                             </Button>
                        </div>
                    </CardContent>
               </Card>
          ))}
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="bg-background/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Generated Reports
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                System Activity Log
            </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
            <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Report History</CardTitle>
                    <CardDescription>Recently generated financial and tax reports.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingTax ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                        </div>
                    ) : reportsList.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                            <div className="p-4 bg-muted rounded-full mb-3">
                                <FileText className="h-6 w-6 opacity-50" />
                            </div>
                            <p>No reports generated yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reportsList.map((file: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg border border-border/50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-background rounded border border-border">
                                            <FileText className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{file.name || `Tax Report #${file.id}`}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {file.created_at ? format(new Date(file.created_at), 'PPP p') : 'Unknown Date'} • {file.size || 'PDF'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={file.url || '#'} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="activity">
             <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">System Activity</CardTitle>
                    <CardDescription>Recent actions performed across the admin platform.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ScrollArea className="h-[400px] pr-4">
                        {isLoadingActivity ? (
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activities.length === 0 ? (
                             <div className="text-center py-12 text-muted-foreground">
                                <p>No activity logs found.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {activities.map((log: any, i: number) => (
                                    <div key={i} className="flex gap-4 relative">
                                         {i !== activities.length - 1 && (
                                            <div className="absolute left-5 top-10 bottom-[-24px] w-px bg-border/50" />
                                        )}
                                        <Avatar className="h-10 w-10 border border-border/50">
                                            <AvatarImage src={log.actor?.profile_picture} />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {log.actor?.username?.[0] || 'S'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <p className="text-sm text-foreground">
                                                <span className="font-semibold">{log.actor?.username || 'System'}</span> {log.action_description || 'performed an action'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {log.created_at ? format(new Date(log.created_at), 'PPP p') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                   </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
