'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Wrench, 
  Users, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  isPrimary?: boolean;
}

const ActionCard = ({ title, description, icon, href, isPrimary = false }: ActionCardProps) => (
  <Link href={href} className="flex-1 min-w-[160px]">
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-200 border border-border/50 h-full shadow-sm",
        isPrimary ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted/50"
      )}
    >
      <div className="p-5 flex flex-col items-start justify-between h-full gap-6">
        <div className={cn(
          "p-2.5 rounded-lg border",
          isPrimary ? "bg-white/10 border-white/20" : "bg-muted border-border"
        )}>
          {icon}
        </div>
        
        <div className="space-y-1.5 w-full">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base leading-tight">{title}</h3>
            <ArrowRight className={cn(
              "h-3.5 w-3.5 transition-transform group-hover:translate-x-1",
              isPrimary ? "text-primary-foreground/70" : "text-muted-foreground"
            )} />
          </div>
          <p className={cn(
            "text-xs font-medium line-clamp-2",
            isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {description}
          </p>
        </div>
      </div>
    </Card>
  </Link>
);

export function SmartActionGrid() {
  const actions: (ActionCardProps & { key: string })[] = [
    {
      key: "pay-rent",
      title: "Pay Rent",
      description: "Process your monthly payment via M-Pesa",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/student/payments/new",
      isPrimary: true
    },
    {
      key: "repairs",
      title: "Maintenance",
      description: "Report and track repair requests",
      icon: <Wrench className="h-5 w-5" />,
      href: "/student/support"
    },
    {
      key: "roommates",
      title: "Roommates",
      description: "View and manage roommate connections",
      icon: <Users className="h-5 w-5" />,
      href: "/student/roommates"
    },
    {
      key: "house-rules",
      title: "House Rules",
      description: "Review community guidelines",
      icon: <ShieldCheck className="h-5 w-5" />,
      href: "/student/hostels/rules"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map(({ key, ...props }) => (
        <ActionCard key={key} {...props} />
      ))}
    </div>
  );
}
