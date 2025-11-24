import React from 'react';
import type { Conversation, Message } from '../../hooks/useChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  loading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  loading,
}) => {
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p>Choose a conversation from the list to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              {conversation.other_user.avatar ? (
                <img
                  src={conversation.other_user.avatar}
                  alt={conversation.other_user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium">
                  {conversation.other_user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {conversation.other_user.is_online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {conversation.other_user.name}
            </h3>
            <p className="text-xs text-gray-500">
              {conversation.other_user.is_online
                ? 'Online'
                : conversation.other_user.last_seen
                ? `Last seen ${new Date(conversation.other_user.last_seen).toLocaleString()}`
                : 'Offline'
              }
            </p>
          </div>
        </div>

        {/* Optional: Add more actions here like block, report, etc. */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        loading={loading}
        disabled={!conversation}
      />
    </div>
  );
};

export default ChatWindow;