'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { 
  Building2, 
  Info, 
  CreditCard, 
  Newspaper, 
  HelpCircle, 
  PhoneCall, 
  LayoutDashboard,
  LogOut,
  UserPlus,
  ArrowRight
} from 'lucide-react';

interface PublicMenuContentProps {
  onClose?: () => void;
  user?: {
    name: string;
    role: 'tenant' | 'landlord' | 'admin';
    image?: string;
  } | null;
  onSignOut?: () => Promise<void>;
  excludeHeader?: boolean;
  isGrid?: boolean;
  excludeItems?: string[];
}

const PUBLIC_NAV_ITEMS = [
  {
    href: '/features',
    label: 'Features',
    desc: 'Properties, tenants, rent, and payments in one place.',
    icon: <Building2 className="h-5 w-5" />
  },
  {
    href: '/how-it-works',
    label: 'How It Works',
    desc: 'From adding a property to getting paid.',
    icon: <Building2 className="h-5 w-5" />
  },
  {
    href: '/pricing',
    label: 'Pricing',
    desc: 'Simple, per-unit pricing.',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    href: '/about',
    label: 'About',
    desc: 'Why we built RumiaRent.',
    icon: <Info className="h-5 w-5" />
  },
];

const MENU_ITEMS = [
  { 
    href: '/blog', 
    label: 'Blog', 
    desc: 'Latest campus news and accommodation tips.',
    icon: <Newspaper className="h-5 w-5" /> 
  },
  { 
    href: '/faq', 
    label: 'FAQ', 
    desc: 'Frequently asked questions and answers.',
    icon: <HelpCircle className="h-5 w-5" /> 
  },
  { 
    href: '/contact', 
    label: 'Contact', 
    desc: 'Get in touch with our support team.',
    icon: <PhoneCall className="h-5 w-5" /> 
  },
];

export function PublicMenuContent({ 
  onClose, 
  user, 
  onSignOut, 
  excludeHeader = false, 
  isGrid = false,
  excludeItems = []
}: PublicMenuContentProps) {
  const pathname = usePathname();

  const allItems = [...PUBLIC_NAV_ITEMS, ...MENU_ITEMS];
  const itemsToShow = allItems.filter(item => {
    if (excludeHeader && PUBLIC_NAV_ITEMS.some(p => p.href === item.href)) return false;
    if (excludeItems.includes(item.href)) return false;
    return true;
  });

  if (isGrid) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {itemsToShow.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex flex-col p-5 border border-gray-100 rounded-none transition-all hover:bg-gray-50 active:scale-[0.98] group h-full',
                  pathname.startsWith(item.href) ? 'bg-gray-50 border-primary/20' : 'bg-white'
                )}
              >
                <div className={cn(
                  'w-fit p-3 bg-gray-100 text-gray-900 transition-colors group-hover:bg-primary/10 group-hover:text-primary mb-6',
                  pathname.startsWith(item.href) && 'bg-primary/10 text-primary'
                )}>
                  {item.icon}
                </div>
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      'text-sm font-black transition-colors group-hover:text-primary',
                      pathname.startsWith(item.href) ? 'text-primary' : 'text-gray-900'
                    )}>
                      {item.label}
                    </h3>
                    <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold leading-tight line-clamp-2 uppercase tracking-tighter opacity-70">
                    {item.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 pb-12 border-t border-gray-100 bg-gray-50/50">
          {user ? (
            <div className="grid grid-cols-1 gap-3">
               <div className="px-4 py-2 bg-white border border-gray-100 mb-2">
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{user.role}</p>
               </div>
               <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 rounded-none border-red-100 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                  onClick={() => {
                      if (onSignOut) onSignOut();
                      if (onClose) onClose();
                  }}
               >
                  <LogOut className="h-4 w-4" />
                  Sign out
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button className="rounded-none bg-primary hover:bg-primary/90" size="lg" asChild>
                <Link href={AUTH_ROUTES.LOGIN} onClick={onClose}>
                  Log in
                </Link>
              </Button>
              <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary/5" size="lg" asChild>
                <Link href={AUTH_ROUTES.REGISTER} onClick={onClose}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full py-6 pb-20">
      <div className="flex-1 overflow-y-auto px-1">
        <nav className="flex flex-col gap-1 pb-4">
          {itemsToShow.map((item) => {
            const is_active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-4 px-6 py-4 transition-colors border-b border-gray-100 last:border-0',
                  is_active
                    ? 'bg-gray-50'
                    : 'hover:bg-gray-50'
                )}
              >
                <span className={cn(
                  "flex items-center justify-center transition-colors",
                  is_active ? "text-gray-900" : "text-gray-400 group-hover:text-gray-900"
                )}>
                  {item.icon}
                </span>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm font-bold tracking-tight",
                    is_active ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                  )}>
                    {item.label}
                  </span>
                  {item.desc && (
                    <span className="text-xs text-gray-400 mt-0.5 font-medium">
                       {item.desc}
                    </span>
                  )}
                </div>
                {!is_active && (
                   <ArrowRight className="ml-auto h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100 px-1">
        {user ? (
          <div className="flex flex-col gap-3">
             <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
             </div>
             <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                    if (onSignOut) onSignOut();
                    if (onClose) onClose();
                }}
             >
                Sign out
             </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button className="w-full bg-gray-900 hover:bg-black text-white rounded-md shadow-none" size="lg" asChild>
              <Link href={AUTH_ROUTES.LOGIN} onClick={onClose}>
                Log in
              </Link>
            </Button>
            <Button variant="outline" className="w-full border-gray-200 text-gray-900 hover:bg-gray-50 hover:text-gray-900 rounded-md" size="lg" asChild>
              <Link href={AUTH_ROUTES.REGISTER} onClick={onClose}>
                Sign up
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
