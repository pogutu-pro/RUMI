import type {
  Conversation,
  Message,
  Participant,
  Attachment,
} from '@/types/messaging.types';

/**
 * Mock data generator for realistic UI testing
 * NOTE: This is frontend-only mock data. Backend integration will replace this.
 */

// ============================================================================
// MOCK PARTICIPANTS
// ============================================================================

const mockParticipants: Record<string, Participant> = {
  landlord: {
    id: 'user-landlord-1',
    userId: 'user-landlord-1',
    name: 'Peter Mwangi',
    role: 'landlord',
    avatar: '/images/avatars/landlord-peter.jpg',
    isOnline: true,
    hostelName: 'Campus View Hostel',
  },
  caretaker: {
    id: 'user-caretaker-1',
    userId: 'user-caretaker-1',
    name: 'Mary Wanjiru',
    role: 'caretaker',
    avatar: '/images/avatars/caretaker-mary.jpg',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    hostelName: 'Campus View Hostel',
  },
  student1: {
    id: 'user-student-1',
    userId: 'user-student-1',
    name: 'John Doe',
    role: 'student',
    isOnline: true,
    hostelName: 'Campus View Hostel',
  },
  student2: {
    id: 'user-student-2',
    userId: 'user-student-2',
    name: 'Jane Smith',
    role: 'student',
    avatar: '/images/avatars/student-jane.jpg',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    hostelName: 'Campus View Hostel',
  },
};

// ============================================================================
// MOCK MESSAGES
// ============================================================================

const createMockMessage = (
  id: string,
  conversationId: string,
  sender: Participant,
  content: string,
  messageType: 'text' | 'image' | 'pdf' = 'text',
  minutesAgo: number = 0,
  readBy: string[] = []
): Message => ({
  id,
  conversationId,
  senderId: sender.id,
  senderName: sender.name,
  senderRole: sender.role,
  senderAvatar: sender.avatar,
  content,
  messageType,
  attachments: messageType !== 'text' ? [
    {
      id: `attachment-${id}`,
      messageId: id,
      fileType: messageType,
      fileUrl: messageType === 'image' 
        ? '/images/grid-image/grid1.jpg' 
        : '/files/rent-receipt.pdf',
      fileName: messageType === 'image' ? 'room-photo.jpg' : 'rent-receipt.pdf',
      fileSize: 1024 * 500, // 500KB
      thumbnailUrl: messageType === 'image' ? '/images/grid-image/grid1.jpg' : undefined,
      createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
    }
  ] : [],
  status: 'read',
  readBy,
  createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
});

// ============================================================================
// MOCK CONVERSATIONS
// ============================================================================

export const mockConversations: Conversation[] = [
  // Conversation with Landlord
  {
    id: 'conv-landlord',
    hostelId: 'hostel-1',
    hostelName: 'Campus View Hostel',
    participants: [mockParticipants.landlord, mockParticipants.student1],
    lastMessage: createMockMessage(
      'msg-landlord-3',
      'conv-landlord',
      mockParticipants.landlord,
      'Great! I\'ll send you the rent receipt by tomorrow.',
      'text',
      2
    ),
    unreadCount: 1,
    typingUsers: [],
    isPinned: true,
    isMuted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    otherParticipant: mockParticipants.landlord,
    title: 'Peter Mwangi (Landlord)',
  },
  
  // Conversation with Caretaker
  {
    id: 'conv-caretaker',
    hostelId: 'hostel-1',
    hostelName: 'Campus View Hostel',
    participants: [mockParticipants.caretaker, mockParticipants.student1],
    lastMessage: createMockMessage(
      'msg-caretaker-2',
      'conv-caretaker',
      mockParticipants.student1,
      'Thanks for fixing the WiFi!',
      'text',
      60
    ),
    unreadCount: 0,
    typingUsers: [],
    isPinned: false,
    isMuted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    otherParticipant: mockParticipants.caretaker,
    title: 'Mary Wanjiru (Caretaker)',
  },
  
  // Empty conversation (for testing empty state)
  {
    id: 'conv-empty',
    hostelId: 'hostel-1',
    hostelName: 'Campus View Hostel',
    participants: [mockParticipants.student2, mockParticipants.student1],
    lastMessage: null,
    unreadCount: 0,
    typingUsers: [],
    isPinned: false,
    isMuted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    otherParticipant: mockParticipants.student2,
    title: 'Jane Smith (Student)',
  },
];

