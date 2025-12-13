'use client';

import { ArrowLeft, Phone, Info, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/messaging.types';
import { getRoleColor, getRoleBgColor, getInitials } from '@/lib/utils/message-utils';

interface ChatHeaderProps {
  conversation: Conversation | null;
  onBack?: () => void;
  onInfoClick?: () => void;
  showBackButton?: boolean;
}

export function ChatHeader({
  conversation,
  onBack,
  onInfoClick,
  showBackButton = false,
}: ChatHeaderProps) {
  if (!conversation) return null;

  const participant = conversation.otherParticipant;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md support-backdrop-blur:bg-white/95">
      {/* Back Button (Mobile - WhatsApp Style) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-700 transition-all hover:bg-gray-100 active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Avatar & Info - Clickable (like WhatsApp) */}
      <button
        onClick={onInfoClick}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {participant?.avatar ? (
            <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white">
              <Image
                src={participant.avatar}
                alt={participant.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-sm font-semibold text-white ring-2 ring-white">
              {getInitials(participant?.name || 'User')}
            </div>
          )}

          {/* Online Status */}
          {participant?.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        {/* Name & Status */}
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold text-gray-900">
              {participant?.name || 'Unknown'}
            </h2>
            {/* Role Badge - Compact */}
            {participant?.role && (
              <span
                className={cn(
                  'hidden rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide md:inline-block',
                  getRoleBgColor(participant.role),
                  getRoleColor(participant.role)
                )}
              >
                {participant.role}
              </span>
            )}
          </div>

          {/* Online/Typing Status */}
          <div className="flex items-center gap-1 text-xs">
            {conversation.typingUsers.length > 0 ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-emerald-600" style={{ animationDelay: '0ms' }} />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-emerald-600" style={{ animationDelay: '150ms' }} />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-emerald-600" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="font-medium">typing...</span>
              </span>
            ) : participant?.isOnline ? (
              <span className="text-emerald-600 font-medium">Online</span>
            ) : participant?.lastSeen ? (
              <span className="text-gray-500">
                Last seen {new Date(participant.lastSeen).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : null}
          </div>
        </div>
      </button>

      {/* Action Buttons (Desktop) */}
      <div className="hidden items-center gap-1 md:flex">
        {/* Future: Voice/Video Call */}
        {/* <button
          className="rounded-full p-2.5 text-gray-600 transition-colors hover:bg-gray-100 active:scale-95"
          aria-label="Voice call"
        >
          <Phone className="h-5 w-5" />
        </button> */}
        
        <button
          onClick={onInfoClick}
          className="rounded-full p-2.5 text-gray-600 transition-colors hover:bg-gray-100 active:scale-95"
          aria-label="Conversation info"
        >
          <Info className="h-5 w-5" />
        </button>

        <button
          className="rounded-full p-2.5 text-gray-600 transition-colors hover:bg-gray-100 active:scale-95"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile - Info Button Only */}
      <button
        onClick={onInfoClick}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 active:scale-95 md:hidden"
        aria-label="Conversation info"
      >
        <Info className="h-5 w-5" />
      </button>
    </div>
  );
}
