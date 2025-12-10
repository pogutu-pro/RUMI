'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  UserCheck, 
  Moon, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

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

export default function SecurityPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground">
          Manage hostel security and access control
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {securityItems.map((item) => {
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
  );
}
