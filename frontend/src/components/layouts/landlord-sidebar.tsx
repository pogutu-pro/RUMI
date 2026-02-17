'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  MessageSquare,
  Settings,
  LifeBuoy,
  Bell,
  UserCheck,
  ChevronDown,
  PanelLeft,
  UserPlus,
  BarChart3,
  TrendingUp,
  CalendarCheck,
  Clock,
  Wallet,
  FileText,
  DollarSign,
  Package,
  Shield,
  Moon,
  Sun,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/features/auth';
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
    title: 'Home',
    href: '/landlord/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Hostels',
    icon: Building2,
    items: [
      { title: 'All Hostels', href: '/landlord/hostels', icon: Building2 },
      { title: 'Add New', href: '/landlord/hostels/new', icon: UserPlus },
    ],
  },
  {
    title: 'People',
    icon: Users,
    items: [
      { title: 'Tenants', href: '/landlord/tenants', icon: Users },
      { title: 'Bookings', href: '/landlord/bookings', icon: CalendarCheck },
      { title: 'Caretakers', href: '/landlord/caretakers', icon: Shield },
      { title: 'Check-Ins', href: '/landlord/tenants/check-ins', icon: CalendarCheck },
      { title: 'Check-Outs', href: '/landlord/tenants/check-outs', icon: Clock },
    ],
  },
  {
    title: 'Earnings',
    icon: DollarSign,
    items: [
      { title: 'All Payments', href: '/landlord/payments', icon: CreditCard },
      { title: 'Payouts', href: '/landlord/payments/payouts', icon: Wallet },
    ],
  },
  {
    title: 'Account',
    icon: Settings,
    items: [
      { title: 'My Profile', href: '/landlord/profile', icon: UserCheck },
      { title: 'Notifications', href: '/landlord/notifications', icon: Bell },
      { title: 'Settings', href: '/landlord/settings', icon: Settings },
      { title: 'Support', href: '/landlord/support', icon: LifeBuoy },
    ],
  },
];

export function LandlordSidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [openGroups, setOpenGroups] = React.useState<string[]>([]);

  // Determine if the sidebar is visually expanded
  // For senior landlords, we disable auto-hover and keep it fixed based on isOpen
  const isExpanded = isOpen;

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
      <div className={cn("flex items-center h-20 px-6 mb-4", isExpanded ? "justify-between" : "justify-center")}>
        {isExpanded ? (
          <Link href="/" className="flex items-center gap-3 font-bold text-3xl text-primary group">
            <div className="relative h-10 w-10 transition-transform group-hover:scale-105">
              <Image src="/images/logo/logo.svg" alt="RUMI Logo" fill className="object-contain" />
            </div>
            <span className="tracking-tight">RUMI</span>
          </Link>
        ) : (
           <Link href="/" className="relative h-10 w-10 group">
              <Image 
                src="/images/logo/logo.svg" 
                alt="RUMI Logo" 
                width={40} 
                height={40} 
                className="transition-transform group-hover:scale-105"
              />
           </Link>
        )}
        
        {!isMobile && isExpanded && (
           <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 ml-auto text-foreground/80 hover:text-foreground hover:bg-accent"
            onClick={() => setIsOpen(!isOpen)}
          >
            <PanelLeft className="h-6 w-6" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5 pb-4">
          {navItems.map((item, index) => {
            const is_active = item.href
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
                        "w-full h-12 justify-between font-bold hover:bg-accent hover:text-foreground transition-all duration-200",
                        is_active && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-l-4 border-primary"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="h-6 w-6" />
                        <span className="text-lg">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 transition-transform duration-200 opacity-70",
                          openGroups.includes(item.title) ? "rotate-180" : ""
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-0 space-y-1.5 mt-1 bg-muted/40 py-3 rounded-b-xl border-l-4 border-primary/30 ml-6">
                    {item.items.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 px-5 py-2.5 text-lg transition-colors duration-200 border-l-4 -ml-[4px]",
                          pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                            ? "border-primary text-primary font-bold bg-primary/15"
                            : "border-transparent text-foreground/80 font-semibold hover:text-foreground hover:bg-accent"
                        )}
                      >
                        {subItem.icon && <subItem.icon className="h-5 w-5 opacity-80" />}
                        <span className="flex-1">{subItem.title}</span>
                        {subItem.badge && (
                          <Badge variant="secondary" className="h-6 px-2 text-xs font-bold ring-1 ring-primary/20">
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
                          "h-12 w-12 mx-auto mb-2 rounded-xl",
                          is_active && "bg-primary/10 text-primary border-r-4 border-primary rounded-r-none"
                        )}
                      >
                        <item.icon className="h-6 w-6" />
                        <span className="sr-only">{item.title}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-lg font-bold p-3">
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
                  "w-full h-12 justify-start font-bold hover:bg-accent hover:text-foreground transition-all duration-200 px-4",
                  is_active && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-l-4 border-primary"
                )}
              >
                <Link href={item.href!}>
                  <div className="flex items-center gap-4">
                    <item.icon className="h-6 w-6" />
                    <span className="text-lg font-bold">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto h-6 px-2 text-xs font-bold ring-1 ring-primary/20">
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
                        "h-12 w-12 mx-auto mb-2 rounded-xl relative",
                        is_active && "bg-primary/10 text-primary border-r-4 border-primary rounded-r-none"
                      )}
                    >
                      <Link href={item.href!}>
                        <item.icon className="h-6 w-6" />
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold ring-2 ring-background"
                          >
                            {typeof item.badge === 'number' ? item.badge : '!'}
                          </Badge>
                        )}
                        <span className="sr-only">{item.title}</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-lg font-bold p-3">{item.title}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </ScrollArea>

      {/* Sidebar Footer - Added RUMI Guide for senior help */}
      <div className="mt-auto p-4 border-t border-border/50 bg-muted/20 flex flex-col gap-2">
        {isExpanded ? (
          <>
            <Button 
              className="w-full h-12 justify-start gap-4 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              asChild
            >
              <Link href="/landlord/support">
                 <LifeBuoy className="h-6 w-6" />
                 <span className="text-lg">Need Help?</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-4 font-bold border-2 border-warning/30 hover:bg-warning/10 text-foreground transition-all duration-200"
              asChild
            >
              <Link href="/landlord/payments/subscription">
                <Smartphone className="h-6 w-6 text-warning" />
                <span className="text-lg">Subscription</span>
              </Link>
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" className="h-12 w-12 mx-auto bg-primary shadow-lg" asChild>
                    <Link href="/landlord/support">
                      <LifeBuoy className="h-6 w-6" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-lg font-bold p-3">Get Help</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 mx-auto text-muted-foreground hover:text-foreground hover:bg-accent border-2 border-warning/20"
                    asChild
                  >
                    <Link href="/landlord/payments/subscription">
                      <Smartphone className="h-6 w-6 text-warning" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-lg font-bold p-3">Subscription</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
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
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out shadow-xl",
        isExpanded ? "w-80" : "w-24"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
