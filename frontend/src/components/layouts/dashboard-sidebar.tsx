'use client';

import Link from 'next/link';
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
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/theme-provider';

interface DashboardSidebarProps {
  userRole?: 'student' | 'landlord' | 'caretaker' | 'admin';
  onSignOut?: () => void;
}

const navigationConfig = {
  student: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
    { icon: CalendarCheck, label: 'Bookings', href: '/student/bookings' },
    { icon: Building2, label: 'Hostels', href: '/student/hostels' },
    { icon: MessageSquare, label: 'Messages', href: '/student/messages' },
    { icon: Bell, label: 'Notifications', href: '/student/notifications' },
    { icon: CreditCard, label: 'Payments', href: '/student/payments' },
    { icon: UserCheck, label: 'Profile', href: '/student/profile' },
    { icon: Star, label: 'Reviews', href: '/student/reviews' },
    { icon: Users, label: 'Roommates', href: '/student/roommates' },
    { icon: LifeBuoy, label: 'Support', href: '/student/support' },
    { icon: ArrowRightLeft, label: 'Transfers', href: '/student/transfers' },
  ],
  landlord: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/landlord/dashboard' },
    { icon: Building2, label: 'Hostels', href: '/landlord/hostels' },
    { icon: Home, label: 'Bookings', href: '/landlord/bookings' },
    { icon: CreditCard, label: 'Payments', href: '/landlord/payments' },
    { icon: MessageSquare, label: 'Messages', href: '/landlord/messages' },
    { icon: Star, label: 'Reviews', href: '/landlord/reviews' },
    { icon: BarChart, label: 'Analytics', href: '/landlord/analytics' },
    { icon: Settings, label: 'Settings', href: '/landlord/settings' },
  ],
  caretaker: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/caretaker/dashboard' },
    { icon: Home, label: 'Hostel', href: '/caretaker/hostel' },
    { icon: Users, label: 'Residents', href: '/caretaker/residents' },
    { icon: LifeBuoy, label: 'Tickets', href: '/caretaker/tickets' },
    { icon: FileText, label: 'Inventory', href: '/caretaker/inventory' },
    { icon: MessageSquare, label: 'Messages', href: '/caretaker/messages' },
    { icon: Settings, label: 'Settings', href: '/caretaker/settings' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Home, label: 'Bookings', href: '/admin/bookings' },
    { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
    { icon: MessageSquare, label: 'Reviews', href: '/admin/reviews' },
    { icon: FileText, label: 'Reports', href: '/admin/reports' },
    { icon: BarChart, label: 'Analytics', href: '/admin/analytics' },
    { icon: LifeBuoy, label: 'Support', href: '/admin/support' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ],
};

export function DashboardSidebar({ userRole = 'admin', onSignOut }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const sidebarItems = navigationConfig[userRole] || navigationConfig.admin;

  const roleLabel = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <div className="hidden border-r bg-card dark:bg-gray-900 md:block fixed left-0 top-0 h-screen w-64 z-40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b dark:border-gray-800 px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">RUMI</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary dark:hover:text-emerald-400",
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground hover:bg-muted dark:hover:bg-gray-800"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 space-y-2 border-t dark:border-gray-800">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 dark:border-gray-700 dark:hover:bg-gray-800"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 dark:border-gray-700 dark:hover:bg-gray-800"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
