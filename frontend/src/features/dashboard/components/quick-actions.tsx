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
    color: 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
  },
  {
    icon: Home,
    label: 'Browse Hostels',
    href: '/student/hostels',
    color: 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
  },
  {
    icon: MessageSquare,
    label: 'Messages',
    href: '/student/messages',
    color: 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
  },
  {
    icon: LifeBuoy,
    label: 'Get Support',
    href: '/student/support',
    color: 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
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
