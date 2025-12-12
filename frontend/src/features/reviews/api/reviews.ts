import { Review, ReviewTag, ReviewReaction } from '@/types/entities.types';

// Mock review tags for variety
const sampleTags: ReviewTag[][] = [
  ['cleanliness', 'wifi', 'safety'],
  ['location', 'value', 'landlord'],
  ['quiet', 'facilities'],
  ['cleanliness', 'safety', 'landlord'],
  ['wifi', 'location', 'value'],
  ['facilities', 'maintenance', 'quiet'],
];

// Mock reactions
const sampleReactions: ReviewReaction[][] = [
  [
    { emoji: '👍', count: 12, userReacted: false },
    { emoji: '❤️', count: 5, userReacted: false },
    { emoji: '🔥', count: 3, userReacted: false },
  ],
  [
    { emoji: '👍', count: 8, userReacted: true },
    { emoji: '😮', count: 2, userReacted: false },
  ],
  [
    { emoji: '❤️', count: 15, userReacted: false },
    { emoji: '🔥', count: 7, userReacted: false },
  ],
  [
    { emoji: '👍', count: 20, userReacted: false },
    { emoji: '❤️', count: 10, userReacted: false },
  ],
  [],
];

// Mock reviews with rich data
const mockReviews: Review[] = [
  {
    id: 'rev-1',
    user: { 
      name: 'Sarah Mwangi', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      id: 'user-1'
    },
    rating: 5,
    comment: 'Absolutely loved my stay here! The hostel exceeded all my expectations. The rooms are spotlessly clean, WiFi is super fast (perfect for online classes), and the landlord is incredibly responsive. The location is perfect - just 5 minutes walk to campus. Security is top-notch with 24/7 guards and CCTV. Would definitely recommend to fellow students!',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['cleanliness', 'wifi', 'safety', 'location'],
    verifiedStay: true,
    helpfulVotes: 24,
    reactions: [
      { emoji: '👍', count: 18, userReacted: false },
      { emoji: '❤️', count: 12, userReacted: false },
      { emoji: '🔥', count: 6, userReacted: false },
    ],
    landlordResponse: {
      id: 'resp-1',
      landlordName: 'John Kamau',
      landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      text: 'Thank you so much for your kind words, Sarah! We\'re thrilled you enjoyed your stay. Your comfort and safety are our top priorities. Welcome back anytime! 🏠',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'published',
  },
  {
    id: 'rev-2',
    user: { 
      name: 'David Omondi', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      id: 'user-2'
    },
    rating: 4,
    comment: 'Great value for money! The facilities are well-maintained and the common areas are always clean. My only minor complaint is that it can get a bit noisy during exam season, but overall a solid choice for students on a budget.',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['value', 'facilities', 'maintenance'],
    verifiedStay: true,
    helpfulVotes: 15,
    reactions: [
      { emoji: '👍', count: 12, userReacted: true },
      { emoji: '😮', count: 3, userReacted: false },
    ],
    status: 'published',
  },
  {
    id: 'rev-3',
    user: { 
      name: 'Grace Achieng', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace',
      id: 'user-3'
    },
    rating: 5,
    comment: 'Perfect hostel for serious students. The quiet hours policy is actually enforced, unlike other places I\'ve stayed. High-speed internet, study-friendly environment, and the caretaker is super helpful.',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['quiet', 'wifi', 'landlord'],
    verifiedStay: true,
    helpfulVotes: 31,
    reactions: [
      { emoji: '❤️', count: 22, userReacted: false },
      { emoji: '🔥', count: 9, userReacted: false },
    ],
    status: 'published',
  },
  {
    id: 'rev-4',
    user: { 
      name: 'Brian Kipchoge', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Brian',
      id: 'user-4'
    },
    rating: 3,
    comment: 'Decent place overall. Good location and the rent is affordable. However, water supply can be inconsistent during dry season and maintenance requests take a while to be addressed.',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['location', 'value'],
    verifiedStay: true,
    helpfulVotes: 8,
    reactions: [
      { emoji: '👍', count: 5, userReacted: false },
    ],
    landlordResponse: {
      id: 'resp-2',
      landlordName: 'John Kamau',
      landlordAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      text: 'Thank you for your feedback, Brian. We\'ve since installed a water storage tank to address the supply issues, and we\'re working on improving our maintenance response time. We appreciate your patience!',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'published',
  },
  {
    id: 'rev-5',
    user: { 
      name: 'Emma Wanjiru', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      id: 'user-5'
    },
    rating: 2,
    comment: 'Not great. Rooms need better ventilation.',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    verifiedStay: false,
    helpfulVotes: 2,
    reactions: [],
    status: 'published',
    isShortReview: true,
  },
  {
    id: 'rev-6',
    user: { 
      name: 'Michael Njoroge', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      id: 'user-6'
    },
    rating: 5,
    comment: 'Exceptional hostel! The landlord really cares about creating a conducive learning environment. Regular pest control, fast WiFi, backup generator during power outages, and a strict visitors policy that makes it feel safe. The study room is a lifesaver during exams!',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['safety', 'wifi', 'facilities', 'landlord'],
    verifiedStay: true,
    helpfulVotes: 42,
    reactions: [
      { emoji: '👍', count: 28, userReacted: false },
      { emoji: '❤️', count: 18, userReacted: false },
      { emoji: '🔥', count: 12, userReacted: false },
    ],
    status: 'published',
  },
];

export const getReviews = async (): Promise<Review[]> => {
  console.warn('getReviews endpoint is missing in backend.');
  return [];
};

export const getHostelReviews = async (hostelId: string): Promise<Review[]> => {
  // Backend Reference does not list GET /hostels/<id>/reviews/
  // It only lists GET /products/<id>/reviews/ for Marketplace.
  console.warn(`getHostelReviews endpoint missing for hostel ${hostelId}`);
  return [];
};

export const getMyReviews = async (): Promise<Review[]> => {
  console.warn('getMyReviews endpoint is missing in backend.');
  return [];
};

export const createReview = async (data: any): Promise<Review> => {
  console.warn('createReview endpoint is missing in backend.');
  throw new Error('Review creation not supported by backend yet');
};

export const updateReview = async (id: string, data: Partial<Review>): Promise<Review> => {
   console.warn('updateReview endpoint is missing in backend.');
   throw new Error('Review updates not supported by backend yet');
};

export const addHelpfulVote = async (reviewId: string): Promise<void> => {
  console.warn('addHelpfulVote endpoint is missing in backend.');
};

export const addReaction = async (reviewId: string, emoji: ReviewReaction['emoji']): Promise<void> => {
  console.warn('addReaction endpoint is missing in backend.');
};

export const deleteReview = async (id: string): Promise<void> => {
  console.warn('deleteReview endpoint is missing in backend.');
};

export const flagReview = async (id: string, reason?: string): Promise<void> => {
  console.warn('flagReview endpoint is missing in backend.');
};

export const unflagReview = async (id: string): Promise<void> => {
  console.warn('unflagReview endpoint is missing in backend.');
};

