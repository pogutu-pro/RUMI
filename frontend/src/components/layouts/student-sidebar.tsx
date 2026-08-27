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
  User,
  Inbox,
  Lock,
  HelpCircle,
  Wallet,
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
    title: 'Current Stay',
    href: '/student/bookings/active',
    icon: Building2,
  },
  {
    title: 'Payments & Finance',
    href: '/student/payments',
    icon: CreditCard,
  },
  {
    title: 'Security',
    href: '/student/security',
    icon: Shield,
  },
  {
    title: 'Settings',
    href: '/student/settings',
    icon: Settings,
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
            href="/student/dashboard"
            className="flex items-center gap-2 font-bold text-2xl text-primary group"
          >
            <div className="relative h-8 w-8 transition-transform group-hover:scale-110">
              <Image
                src="/images/logo/logo.svg"
                alt="Rumia Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span>Rumia</span>
          </Link>
        ) : (
          <Link href="/student/dashboard" className="relative h-8 w-8 group">
            <Image
              src="/images/logo/logo.svg"
              alt="Rumia Logo"
              width={32}
              height={32}
              className="object-contain transition-transform group-hover:scale-110"
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
            const is_active = item.href
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
                        'w-full justify-between font-bold text-base text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200',
                        is_active &&
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
                          'flex items-center gap-2 px-4 py-2 text-base transition-colors duration-200 border-l-2 -ml-[2px] font-semibold',
                          pathname === subItem.href
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-transparent text-foreground/80 hover:text-foreground hover:bg-muted',
                        )}
                      >
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
                          is_active && 'bg-primary/10 text-primary',
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
                  'w-full justify-start font-bold text-base text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200',
                  is_active &&
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
                        is_active && 'bg-primary/10 text-primary',
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
