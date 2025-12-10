'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { AUTH_ROUTES } from '@/lib/constants/routes';

interface PublicMenuContentProps {
  onClose?: () => void;
  user?: {
    name: string;
    role: 'student' | 'landlord' | 'admin';
    image?: string;
  } | null;
  onSignOut?: () => Promise<void>;
}

const MENU_ITEMS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/host', label: 'Become a Host' },
  { href: '/contact', label: 'Contact' },
];

export function PublicMenuContent({ onClose, user, onSignOut }: PublicMenuContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full py-6 pb-safe-bottom">
      <div className="flex-1 overflow-y-auto px-1">
        <nav className="flex flex-col gap-2 pb-4">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {item.label}
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
            <Button className="w-full" size="lg" asChild>
              <Link href={AUTH_ROUTES.LOGIN} onClick={onClose}>
                Log in
              </Link>
            </Button>
            <Button variant="outline" className="w-full" size="lg" asChild>
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
