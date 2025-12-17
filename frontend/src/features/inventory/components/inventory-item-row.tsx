import * as React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  MessageSquare,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { InventoryReportItem, ItemCondition } from '@/features/inventory';

interface InventoryItemRowProps {
  item: InventoryReportItem;
  readOnly?: boolean;
  onConditionChange?: (condition: ItemCondition) => void;
  onCommentChange?: (comment: string) => void;
}

const CONDITION_OPTIONS: { value: ItemCondition; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'working', label: 'Working', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'not_working', label: 'Not Working', icon: XCircle, color: 'text-red-600 dark:text-red-500 bg-red-500/10 border-red-500/20' },
  { value: 'damaged', label: 'Damaged', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { value: 'missing', label: 'Missing', icon: HelpCircle, color: 'text-orange-600 dark:text-orange-500 bg-orange-500/10 border-orange-500/20' },
];

export function InventoryItemRow({ 
  item, 
  readOnly = false,
  onConditionChange,
  onCommentChange
}: InventoryItemRowProps) {
  const [showComment, setShowComment] = React.useState(!!item.studentComment);
  const { itemSnapshot, studentCondition } = item;

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Item Details */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{itemSnapshot.name}</h4>
            <Badge variant="outline">{itemSnapshot.quantity} {itemSnapshot.unit}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{itemSnapshot.description || 'No description provided.'}</p>
        </div>

        {/* Action Area */}
        <div className="flex flex-col gap-3 min-w-[280px]">
          {!readOnly ? (
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onConditionChange?.(option.value)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-md border transition-all text-xs font-medium gap-1 h-16",
                    studentCondition === option.value
                      ? `${option.color} ring-1 ring-offset-1`
                      : "border-muted hover:border-primary/50 text-muted-foreground bg-background"
                  )}
                >
                  <option.icon className="h-5 w-5" />
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <Badge 
                variant="secondary" 
                className={cn(
                  "px-3 py-1 text-sm capitalize gap-2",
                  CONDITION_OPTIONS.find(c => c.value === studentCondition)?.color
                )}
              >
                {studentCondition.replace('_', ' ')}
              </Badge>
            </div>
          )}

          {/* Comment Toggle */}
          {!readOnly && (
             <div className="flex items-center justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn("h-8 w-8 p-0", showComment && "text-primary bg-primary/10")}
                      onClick={() => setShowComment(!showComment)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Note</TooltipContent>
                </Tooltip>
              </TooltipProvider>
             </div>
          )}
        </div>
      </div>

      {/* Comment Section */}
      {(showComment || (readOnly && item.studentComment)) && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
          {readOnly ? (
            <div className="bg-muted/50 p-3 rounded-md text-sm italic text-muted-foreground border">
              "{item.studentComment}"
            </div>
          ) : (
            <Textarea 
              placeholder="Describe the issue (e.g., 'Scratch on left leg', 'Bulb flickering')..."
              value={item.studentComment || ''}
              onChange={(e) => onCommentChange?.(e.target.value)}
              className="resize-none text-sm min-h-[60px]"
            />
          )}
        </div>
      )}
    </div>
  );
}
