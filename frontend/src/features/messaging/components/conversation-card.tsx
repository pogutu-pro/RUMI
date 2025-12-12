'use client';

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Pin, Volume2, VolumeX, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/messaging.types';
import { formatTimestamp, formatMessagePreview, getRoleColor, getRoleBgColor, getInitials } from '@/lib/utils/message-utils';

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
}

export function ConversationCard({
  conversation,
  isActive,
  onClick,
  onPin,
  onMute,
  onDelete,
}: ConversationCardProps) {
  const otherParticipant = conversation.otherParticipant;
  const isTyping = conversation.typingUsers.length > 0;
  
  // Swipe gesture state
  const x = useMotionValue(0);
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);
  const [isSwipedRight, setIsSwipedRight] = useState(false);

  // Transform for action buttons opacity
  const leftActionOpacity = useTransform(x, [-100, -40, 0], [1, 0.3, 0]);
  const rightActionOpacity = useTransform(x, [0, 40, 100], [0, 0.3, 1]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;

    // Swipe right (pin)
    if (info.offset.x > threshold) {
      setIsSwipedRight(true);
      x.set(0);
      onPin?.();
      setTimeout(() => setIsSwipedRight(false), 300);
    }
    // Swipe left (mute/delete menu)
    else if (info.offset.x < -threshold) {
      setIsSwipedLeft(true);
      // Don't auto-close, let user tap action
    } else {
      // Bounce back
      x.set(0);
      setIsSwipedLeft(false);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    x.set(0);
    setIsSwipedLeft(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Swipe Actions (Mute/Delete) */}
      {isSwipedLeft && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-0 flex h-full items-center gap-2 bg-red-500 px-4"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onMute || (() => {}));
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white active:scale-95"
          >
            {conversation.isMuted ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onDelete || (() => {}));
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white active:scale-95"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      {/* Right Swipe Action (Pin) */}
      <motion.div
        style={{ opacity: rightActionOpacity }}
        className="absolute left-0 top-0 flex h-full items-center bg-emerald-500 px-4"
      >
        <Pin className="h-5 w-5 text-white" fill="white" />
      </motion.div>

      {/* Main Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'relative cursor-pointer border-b border-gray-100 bg-white px-4 py-3 transition-colors active:bg-gray-50',
          isActive && 'bg-emerald-50'
        )}
        onClick={onClick}
      >
        {/* Pin Indicator */}
        {conversation.isPinned && (
          <div className="absolute left-2 top-2">
            <Pin className="h-3 w-3 text-emerald-600" fill="currentColor" />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {otherParticipant?.avatar ? (
              <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gray-200">
                <Image
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold text-white',
                'bg-gradient-to-br from-purple-400 to-purple-600'
              )}>
                {getInitials(otherParticipant?.name || 'User')}
              </div>
            )}

            {/* Online Status */}
            {otherParticipant?.isOnline && (
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Name & Time */}
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {otherParticipant?.name || 'Unknown'}
              </h3>

              <span className="flex-shrink-0 text-xs text-gray-500">
                {conversation.lastMessage?.createdAt
                  ? formatTimestamp(conversation.lastMessage.createdAt, true)
                  : ''}
              </span>
            </div>

            {/* Role Badge */}
            {otherParticipant?.role && (
              <span
                className={cn(
                  'mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                  getRoleBgColor(otherParticipant.role),
                  getRoleColor(otherParticipant.role)
                )}
              >
                {otherParticipant.role}
              </span>
            )}

            {/* Last Message */}
            <div className="mt-1 flex items-center justify-between gap-2">
              <p
                className={cn(
                  'truncate text-sm',
                  conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600',
                  isTyping && 'italic text-emerald-600'
                )}
              >
                {isTyping
                  ? 'typing...'
                  : conversation.lastMessage
                    ? formatMessagePreview(conversation.lastMessage.content)
                    : 'No messages yet'}
              </p>

              <div className="flex items-center gap-2">
                {/* Muted Indicator */}
                {conversation.isMuted && (
                  <VolumeX className="h-4 w-4 flex-shrink-0 text-gray-400" />
                )}

                {/* Unread Badge */}
                {conversation.unreadCount > 0 && (
                  <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
