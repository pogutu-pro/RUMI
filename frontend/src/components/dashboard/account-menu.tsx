'use client';

import Link from 'next/link';
import * as React from 'react';
import { LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUserInitials } from '@/lib/utils/user';
import { cn } from '@/lib/utils/cn';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/** Light / Dark / System switch. Plain buttons (not menu items) so picking one
 * leaves the menu open and the change is visible straight away. */
function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored theme on the client; render neutral first.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const active = mounted ? theme ?? 'system' : null;

  return (
    <div className="px-2 py-1.5">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Appearance</p>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active === value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              active === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AccountMenu({
  name,
  email,
  photoUrl,
  settingsHref,
  onLogout,
}: {
  name: string;
  email: string;
  photoUrl?: string | null;
  settingsHref: string;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
        >
          <Avatar className="h-9 w-9">
            {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {getUserInitials(name) || 'U'}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeSwitch />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsHref} className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
