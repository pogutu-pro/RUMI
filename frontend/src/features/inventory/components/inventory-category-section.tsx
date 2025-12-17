import * as React from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface InventoryCategorySectionProps {
  title: string;
  icon: React.ElementType;
  count: number;
  completedCount: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function InventoryCategorySection({ 
  title, 
  icon: Icon, 
  count, 
  completedCount, 
  children,
  defaultOpen = true 
}: InventoryCategorySectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const isComplete = count > 0 && count === completedCount;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <Card className={cn(
        "transition-all duration-200 border-l-4",
        isComplete ? "border-l-emerald-500" : "border-l-muted"
      )}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isComplete ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  {completedCount} / {count} items checked
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isComplete && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20">
                  Completed
                </Badge>
              )}
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3 border-t">
            <div className="h-2"></div> 
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
