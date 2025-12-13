'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/messaging.types';
import { formatTimestamp } from '@/lib/utils/message-utils';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  isGrouped?: boolean;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  isGrouped = false,
}: MessageBubbleProps) {
  const hasImage = message.attachments.some((att) => att.fileType === 'image');
  const hasPdf = message.attachments.some((att) => att.fileType === 'pdf');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'flex gap-2 px-4 py-1',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        isGrouped && 'mt-0.5',
        !isGrouped && 'mt-3'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isGrouped && (
        <div className="flex-shrink-0">
          {message.senderAvatar ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200">
              <Image
                src={message.senderAvatar}
                alt={message.senderName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-xs font-semibold text-white">
              {message.senderName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Spacer for grouped messages */}
      {isGrouped && showAvatar && <div className="w-8 flex-shrink-0" />}

      {/* Message Content */}
      <div className={cn('flex max-w-[75%] flex-col', isOwnMessage ? 'items-end' : 'items-start')}>
        {/* Sender name (only for received messages, not grouped) */}
        {!isOwnMessage && !isGrouped && (
          <p className="mb-1 px-2 text-xs font-medium text-gray-600">{message.senderName}</p>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'group relative max-w-full px-4 py-2.5 transition-all duration-200',
            isOwnMessage
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-100 rounded-2xl rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-900 shadow-sm rounded-2xl rounded-tl-sm',
            hasImage && 'p-1',
            isGrouped && isOwnMessage && 'rounded-tr-2xl mt-0.5', // Adjust for grouping
            isGrouped && !isOwnMessage && 'rounded-tl-2xl mt-0.5'
          )}
        >
          {/* Image Attachments */}
          {hasImage && (
            <div className="mb-2 overflow-hidden rounded-2xl">
              {message.attachments
                .filter((att) => att.fileType === 'image')
                .map((attachment) => (
                  <div key={attachment.id} className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl">
                    <Image
                      src={attachment.fileUrl}
                      alt={attachment.fileName}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                  </div>
                ))}
            </div>
          )}

          {/* PDF Attachments */}
          {hasPdf && (
            <div className={cn(
              'mb-2 flex items-center gap-2.5 rounded-xl p-2.5 transition-colors',
              isOwnMessage ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'
            )}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                {message.attachments
                  .filter((att) => att.fileType === 'pdf')
                  .map((attachment) => (
                    <div key={attachment.id}>
                      <p className={cn(
                        'truncate text-sm font-medium',
                        isOwnMessage ? 'text-white' : 'text-gray-900'
                      )}>
                        {attachment.fileName}
                      </p>
                      <p className={cn(
                        'text-xs',
                        isOwnMessage ? 'text-white/80' : 'text-gray-500'
                      )}>
                        {(attachment.fileSize / 1024).toFixed(0)} KB • PDF
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {message.content}
            </p>
          )}

          {/* Timestamp & Status */}
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-[10px] font-medium leading-none select-none',
              isOwnMessage ? 'justify-end text-emerald-100/90' : 'justify-start text-gray-400'
            )}
          >
            <span>{formatTimestamp(message.createdAt, true)}</span>

            {/* Read Receipts (only for own messages) */}
            {isOwnMessage && (
              <div className="ml-0.5">
                {message.status === 'sending' && (
                  <div className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
                )}
                {message.status === 'sent' && <Check className="h-3 w-3 opacity-90" strokeWidth={2.5} />}
                {message.status === 'delivered' && <CheckCheck className="h-3 w-3 opacity-90" strokeWidth={2.5} />}
                {message.status === 'read' && (
                  <CheckCheck className="h-3 w-3 text-white" strokeWidth={2.5} />
                )}
                {message.status === 'failed' && (
                  <span className="text-red-200 font-bold" title="Failed to send">!</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
