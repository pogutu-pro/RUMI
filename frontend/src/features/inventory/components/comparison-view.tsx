import * as React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  MessageSquare,
  ArrowRight,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { InventoryReportItem, ItemCondition } from '@/features/inventory';

interface ComparisonViewProps {
  item: InventoryReportItem;
  onVerify: (
    condition: ItemCondition, 
    isFlagged: boolean, 
    comment?: string,
    isChargeable?: boolean,
    damageCost?: number
  ) => void;
}

// ... CONDTION_OPTS code (unchanged)

export function ComparisonView({ item, onVerify }: ComparisonViewProps) {
  const [caretakerCondition, setCaretakerCondition] = React.useState<ItemCondition>(
    item.caretakerCondition || item.studentCondition
  );
  const [comment, setComment] = React.useState(item.caretakerComment || '');
  const [isFlagged, setIsFlagged] = React.useState(item.isFlagged || false);
  const [isChargeable, setIsChargeable] = React.useState(item.isChargeable || false);
  const [damageCost, setDamageCost] = React.useState(item.damageCost || 0);

  // Auto-flag if conditions differ
  React.useEffect(() => {
    if (caretakerCondition !== item.studentCondition) {
      setIsFlagged(true);
      // Removed auto-verify call here to avoid loop, user must interact
    }
  }, [caretakerCondition, item.studentCondition]);

  const handleConditionChange = (cond: ItemCondition) => {
    setCaretakerCondition(cond);
    const flagged = cond !== item.studentCondition;
    setIsFlagged(flagged);
    onVerify(cond, flagged, comment, isChargeable, damageCost);
  };

  const handleCommentChange = (val: string) => {
    setComment(val);
    onVerify(caretakerCondition, isFlagged, val, isChargeable, damageCost);
  };

  const handleFlagChange = (checked: boolean) => {
    setIsFlagged(checked);
    onVerify(caretakerCondition, checked, comment, isChargeable, damageCost);
  };

  const handleChargeableChange = (checked: boolean) => {
      setIsChargeable(checked);
      onVerify(caretakerCondition, isFlagged, comment, checked, damageCost);
  };
  
  const handleCostChange = (val: string) => {
      const num = parseFloat(val) || 0;
      setDamageCost(num);
      onVerify(caretakerCondition, isFlagged, comment, isChargeable, num);
  };

  const StudentIcon = CONDITION_OPTS.find(c => c.value === item.studentCondition)?.icon || HelpCircle;

  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg overflow-hidden",
      isFlagged ? "border-amber-400 bg-amber-50/30" : "bg-card"
    )}>
      {/* Student's Report (Left Side) */}
      <div className="p-4 border-r border-dashed bg-muted/20">
        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Student Reported</h4>
        <div className="flex items-start gap-3">
          <div className={cn("mt-1 p-1 rounded-full bg-white shadow-sm border")}>
            <StudentIcon className={cn("h-5 w-5", CONDITION_OPTS.find(c => c.value === item.studentCondition)?.color)} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">{item.studentCondition.replace('_', ' ')}</p>
            {item.studentComment ? (
              <div className="text-sm bg-white p-2 rounded border italic text-muted-foreground">
                "{item.studentComment}"
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No comments</p>
            )}
          </div>
        </div>
      </div>

      {/* Caretaker's Verification (Right Side) */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Caretaker Verification</h4>
            <div className="flex items-center gap-2">
                <Switch 
                    id={`flag-${item.itemId}`}
                    checked={isFlagged}
                    onCheckedChange={handleFlagChange}
                />
                <Label htmlFor={`flag-${item.itemId}`} className="text-xs flex items-center gap-1 cursor-pointer">
                    <Flag className={cn("h-3 w-3", isFlagged ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                    Flag
                </Label>
            </div>
        </div>

        {/* Condition Selector */}
        <div className="grid grid-cols-2 gap-2">
          {CONDITION_OPTS.map((opt) => (
             <button
                key={opt.value}
                onClick={() => handleConditionChange(opt.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-all",
                  caretakerCondition === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent"
                )}
             >
                 <opt.icon className="h-4 w-4" />
                 {opt.label}
             </button>
          ))}
        </div>

        {/* Damage / Cost Input */}
        {(caretakerCondition === 'damaged' || caretakerCondition === 'missing' || isFlagged) && (
           <div className="bg-destructive/10 p-3 rounded-md space-y-2 border border-destructive/20 animate-in fade-in">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-destructive">Charge Tenant?</Label>
                <Switch 
                   checked={isChargeable} 
                   onCheckedChange={handleChargeableChange} 
                />
              </div>
              {isChargeable && (
                   <div className="flex items-center gap-2">
                       <span className="text-sm font-bold">KES</span>
                       <input 
                           type="number" 
                           className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                           placeholder="Damage Cost"
                           value={damageCost}
                           onChange={(e) => handleCostChange(e.target.value)}
                       />
                   </div>
              )}
           </div>
        )}

        {/* Comment */}
        <Textarea 
             placeholder="Add caretaker notes..."
             value={comment}
             onChange={(e) => handleCommentChange(e.target.value)}
             className="h-20 text-sm resize-none"
        />
      </div>
    </div>
  );
}
