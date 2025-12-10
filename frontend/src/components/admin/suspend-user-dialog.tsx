'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuspend: (userId: string, reason: string, duration: string) => void;
}

export function SuspendUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuspend,
}: SuspendUserDialogProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7');
  const [isLoading, setIsLoading] = useState(false);

  const handleSuspend = async () => {
    if (!reason.trim()) return;

    setIsLoading(true);
    try {
      await onSuspend(userId, reason, duration);
      onOpenChange(false);
      setReason('');
      setDuration('7');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Suspend User
          </DialogTitle>
          <DialogDescription>
            You are about to suspend <strong>{userName}</strong>. This action will
            restrict their access to the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Suspension Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Suspension *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this user is being suspended..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Warning:</strong> The user will be notified of this suspension
            via email and will not be able to access the platform during this period.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? 'Suspending...' : 'Suspend User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