// ============================================================================
// MOCK MESSAGES BY CONVERSATION
// ============================================================================

export const mockMessages: Record<string, Message[]> = {
  'conv-landlord': [
    createMockMessage(
      'msg-landlord-1',
      'conv-landlord',
      mockParticipants.student1,
      'Hi Peter, I wanted to ask about the rent for next month. Is there a late fee if I pay on the 5th instead of the 1st?',
      'text',
      1440, // 1 day ago
      ['user-landlord-1', 'user-student-1']
    ),
    createMockMessage(
      'msg-landlord-2',
      'conv-landlord',
      mockParticipants.landlord,
      'Hello John! No worries, you have a grace period until the 7th of the month. After that, it\'s KES 500 per day.',
      'text',
      1420,
      ['user-landlord-1', 'user-student-1']
    ),
    createMockMessage(
      'msg-landlord-3',
      'conv-landlord',
      mockParticipants.landlord,
      'Great! I\'ll send you the rent receipt by tomorrow.',
      'text',
      2,
      ['user-landlord-1']
    ),
  ],
  
  'conv-caretaker': [
    createMockMessage(
      'msg-caretaker-1',
      'conv-caretaker',
      mockParticipants.student1,
      'Hi Mary, the WiFi in my room isn\'t working. Can you check it out?',
      'text',
      120,
      ['user-caretaker-1', 'user-student-1']
    ),
    createMockMessage(
      'msg-caretaker-2',
      'conv-caretaker',
      mockParticipants.caretaker,
      'I\'ll come by in 10 minutes to take a look.',
      'text',
      110,
      ['user-caretaker-1', 'user-student-1']
    ),
    createMockMessage(
      'msg-caretaker-3',
      'conv-caretaker',
      mockParticipants.student1,
      'Thanks for fixing the WiFi!',
      'text',
      60,
      ['user-caretaker-1', 'user-student-1']
    ),
  ],
  
  'conv-empty': [],
};

// ============================================================================
// MOCK API FUNCTIONS
// ============================================================================

/**
 * Simulate fetching conversations
 */
export const fetchMockConversations = async (): Promise<Conversation[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockConversations;
};

/**
 * Simulate fetching messages for a conversation
 */
export const fetchMockMessages = async (conversationId: string): Promise<Message[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockMessages[conversationId] || [];
};

/**
 * Simulate sending a message
 */
export const sendMockMessage = async (
  conversationId: string,
  content: string
): Promise<Message> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  const newMessage = createMockMessage(
    `msg-${Date.now()}`,
    conversationId,
    mockParticipants.student1,
    content,
    'text',
    0,
    ['user-student-1']
  );
  
  // Add to mock messages
  if (!mockMessages[conversationId]) {
    mockMessages[conversationId] = [];
  }
  mockMessages[conversationId].push(newMessage);
  
  // Update last message in conversation
  const conversation = mockConversations.find((c) => c.id === conversationId);
  if (conversation) {
    conversation.lastMessage = newMessage;
    conversation.updatedAt = new Date().toISOString();
  }
  
  return newMessage;
};

/**
 * Simulate marking conversation as read
 */
export const markMockConversationAsRead = async (conversationId: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  const conversation = mockConversations.find((c) => c.id === conversationId);
  if (conversation) {
    conversation.unreadCount = 0;
  }
};

/**
 * Simulate typing indicator
 */
export const setMockTyping = (conversationId: string, isTyping: boolean): void => {
  const conversation = mockConversations.find((c) => c.id === conversationId);
  if (conversation) {
    if (isTyping) {
      conversation.typingUsers = ['user-other'];
    } else {
      conversation.typingUsers = [];
    }
  }
};
