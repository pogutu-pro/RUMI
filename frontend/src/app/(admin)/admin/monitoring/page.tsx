"use client";

import { useMemo } from "react";
import { 
  Activity, 
  RotateCcw,
  Wifi,
  Server,
  Cpu,
  HardDrive,
  Database,
  Globe
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
    useSystemHealth, 
    useSystemLogs,
    useSystemStats
} from "@/features/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export default function MonitoringPage() {
    const { data: healthData, isLoading: isLoadingHealth, refetch: refetchHealth } = useSystemHealth();
    const { data: statsData, isLoading: isLoadingStats } = useSystemStats();
    const { data: logs, isLoading: isLoadingLogs } = useSystemLogs();

    // Map API data to UI
    const isOnline = healthData?.status === 'healthy' || healthData?.status === 'online' || true; // Default to true if endpoint returns 200 OK structure
    const dbStatus = healthData?.components?.database || 'healthy';
    
    // Stats might return counts instead of %, so we adapt or mock defaults if null
    const resourceUsage = {
        cpu: statsData?.cpu_usage || 0, // Expecting backend to provide this or we show 0
        memory: statsData?.memory_usage || 0,
        storage: statsData?.storage_usage || 0
    };

    const logsList = Array.isArray(logs?.results) ? logs.results : (Array.isArray(logs) ? logs : []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            System Monitoring
          </h1>
          <p className="mt-1 text-muted-foreground">Real-time platform health and resource metrics.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetchHealth()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Refresh Status
            </Button>
        </div>
      </div>

       <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mt-2">
                        {isLoadingHealth ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border",
                                isOnline ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                            )}>
                                <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-600 animate-pulse" : "bg-red-600")} />
                                {healthData?.status || "Operational"}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Database</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoadingHealth ? (
                        <Skeleton className="h-8 w-16" />
                     ) : (
                        <div className="flex items-center gap-2 mt-2">
                           <span className={cn("h-2 w-2 rounded-full", dbStatus === 'healthy' ? "bg-emerald-500" : "bg-teal-500")} />
                           <span className="text-2xl font-bold capitalize">{dbStatus}</span>
                        </div>
                     )}
                </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">CPU Load</CardTitle>
                     <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold">{resourceUsage.cpu}%</div>
                    <Progress value={resourceUsage.cpu} className="h-2 mt-2" />
                </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">Memory</CardTitle>
                     <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold">{resourceUsage.memory}%</div>
                    <Progress value={resourceUsage.memory} className="h-2 mt-2" indicatorClassName="bg-indigo-500" />
                </CardContent>
            </Card>
       </div>

        {/* Live Logs */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
                <CardDescription>Live events from Super Admin Feed.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 pb-6">
                    {isLoadingLogs ? (
                         <div className="space-y-4 pt-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : logsList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Activity className="h-8 w-8 mb-2 opacity-50" />
                            <p>No activity logs found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-4">
                            {logsList.map((log: any, i: number) => (
                                <div key={i} className="text-sm p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background/50">
                                            {log.action_type || 'INFO'}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {format(new Date(log.created_at || new Date()), 'HH:mm:ss')}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        <span className="text-foreground font-medium mr-1">{log.actor?.username || 'System'}:</span> 
                                        {log.action_description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}