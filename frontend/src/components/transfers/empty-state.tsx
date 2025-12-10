import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Inbox, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('bg-card border-dashed border-2', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6 animate-in zoom-in duration-300">
          {icon || <Inbox className="h-10 w-10 text-muted-foreground" />}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
          {description}
        </p>
        {action && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={action.onClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {action.icon}
              {action.label}
            </Button>
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NoResultsState({
  searchQuery,
  onClearSearch,
  onClearFilters,
}: {
  searchQuery?: string;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
}) {
  return (
    <EmptyState
      icon={<Search className="h-10 w-10 text-muted-foreground" />}
      title="No Results Found"
      description={
        searchQuery
          ? `No rooms match "${searchQuery}". Try different search terms or clear filters.`
          : 'No rooms match your current filters. Try adjusting your criteria.'
      }
      action={
        onClearFilters
          ? {
              label: 'Clear Filters',
              onClick: onClearFilters,
              icon: <RefreshCw className="h-4 w-4 mr-2" />,
            }
          : undefined
      }
      secondaryAction={
        onClearSearch && searchQuery
          ? {
              label: 'Clear Search',
              onClick: onClearSearch,
            }
          : undefined
      }
    />
  );
}
