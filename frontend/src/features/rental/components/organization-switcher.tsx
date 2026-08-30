'use client';

import * as React from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useOrganizations } from '../hooks/use-rental';
import { useSelectedOrgStore } from '@/stores/selected-org.store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

/**
 * Super-admin only — lets them view any single organization's rental data
 * through the same landlord dashboard views. Every other role never sees
 * this; their data is already server-scoped to their own organization.
 */
export function OrganizationSwitcher({ collapsed }: { collapsed: boolean }) {
  const { data: organizations = [], isLoading } = useOrganizations();
  const selectedOrgId = useSelectedOrgStore((s) => s.selectedOrgId);
  const setSelectedOrgId = useSelectedOrgStore((s) => s.setSelectedOrgId);

  const selected = organizations.find((o) => o.id === selectedOrgId);
  const label = selected ? selected.name : 'All organizations';

  return (
    <div className="px-3 pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted',
              collapsed && 'justify-center px-0',
            )}
            disabled={isLoading}
          >
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Viewing organization</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSelectedOrgId(null)} className="flex items-center justify-between">
            All organizations
            {!selectedOrgId && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setSelectedOrgId(org.id)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{org.name}</span>
              {selectedOrgId === org.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
