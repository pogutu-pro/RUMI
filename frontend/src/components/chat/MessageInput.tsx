import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  loading,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading || disabled) return;

    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || loading || disabled}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>Send</span>
            </>
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};

export default MessageInput;