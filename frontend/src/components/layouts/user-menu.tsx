'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  LogOut,
  User,
  Settings,
  DollarSign,
  Home,
  BookCheck,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserInitials } from '@/lib/utils/user';
import { sanitizeInput, sanitizeImageUrl } from '@/lib/utils/security';

interface UserMenuProps {
  userName: string;
  userRole: 'tenant' | 'landlord' | 'admin';
  userImage?: string;
  onSignOut: () => Promise<void>;
}

/**
 * User menu dropdown component for authenticated users.
 * Displays user avatar, name, and role-specific navigation items.
 */
export const UserMenu = React.memo(function UserMenu({
  userName,
  userRole,
  userImage,
  onSignOut,
}: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const sanitizedName = React.useMemo(() => {
    return sanitizeInput(userName);
  }, [userName]);

  const sanitizedImage = React.useMemo(() => {
    return userImage ? sanitizeImageUrl(userImage) : undefined;
  }, [userImage]);

  const initials = React.useMemo(() => {
    return getUserInitials(sanitizedName);
  }, [sanitizedName]);

  // Profile and notification settings share one page per role.
  const settingsHref =
    userRole === 'admin'
      ? '/platform/settings'
      : `/${userRole}/rental/settings`;

  const roleItems = React.useMemo(() => {
    if (userRole === 'landlord') {
      return [
        {
          label: 'Properties',
          href: '/landlord/rental/properties' as const,
          icon: Home,
        },
        {
          label: 'Payments',
          href: '/landlord/rental/payments' as const,
          icon: DollarSign,
        },
      ];
    }
    if (userRole === 'tenant') {
      return [
        { label: 'My Rent', href: '/tenant/rental' as const, icon: BookCheck },
        {
          label: 'Pay Rent',
          href: '/tenant/rental/pay' as const,
          icon: DollarSign,
        },
      ];
    }
    return [
      { label: 'Manage Users', href: '/platform/users' as const, icon: User },
      {
        label: 'System Settings',
        href: '/platform/settings' as const,
        icon: Settings,
      },
    ];
  }, [userRole]);

  const handleSignOut = React.useCallback(async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await onSignOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsSigningOut(false);
    }
  }, [onSignOut, isSigningOut]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-3 rounded-full h-10 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={sanitizedImage} alt={sanitizedName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline font-medium text-sm">
            {sanitizedName.split(' ')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-semibold">
          {sanitizedName}
        </DropdownMenuLabel>
        <DropdownMenuLabel className="text-xs text-muted-foreground -mt-1">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)} account
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {roleItems.map(({ label, href, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild>
              <Link href={href as any}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{label}</span>
              </Link>
            </DropdownMenuItem>
          ))}

          <DropdownMenuItem asChild>
            <Link href={settingsHref as any}>
              <Settings className="mr-2 h-4 w-4" />
              Profile and settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleSignOut}
          disabled={isSigningOut}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? 'Signing out…' : 'Sign Out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
