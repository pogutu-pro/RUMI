'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendFile?: (file: File) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onSendFile,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSendMessage(message);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea (max 5 lines)
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div
        className={cn(
          'flex items-end gap-2 rounded-full border-2 bg-gray-50 px-4 py-2 transition-all',
          isFocused ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200'
        )}
      >
        {/* Attach Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 active:scale-95"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf"
          onChange={handleFileSelect}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* Emoji Button */}
        <button
          type="button"
          className="flex-shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 active:scale-95"
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'flex-shrink-0 rounded-full p-2 transition-all duration-200',
            message.trim()
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-lg active:scale-95'
              : 'text-gray-400'
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
