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
  LogOut,
  FileText,
  BarChart,
  LifeBuoy,
  CalendarCheck,
  Bell,
  Star,
  UserCheck,
  Building2,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Menu,
  ChevronDown,
  List,
  History,
  PlusCircle,
  Search,
  UserPlus,
  Ticket,
  MessageCircle,
  PanelLeft,
  Shield,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  items?: {
    title: string;
    href: string;
    icon?: React.ElementType;
  }[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Hostel',
    icon: Building2,
    items: [
      {
        title: 'Current Booking',
        href: '/student/bookings/active',
        icon: CalendarCheck,
      },
      { title: 'My Roommates', href: '/student/roommates', icon: Users },
      { title: 'Transfers', href: '/student/transfers', icon: ArrowRightLeft },
      { title: 'Check-In/Out', href: '/student/check-in', icon: UserCheck },
    ],
  },
  {
    title: 'Find Hostel',
    icon: Search,
    items: [
      { title: 'Browse Hostels', href: '/student/hostels', icon: Building2 },
      { title: 'Favorites', href: '/student/hostels/favorites', icon: Star },
      {
        title: 'Compare',
        href: '/student/hostels/compare',
        icon: ArrowRightLeft,
      },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    items: [
      { title: 'Overview', href: '/student/payments', icon: BarChart },
      {
        title: 'Payment Methods',
        href: '/student/payments/methods',
        icon: CreditCard,
      },
      { title: 'History', href: '/student/payments/receipts', icon: FileText },
    ],
  },
  {
    title: 'Messages',
    href: '/student/messages',
    icon: MessageSquare,
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { title: 'Overview', href: '/student/security', icon: Shield },
      {
        title: 'Visitor Invitations',
        href: '/student/security/visitor-invitations',
        icon: UserPlus,
      },
    ],
  },
  {
    title: 'Profile',
    href: '/student/profile',
    icon: UserCheck,
  },
  {
    title: 'More',
    icon: Menu,
    items: [
      { title: 'Bookings', href: '/student/bookings', icon: CalendarCheck },
      { title: 'Notifications', href: '/student/notifications', icon: Bell },
      { title: 'Reviews', href: '/student/reviews', icon: Star },

      { title: 'Support', href: '/student/support', icon: LifeBuoy },
      { title: 'Settings', href: '/student/settings', icon: Settings },
    ],
  },
];

export function StudentSidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
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
        item.items.some((subItem) => pathname.startsWith(subItem.href)),
    );
    if (activeGroup && !openGroups.includes(activeGroup.title)) {
      setOpenGroups((prev) => [...prev, activeGroup.title]);
    }
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4 bg-card border-r border-border transition-colors duration-200">
      <div
        className={cn(
          'flex items-center h-14 px-6 mb-2',
          isExpanded ? 'justify-between' : 'justify-center',
        )}
      >
        {isExpanded ? (
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-2xl text-primary"
          >
            <div className="relative h-8 w-8">
              <Image
                src="/images/logo/logo.svg"
                alt="RUMI Logo"
                fill
                className="object-contain"
              />
            </div>
            <span>RUMI</span>
          </Link>
        ) : (
          <Link href="/" className="relative h-8 w-8">
            <Image
              src="/images/logo/logo.svg"
              alt="RUMI Logo"
              fill
              className="object-contain"
            />
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
              : item.items?.some((subItem) =>
                  pathname.startsWith(subItem.href),
                );

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
                        'w-full justify-between font-bold text-base text-slate-900 dark:text-slate-400 hover:bg-muted hover:text-foreground transition-all duration-200',
                        isActive &&
                          'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200 opacity-50',
                          openGroups.includes(item.title) ? 'rotate-180' : '',
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
                          'flex items-center gap-2 px-4 py-2 text-base transition-colors duration-200 border-l-2 -ml-[2px]',
                          pathname === subItem.href
                            ? 'border-primary text-primary font-bold bg-primary/10'
                            : 'border-transparent text-slate-900 dark:text-slate-400 font-bold hover:text-foreground hover:bg-muted',
                        )}
                      >
                        {/* {subItem.icon && <subItem.icon className="h-3.5 w-3.5 opacity-70" />} */}
                        <span>{subItem.title}</span>
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
                          'h-10 w-10 mx-auto mb-1 rounded-lg',
                          isActive && 'bg-primary/10 text-primary',
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.title}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="flex items-center gap-4"
                    >
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
                  'w-full justify-start font-bold text-base text-slate-900 dark:text-slate-400 hover:bg-muted hover:text-foreground transition-all duration-200',
                  isActive &&
                    'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                )}
              >
                <Link href={item.href!}>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.title}</span>
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
                        'h-10 w-10 mx-auto mb-1 rounded-lg',
                        isActive && 'bg-primary/10 text-primary',
                      )}
                    >
                      <Link href={item.href!}>
                        <item.icon className="h-5 w-5" />
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
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out shadow-sm',
        isExpanded ? 'w-72' : 'w-20',
      )}
      onMouseEnter={() => !isOpen && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarContent />
    </aside>
  );
}
