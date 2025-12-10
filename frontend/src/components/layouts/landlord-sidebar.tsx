'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Home,
  CreditCard,
  MessageSquare,
  Settings,
  LifeBuoy,
  Bell,
  UserCheck,
  Building2,
  ChevronDown,
  PanelLeft,
  UserPlus,
  BarChart3,
  TrendingUp,
  ClipboardList,
  CalendarCheck,
  Clock,
  CheckCircle,
  History,
  Wallet,
  Receipt,
  FileText,
  DollarSign,
  Package,
  Award,
  Activity,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: string | number;
  items?: {
    title: string;
    href: string;
    icon?: React.ElementType;
    badge?: string | number;
  }[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/landlord/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Hostels',
    icon: Building2,
    items: [
      { title: 'All Hostels', href: '/landlord/hostels', icon: Building2 },
      { title: 'Add New', href: '/landlord/hostels/new', icon: UserPlus },
      { title: 'Analytics', href: '/landlord/hostels/analytics', icon: BarChart3 },
      { title: 'Inventory', href: '/landlord/hostels/inventory', icon: Package },
    ],
  },
  {
    title: 'Caretakers',
    icon: Shield,
    items: [
      { title: 'All Caretakers', href: '/landlord/caretakers', icon: Users },
      { title: 'Add New', href: '/landlord/caretakers/new', icon: UserPlus },
      { title: 'Performance', href: '/landlord/caretakers/performance', icon: Award },
    ],
  },
  {
    title: 'Tenants',
    icon: Users,
    items: [
      { title: 'All Tenants', href: '/landlord/tenants', icon: Users },
      { title: 'Check-Ins', href: '/landlord/tenants/check-ins', icon: CalendarCheck },
      { title: 'Check-Outs', href: '/landlord/tenants/check-outs', icon: Clock },
      { title: 'Roommates', href: '/landlord/tenants/roommates', icon: Users },
    ],
  },
  {
    title: 'Bookings',
    icon: CalendarCheck,
    items: [
      { title: 'All Bookings', href: '/landlord/bookings', icon: ClipboardList },
      { title: 'Pending', href: '/landlord/bookings/pending', icon: Clock, badge: 'new' },
      { title: 'Confirmed', href: '/landlord/bookings/confirmed', icon: CheckCircle },
      { title: 'History', href: '/landlord/bookings/history', icon: History },
    ],
  },
  {
    title: 'Financial',
    icon: DollarSign,
    items: [
      { title: 'Payments', href: '/landlord/payments', icon: CreditCard },
      { title: 'Payouts', href: '/landlord/payments/payouts', icon: Wallet },
      { title: 'Subscription', href: '/landlord/payments/subscription', icon: Award },
      { title: 'Reports', href: '/landlord/payments/reports', icon: FileText },
    ],
  },
  {
    title: 'Analytics',
    href: '/landlord/analytics',
    icon: TrendingUp,
  },
  {
    title: 'Messages',
    href: '/landlord/messages',
    icon: MessageSquare,
  },
  {
    title: 'Notifications',
    href: '/landlord/notifications',
    icon: Bell,
  },
  {
    title: 'Support',
    href: '/landlord/support',
    icon: LifeBuoy,
  },
  {
    title: 'Profile',
    href: '/landlord/profile',
    icon: UserCheck,
  },
];

export function LandlordSidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = React.useState<string[]>([]);
  const [isHovered, setIsHovered] = React.useState(false);

  // Determine if the sidebar is visually expanded
  const isExpanded = isOpen || isHovered;

  // Automatically open groups if a child is active
  React.useEffect(() => {
    const activeGroup = navItems.find(
      (item) =>
        item.items &&
        item.items.some((subItem) => pathname.startsWith(subItem.href))
    );
    if (activeGroup && !openGroups.includes(activeGroup.title)) {
      setOpenGroups((prev) => [...prev, activeGroup.title]);
    }
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4 bg-card border-r border-border transition-colors duration-200">
      <div className={cn("flex items-center h-14 px-6 mb-2", isExpanded ? "justify-between" : "justify-center")}>
        {isExpanded ? (
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
            <div className="relative h-8 w-8">
              <Image src="/images/logo/logo.svg" alt="RUMI Logo" fill className="object-contain" />
            </div>
            <span>RUMI</span>
          </Link>
        ) : (
           <Link href="/" className="relative h-8 w-8">
              <Image src="/images/logo/logo.svg" alt="RUMI Logo" fill className="object-contain" />
           </Link>
        )}
        
        {!isMobile && isExpanded && (
           <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5 pb-4">
          {navItems.map((item, index) => {
            const isActive = item.href
              ? pathname === item.href || pathname.startsWith(item.href + '/')
              : item.items?.some((subItem) => pathname.startsWith(subItem.href));

            if (item.items) {
              return isExpanded ? (
                <Collapsible
                  key={index}
                  open={openGroups.includes(item.title)}
                  onOpenChange={() => toggleGroup(item.title)}
                  className="w-full group"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between font-bold text-slate-900 dark:text-slate-400 hover:bg-muted hover:text-foreground transition-all duration-200",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200 opacity-50",
                          openGroups.includes(item.title) ? "rotate-180" : ""
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-0 space-y-1 mt-1 bg-muted/30 py-2 rounded-b-lg border-l-2 border-primary/20 ml-4">
                    {item.items.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 text-base transition-colors duration-200 border-l-2 -ml-[2px]",
                          pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                            ? "border-primary text-primary font-bold bg-primary/10"
                            : "border-transparent text-slate-900 dark:text-slate-400 font-bold hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {subItem.icon && <subItem.icon className="h-3.5 w-3.5 opacity-70" />}
                        <span className="flex-1">{subItem.title}</span>
                        {subItem.badge && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                            {subItem.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <TooltipProvider key={index} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-10 w-10 mx-auto mb-1 rounded-lg",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.title}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return isExpanded ? (
              <Button
                key={index}
                asChild
                variant="ghost"
                className={cn(
                  "w-full justify-start font-bold text-slate-900 dark:text-slate-400 hover:bg-muted hover:text-foreground transition-all duration-200",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                )}
              >
                <Link href={item.href!}>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] font-semibold">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              </Button>
            ) : (
              <TooltipProvider key={index} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 mx-auto mb-1 rounded-lg relative",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <Link href={item.href!}>
                        <item.icon className="h-5 w-5" />
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] font-bold"
                          >
                            {typeof item.badge === 'number' ? item.badge : '!'}
                          </Badge>
                        )}
                        <span className="sr-only">{item.title}</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out shadow-sm",
        isExpanded ? "w-72" : "w-20"
      )}
      onMouseEnter={() => !isOpen && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarContent />
    </aside>
  );
}
