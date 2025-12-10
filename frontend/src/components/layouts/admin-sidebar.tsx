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
  Settings,
  LifeBuoy,
  ChevronDown,
  PanelLeft,
  PieChart,
  Wallet,
  FileText,
  ShieldCheck,
  CalendarDays,
  Home,
  LogOut,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
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
import { useAuth } from '@/hooks/use-auth';

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
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    icon: Users,
    items: [
      { title: 'All Users', href: '/admin/users', icon: Users },
      { title: 'Landlord Verification', href: '/admin/users/landlords/verification', icon: ShieldCheck, badge: '!' },
      { title: 'Students', href: '/admin/users/students', icon: UserCog },
      { title: 'Landlords', href: '/admin/users/landlords', icon: Building2 },
    ],
  },
  {
    title: 'Properties',
    icon: Home,
    items: [
      { title: 'All Hostels', href: '/admin/hostels', icon: Building2 },
      { title: 'Reviews', href: '/admin/reviews', icon: FileText },
    ],
  },
  {
    title: 'Bookings',
    icon: CalendarDays,
    href: '/admin/bookings',
    items: [
       { title: 'All Bookings', href: '/admin/bookings', icon: CalendarDays },
    ]
  },
  {
    title: 'Finance',
    icon: Wallet,
    items: [
      { title: 'Payments', href: '/admin/payments', icon: CreditCard },
      { title: 'Subscriptions', href: '/admin/payments/subscriptions', icon: Wallet },
      { title: 'Refunds & Disputes', href: '/admin/payments/disputes', icon: ShieldCheck },
    ],
  },
  {
    title: 'Insights',
    icon: PieChart,
    items: [
      { title: 'Analytics', href: '/admin/analytics', icon: PieChart },
      { title: 'Reports', href: '/admin/reports', icon: FileText },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    items: [
      { title: 'Settings', href: '/admin/settings', icon: Settings },
      { title: 'Support', href: '/admin/support', icon: LifeBuoy },
    ],
  },
];

export function AdminSidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = React.useState<string[]>([]);
  const [isHovered, setIsHovered] = React.useState(false);
  const { logout } = useAuth(); // Assuming useAuth has logout

  // Determine if the sidebar is visually expanded
  const isExpanded = isOpen || isHovered;

  // Automatically open groups if a child is active, but only when the route changes
  React.useEffect(() => {
    const activeGroup = navItems.find(
      (item) =>
        item.items &&
        item.items.some((subItem) => pathname.startsWith(subItem.href))
    );
    if (activeGroup) {
      setOpenGroups((prev) =>
        prev.includes(activeGroup.title)
          ? prev
          : [...prev, activeGroup.title]
      );
    }
  }, [pathname]);

  const toggleGroup = (title: string, open?: boolean) => {
    setOpenGroups((prev) => {
      const isCurrentlyOpen = prev.includes(title);

      // If explicit open state is provided by Collapsible, respect it
      if (typeof open === 'boolean') {
        if (open && !isCurrentlyOpen) {
          return [...prev, title];
        }
        if (!open && isCurrentlyOpen) {
          return prev.filter((t) => t !== title);
        }
        return prev;
      }

      // Fallback: simple toggle
      return isCurrentlyOpen
        ? prev.filter((t) => t !== title)
        : [...prev, title];
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border transition-all duration-300">
      {/* Header */}
      <div className={cn("flex items-center h-16 px-4 mb-2 border-b border-border/50", isExpanded ? "justify-between" : "justify-center")}>
        {isExpanded ? (
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl">
               <Image src="/images/logo/logo.svg" alt="RUMI" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none tracking-tight text-foreground">RUMI</span>
              <span className="text-[10px] font-medium text-muted-foreground">Admin Portal</span>
            </div>
          </Link>
        ) : (
           <Link href="/" className="relative h-9 w-9 overflow-hidden rounded-xl">
              <Image src="/images/logo/logo.svg" alt="RUMI" fill className="object-contain" />
           </Link>
        )}
        
        {!isMobile && isExpanded && (
           <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => setIsOpen(!isOpen)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = item.href
              ? pathname === item.href
              : item.items?.some((subItem) => pathname.startsWith(subItem.href));

            // Collapsible Group
            if (item.items) {
              return isExpanded ? (
                <Collapsible
                  key={index}
                  open={openGroups.includes(item.title)}
                  onOpenChange={(open) => toggleGroup(item.title, open)}
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between h-10 px-3 hover:bg-accent hover:text-accent-foreground font-medium",
                        isActive && "text-primary font-semibold"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-[16px]">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground",
                          openGroups.includes(item.title) ? "rotate-180" : ""
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 pt-1 pb-2">
                    {item.items.map((subItem, subIndex) => {
                       const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                       return (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={cn(
                            "group flex items-center justify-between h-9 ml-3 mr-1 pl-8 pr-3 rounded-md text-[15px] transition-colors",
                            isSubActive 
                              ? "bg-accent/50 text-accent-foreground font-medium" 
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                          )}
                        >
                          <span className="truncate">{subItem.title}</span>
                          {subItem.badge && (
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] min-w-[1.25rem] justify-center bg-primary/10 text-primary hover:bg-primary/20">
                              {subItem.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
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
                          isActive && "bg-accent text-accent-foreground"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4 bg-popover text-popover-foreground border-border">
                      <span className="text-[16px]">{item.title}</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            // Single Item
            return isExpanded ? (
              <Button
                key={index}
                asChild
                variant="ghost"
                className={cn(
                  "w-full justify-start h-10 px-3 hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground font-semibold"
                )}
              >
                <Link href={item.href!}>
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-[16px]">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] bg-primary/10 text-primary">
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
                        "h-10 w-10 mx-auto mb-1 rounded-lg",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Link href={item.href!}>
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.badge && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        {isExpanded ? (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log Out
          </Button>
        ) : (
          <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 mx-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r border-border bg-card">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out shadow-lg",
        isExpanded ? "w-64" : "w-[4.5rem]"
      )}
      onMouseEnter={() => !isOpen && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarContent />
    </aside>
  );
}
