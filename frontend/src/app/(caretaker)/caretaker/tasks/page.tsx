'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  CheckSquare, 
  ClipboardCheck, 
  DoorOpen, 
  AlertTriangle,
  ChevronRight,
  BedDouble
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

const taskGroups = [
  {
    title: 'Daily Operations',
    items: [
      {
        title: 'Maintenance Requests',
        description: 'View and manage repair requests',
        icon: Wrench,
        href: '/caretaker/maintenance',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      },
      {
        title: 'Approvals',
        description: 'Pending requests requiring approval',
        icon: CheckSquare,
        href: '/caretaker/approvals',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      },
    ]
  },
  {
    title: 'Tenant Management',
    items: [
      {
        title: 'Check In',
        description: 'Process new student arrivals',
        icon: DoorOpen,
        href: '/caretaker/check-in',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      },
      {
        title: 'Check Out',
        description: 'Process student departures',
        icon: LogOutIcon, // Defined below to avoid conflict
        href: '/caretaker/check-out',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
      },
    ]
  },
  {
    title: 'Property',
    items: [
      {
        title: 'Damage Reports',
        description: 'Log and track property damage',
        icon: AlertTriangle,
        href: '/caretaker/damage-reports',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      },
      {
        title: 'Room Management',
        description: 'Manage room allocation and status',
        icon: BedDouble,
        href: '/caretaker/room-management',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      },
    ]
  }
];

// Helper icon component
function LogOutIcon(props: React.ComponentProps<typeof DoorOpen>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export default function TasksPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Manage your daily duties and operations
        </p>
      </div>

      <div className="space-y-8">
        {taskGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Card className="hover:shadow-md transition-all active:scale-[0.98]">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", item.bgColor)}>
                          <Icon className={cn("h-6 w-6", item.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
