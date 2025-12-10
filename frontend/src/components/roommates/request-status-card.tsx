'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, X, MessageSquare, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoommateRequest } from '@/types/entities.types';
import { formatDistanceToNow } from 'date-fns';

interface RequestStatusCardProps {
  request: RoommateRequest & {
    otherUser: {
      name: string;
      avatar?: string;
      program?: string;
      year?: string;
    };
  };
  type: 'sent' | 'received';
  onAccept?: () => void;
  onReject?: () => void;
  onWithdraw?: () => void;
  onMessage?: () => void;
}

export function RequestStatusCard({
  request,
  type,
  onAccept,
  onReject,
  onWithdraw,
  onMessage,
}: RequestStatusCardProps) {
  // Determine current stage and status
  const getCurrentStage = () => {
    if (request.status === 'rejected') {
      return 'rejected';
    }
    
    if (type === 'sent') {
      if (request.roommateApprovalStatus === 'pending') {
        return 'awaiting_roommate';
      }
      if (request.roommateApprovalStatus === 'approved' && request.caretakerApprovalStatus === 'pending') {
        return 'awaiting_caretaker';
      }
      if (request.caretakerApprovalStatus === 'approved') {
        return 'approved';
      }
    } else {
      // Received request
      if (request.roommateApprovalStatus === 'pending') {
        return 'action_required';
      }
      if (request.roommateApprovalStatus === 'approved' && request.caretakerApprovalStatus === 'pending') {
        return 'awaiting_caretaker';
      }
      if (request.caretakerApprovalStatus === 'approved') {
        return 'approved';
      }
    }
    
    return 'pending';
  };

  const currentStage = getCurrentStage();

  const getStageInfo = () => {
    switch (currentStage) {
      case 'action_required':
        return {
          label: 'Action Required',
          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
          icon: Clock,
        };
      case 'awaiting_roommate':
        return {
          label: 'Awaiting Response',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
          icon: Clock,
        };
      case 'awaiting_caretaker':
        return {
          label: 'Awaiting Caretaker Approval',
          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
          icon: Clock,
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
          icon: Check,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
          icon: X,
        };
      default:
        return {
          label: 'Pending',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400',
          icon: Clock,
        };
    }
  };

  const stageInfo = getStageInfo();
  const IconComponent = stageInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-muted">
              <AvatarImage src={request.otherUser.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-blue-500 text-white font-bold">
                {request.otherUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="font-bold truncate">{request.otherUser.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.otherUser.program} • Year {request.otherUser.year}
                  </p>
                </div>
                <Badge variant="secondary" className={cn("text-xs whitespace-nowrap", stageInfo.color)}>
                  <IconComponent className="h-3 w-3 mr-1" />
                  {stageInfo.label}
                </Badge>
              </div>

              {/* Timeline */}
              <div className="mt-3 space-y-2">
                <ApprovalTimeline
                  roommateStatus={request.roommateApprovalStatus || 'pending'}
                  caretakerStatus={request.caretakerApprovalStatus || 'pending'}
                  type={type}
                />
              </div>

              {/* Message */}
              {request.message && (
                <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground italic">"{request.message}"</p>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Actions */}
        {(currentStage === 'action_required' || currentStage === 'awaiting_roommate') && (
          <CardFooter className="bg-muted/30 p-3 gap-2">
            {currentStage === 'action_required' && type === 'received' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={onReject}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onAccept}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </>
            )}
            
            {currentStage === 'awaiting_roommate' && type === 'sent' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={onMessage}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={onWithdraw}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

interface ApprovalTimelineProps {
  roommateStatus: 'pending' | 'approved' | 'rejected';
  caretakerStatus: 'pending' | 'approved' | 'rejected';
  type: 'sent' | 'received';
}

function ApprovalTimeline({ roommateStatus, caretakerStatus, type }: ApprovalTimelineProps) {
  const steps = [
    {
      label: type === 'sent' ? 'Roommate Response' : 'Your Response',
      status: roommateStatus,
    },
    {
      label: 'Caretaker Approval',
      status: caretakerStatus,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                step.status === 'approved' && 'bg-emerald-500 border-emerald-500',
                step.status === 'rejected' && 'bg-red-500 border-red-500',
                step.status === 'pending' && 'border-muted-foreground/30'
              )}
            >
              {step.status === 'approved' && (
                <Check className="h-3 w-3 text-white" />
              )}
              {step.status === 'rejected' && (
                <X className="h-3 w-3 text-white" />
              )}
            </div>
            <span className={cn(
              'text-xs font-medium',
              step.status === 'approved' && 'text-emerald-600',
              step.status === 'rejected' && 'text-red-600',
              step.status === 'pending' && 'text-muted-foreground'
            )}>
              {step.label}
            </span>
          </div>
          
          {idx < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 min-w-[20px]',
              steps[idx + 1].status !== 'pending' ? 'bg-emerald-500' : 'bg-muted'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
