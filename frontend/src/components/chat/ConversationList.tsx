import React from 'react';
import type { Conversation } from '../../hooks/useChat';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>

      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <div className="text-4xl mb-2">💬</div>
          <p>No conversations yet</p>
          <p className="text-sm">Start chatting with buyers and sellers!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {conversation.other_user.avatar ? (
                      <img
                        src={conversation.other_user.avatar}
                        alt={conversation.other_user.name}
                        className="w-12 h-12 rounded-full object-cover"
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.other_user.name}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message.timestamp)}
                        </span>
                      )}
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {conversation.last_message ? (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.last_message.message}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-1">
                      No messages yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationList;