'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  UserCheck, 
  Moon, 
  Clock, 
  ChevronRight,
  User 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { useCaretakerDashboard } from '@/features/caretaker';

const securityItems = [
  {
    title: 'Visitor Logs',
    description: 'Track and manage hostel visitors',
    icon: UserCheck,
    href: '/caretaker/security/visitor-logs',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    title: 'Night Checks',
    description: 'Record nightly security rounds',
    icon: Moon,
    href: '/caretaker/security/night-checks',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
  },
  {
    title: 'Late Entries',
    description: 'Monitor students arriving past curfew',
    icon: Clock,
    href: '/caretaker/security/late-entries',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
  },
];

const securityStats = [
  {
    label: "Active Visitors",
    value: "12", // TODO: Wire to real backend stat if available, else 0
    change: "+2 from last hour",
    icon: User,
  },
  {
    label: "Late Entries",
    value: "5",
    change: "Last 24 hours",
    icon: Clock,
  },
  {
    label: "Security Alerts",
    value: "0",
    change: " All clear",
    icon: Shield,
  }
];

export default function SecurityPage() {
  const { data: dashboardData } = useCaretakerDashboard();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Security Operations
        </h1>
        <p className="text-base font-medium text-slate-600 dark:text-slate-400">
          Monitor access control, visitor logs, and nightly patrols.
        </p>
      </div>

      {/* Quick Stats Row - Placeholder for now until specific Security Stats API exists */}
      <div className="grid gap-4 md:grid-cols-3">
        {securityStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-l-4 border-l-primary shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{stat.label}</p>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Modules</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {securityItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="hover:shadow-lg transition-all duration-300 group border h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-4 rounded-2xl transition-colors", item.bgColor, "group-hover:scale-110 duration-300")}>
                        <Icon className={cn("h-8 w-8", item.color)} />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
