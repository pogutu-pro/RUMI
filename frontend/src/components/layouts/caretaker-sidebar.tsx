'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Home,
  Settings,
  LogOut,
  MessageSquare,
  LifeBuoy,
  ClipboardCheck,
  UserCheck,
  ChevronDown,
  PanelLeft,
  UserPlus,
  Shield,
  Wrench,
  ClipboardList,
  Moon,
  FileWarning,
  Clock,
  UserX,
  UsersRound,
  GitCompare,
  DollarSign
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
    href: '/caretaker/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Operations',
    icon: ClipboardList,
    items: [
      { title: 'Check-Ins', href: '/caretaker/check-in', icon: UserPlus },
      { title: 'Check-Outs', href: '/caretaker/check-out', icon: UserX },
      { title: 'Rent Roll', href: '/caretaker/payments', icon: DollarSign },
      { title: 'Pending Approvals', href: '/caretaker/approvals', icon: ClipboardCheck },
    ],
  },

  {
    title: 'Tenants',
    icon: Users,
    items: [
      { title: 'All Tenants', href: '/caretaker/tenants', icon: Users },
      { title: 'Roommates', href: '/caretaker/tenants/roommates', icon: UsersRound },
      { title: 'Roommate Matching', href: '/caretaker/tenants/roommate-matching', icon: GitCompare },
    ],
  },
  {
    title: 'Property',
    icon: Home,
    items: [
      { title: 'Rooms', href: '/caretaker/room-management', icon: LayoutDashboard },
      { title: 'Maintenance', href: '/caretaker/maintenance', icon: Wrench },
      { title: 'Damage Reports', href: '/caretaker/damage-reports', icon: FileWarning },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { title: 'Visitor Logs', href: '/caretaker/security/visitor-logs', icon: Users },
      { title: 'Late Entries', href: '/caretaker/security/late-entries', icon: Clock },
      { title: 'Night Checks', href: '/caretaker/security/night-checks', icon: Moon },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      { title: 'General', href: '/caretaker/settings', icon: Settings },
      { title: 'My Profile', href: '/caretaker/profile', icon: UserCheck },
      { title: 'Support', href: '/caretaker/support', icon: LifeBuoy },
    ]
  },
];

export function CaretakerSidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
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
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary group">
            <div className="relative h-8 w-8 transition-transform group-hover:scale-110">
              <Image src="/images/logo/logo.svg" alt="RUMI Logo" fill className="object-contain" />
            </div>
            <span>RUMI</span>
          </Link>
        ) : (
           <Link href="/" className="relative h-8 w-8 group">
              <Image 
                src="/images/logo/logo.svg" 
                alt="RUMI Logo" 
                fill 
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
                        "w-full justify-between h-10 px-3 hover:bg-accent hover:text-accent-foreground font-medium",
                        is_active && "text-primary font-semibold"
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
                          pathname === subItem.href
                            ? "border-primary text-primary font-bold bg-primary/10"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30"
                        )}
                      >
                        {subItem.icon && <subItem.icon className="h-3.5 w-3.5 opacity-70" />}
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
                          "h-10 w-10 mx-auto mb-1 rounded-lg",
                          is_active && "bg-primary/10 text-primary"
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
                  "w-full justify-start h-10 px-3 hover:bg-accent hover:text-accent-foreground font-medium",
                  is_active && "bg-accent text-accent-foreground font-semibold"
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
                        "h-10 w-10 mx-auto mb-1 rounded-lg",
                        is_active && "bg-primary/10 text-primary"
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
