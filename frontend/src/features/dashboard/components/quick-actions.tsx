import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Home,
  MessageSquare,
  LifeBuoy,
  Calendar,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionProps {
  horizontal?: boolean;
}

const actions = [
  {
    icon: CreditCard,
    label: 'Pay Rent',
    href: '/student/payments',
    color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
  },
  {
    icon: Home,
    label: 'Browse Hostels',
    href: '/student/hostels',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
  },
  {
    icon: MessageSquare,
    label: 'Messages',
    href: '/student/messages',
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
  },
  {
    icon: LifeBuoy,
    label: 'Get Support',
    href: '/student/support',
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
  },
];

export function QuickActions({ horizontal = false }: QuickActionProps) {
  if (horizontal) {
    return (
      <>
        {actions.map((action) => (
          <Button
            key={action.href}
            asChild
            variant="outline"
            className={cn(
              "h-20 flex-shrink-0 w-32 flex-col gap-2 border-2",
              action.color
            )}
          >
            <Link href={action.href}>
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>
            </Link>
          </Button>
        ))}
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {actions.map((action) => (
        <Button
          key={action.href}
          asChild
          variant="outline"
          className={cn(
            "h-24 md:h-28 flex-col gap-3 border-2 hover:scale-105 transition-transform",
            action.color
          )}
        >
          <Link href={action.href}>
            <action.icon className="h-6 w-6 md:h-7 md:w-7" />
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}
