// Roommate Profile
export interface RoommateProfile {
  id: string;
  userId: string;
  preferences: RoommatePreferences;
  bio: string;
  lifestyle: LifestylePreferences;
  budget: BudgetPreferences;
  availability: AvailabilityPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Roommate Match
export interface RoommateMatch {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedUser?: {
    id: string;
    name: string;
    avatar?: string;
    program?: string;
    year?: string;
  };
  compatibilityScore: number;
  matchReasons: string[];
  compatibilityBreakdown?: {
    strengths: string[];
    concerns: string[];
    suggestions: string[];
  };
  status: RoommateMatchStatus;
  createdAt: Date;
  updatedAt?: Date;
}


export interface RoommateRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: RoommateRequestStatus;
  
  // Multi-stage approval tracking
  roommateApprovalStatus?: 'pending' | 'approved' | 'rejected';
  roommateApprovedAt?: Date;
  caretakerApprovalStatus?: 'pending' | 'approved' | 'rejected';
  caretakerApprovedAt?: Date;
  approvedBy?: string; // caretaker or landlord ID
  
  createdAt: Date;
  respondedAt?: Date;
}


// Transfer reason categories
export type TransferReason = 
  | 'better_environment'
  | 'roommate_conflict'
  | 'noise_issues'
  | 'upgrade'
  | 'downgrade'
  | 'other';

// Available room for transfer
export interface AvailableRoom {
  id: string;
  hostelId: string;
  hostelName: string;
  roomNumber: string;
  roomType: 'single' | 'double' | 'triple' | 'quad';
  floor: number;
  basePrice: number;
  currentPrice: number;
  priceDifference: number; // computed: currentPrice - userCurrentPrice
  capacity: number;
  currentOccupancy: number;
  amenities: string[];
  images: string[];
  distanceToWashroom?: number;
  isQuietFloor: boolean;
  availableFrom: Date;
  currentRoommate?: RoommatePreview;
  transferEligible: boolean;
  ineligibilityReason?: string;
}

// Hostel-specific transfer policy
export interface TransferPolicy {
  hostelId: string;
  hostelName: string;
  transferFee: number;
  allowedPeriods: ('start_of_semester' | 'mid_semester' | 'end_of_semester' | 'anytime')[];
  minDaysNotice: number;
  maxTransfersPerYear: number;
  requiresCaretakerApproval: boolean;
  requiresLandlordApproval: boolean;
  averageProcessingDays: number;
  additionalRules?: string;
}

// Public roommate information for shared rooms
export interface RoommatePreview {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  program?: string;
  year?: string;
  compatibilityScore?: number;
  sleepSchedule?: 'early_bird' | 'night_owl' | 'flexible';
  cleanliness?: 'messy' | 'average' | 'neat' | 'ocd_level';
  noiseTolerance?: 'silent' | 'moderate' | 'background_chatter' | 'music_lover';
  isCurrentRoommate?: boolean;
}

export interface TransferListing {
  id: string;
  hostelId: string;
  roomId: string;
  currentTenantId: string;
  transferFee: number;
  description: string;
  availableFrom: Date;
  availableTo: Date;
  status: TransferStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferRequest {
  id: string;
  hostelId: string;
  bookingId: string;
  fromRoomId: string;
  toRoomId: string;
  requesterId: string;
  reason: TransferReason;
  reasonDetails?: string;
  proposedTransferDate: Date;
  status: TransferRequestStatus;
  priceDifference: number;
  oldRoom?: {
    roomNumber: string;
    price: number;
  };
  newRoom?: {
    roomNumber: string;
    price: number;
  };
  adminNotes?: string;
  createdAt: Date;
  respondedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
}

export interface TransferApproval {
  id: string;
  requestId: string;
  approvedBy: string;
  approvalDate: Date;
  transferDate: Date;
  notes?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  readBy: string[];
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalHostels: number;
  totalBookings: number;
  totalRevenue: number;
  userGrowth: GrowthMetrics;
  bookingGrowth: GrowthMetrics;
  revenueGrowth: GrowthMetrics;
  period: AnalyticsPeriod;
}

// Enhanced Roommate Preferences with Personality Quiz
export interface RoommatePreferences {
  // Basic preferences (from signup)
  gender: 'male' | 'female' | 'any';
  ageRange: [number, number];
  smoking: boolean;
  pets: boolean;
  
  // Personality Quiz Answers (10 questions)
  weekendVibe?: 'netflix' | 'party' | 'study' | 'outdoor';
  sleepSchedule?: 'early_bird' | 'night_owl' | 'flexible' | 'catnapper';
  cleanliness?: 'messy' | 'average' | 'neat' | 'ocd_level';
  studySpot?: 'library' | 'room_desk' | 'cafeteria' | 'outdoors';
  noiseTolerance?: 'silent' | 'moderate' | 'background_chatter' | 'music_lover';
  foodMood?: 'snacks_only' | 'home_cooked' | 'fast_food' | 'gourmet';
  socialPreference?: 'always_social' | 'sometimes_social' | 'mostly_alone' | 'chill_gamer';
  petPreference?: 'love_pets' | 'okay_with_pets' | 'allergic' | 'no_pets';
  fridayNight?: 'hanging_with_friends' | 'gaming' | 'studying' | 'watching_shows';
  roomStyle?: 'minimalist' | 'cozy' | 'funky' | 'techy_modern';
  
  // Quiz metadata
  quizCompleted?: boolean;
  quizCompletedAt?: string;
  quizVersion?: string;
}

export interface Hostel {
  id: number;
  slug: string;
  landlord: number;
  landlord_name: string;
  name: string;
  description: string;
  address: string;
  city: string;
  university: string;
  distance_from_university: string | null;
  latitude: string | null;
  longitude: string | null;
  hostel_type: 'single_rooms' | 'shared_rooms' | 'mixed';
  gender_policy: 'male_only' | 'female_only' | 'mixed';
  status: 'active' | 'inactive' | 'under_maintenance';
  base_price: string;
  currency: string;
  rating: string;
  total_rooms: number;
  available_rooms: number;
  images: string[];
  amenities: Record<string, any>;
  amenities_list: string[];
  rules: string | null;
  landlord_phone: string;
  is_verified: boolean;
  is_active: boolean;
  has_inventory_template: boolean;
  review_count: number;
  created_at: string;
  
  // Computed/legacy fields for backward compatibility
  pricePerMonth?: number;
  distanceToCampus?: number;
  lat?: number;
  lng?: number;
  reviewsCount?: number;
  houseRules?: string;
  verified?: boolean;
  roomsLeft?: number;
  isFavorited?: boolean;
  reviews?: Review[];
  rooms?: Room[];
}

export interface Room {
  id: string;
  name: string;
  price: number;
  beds: number;
  capacity: number;
  images: string[];
  available: boolean;
  bookedDates: Date[];
}

// Review Tags (for filtering and display)
export type ReviewTag = 
  | 'cleanliness'
  | 'wifi'
  | 'safety'
  | 'location'
  | 'value'
  | 'landlord'
  | 'quiet'
  | 'facilities'
  | 'maintenance';

// Review Status
export type ReviewStatus = 'published' | 'under_review' | 'flagged' | 'removed';

// Emoji Reactions (TikTok-style)
export interface ReviewReaction {
  emoji: '👍' | '❤️' | '😮' | '😂' | '🔥';
  count: number;
  userReacted?: boolean;
}

// Landlord Response
export interface LandlordResponse {
  id: string;
  landlordName: string;
  landlordAvatar?: string;
  text: string;
  createdAt: string;
}

// Enhanced Review
export interface Review {
  id: string;
  hostelId?: string;
  user: { 
    name: string; 
    avatar: string;
    id?: string;
  };
  rating: number;
  comment: string;
  date: string;
  
  // Modern features
  tags?: ReviewTag[];
  verifiedStay?: boolean;
  helpfulVotes?: number;
  reactions?: ReviewReaction[];
  landlordResponse?: LandlordResponse;
  status?: ReviewStatus;
  isShortReview?: boolean; // Less than 50 characters
  updatedAt?: string;
  
  // For admin
  flagReason?: string;
  flaggedBy?: string;
  flaggedAt?: string;
}

// Review Stats for hostel
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  recommendationRate: number; // percentage
  tagBreakdown: Record<ReviewTag, { count: number; avgRating: number }>;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// Review Filters
export interface ReviewFilters {
  rating?: number; // Filter by star rating
  tags?: ReviewTag[];
  verifiedOnly?: boolean;
  hasPhotos?: boolean;
  sort?: 'newest' | 'helpful' | 'highest' | 'lowest';
}
export interface LifestylePreferences {
  socialLevel: 'introvert' | 'moderate' | 'extrovert';
  cookingFrequency: 'never' | 'sometimes' | 'often' | 'always';
  entertainment: string[];
  hobbies: string[];
}

export interface BudgetPreferences {
  minBudget: number;
  maxBudget: number;
  utilitiesIncluded: boolean;
}

export interface AvailabilityPreferences {
  moveInDate: Date;
  leaseDuration: number; // months
  flexibleDates: boolean;
}

export type RoommateMatchStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired';
export type RoommateRequestStatus = 'pending' | 'accepted' | 'rejected';
export type TransferStatus = 'active' | 'inactive' | 'completed' | 'cancelled';
export type TransferRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type SupportCategory =
  | 'technical'
  | 'billing'
  | 'booking'
  | 'maintenance'
  | 'general';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface GrowthMetrics {
  current: number;
  previous: number;
  percentage: number;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface Booking {
  id: string;
  hostel: Hostel;
  room: Room;
  moveInDate: Date;
  durationMonths: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: 'mpesa' | 'bank';
  studentId: string;
  studentName: string;
  hostelName: string;
  roomNumber: string;
  amount: number;
  duration: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'landlord' | 'caretaker' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  avatar?: string;
  phoneNumber?: string;
  joinedAt: Date;
  lastActiveAt?: Date;
}

export interface Payment {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  user: {
    name: string;
    email: string;
  };
  method: string;
  reference: string;
  type: 'rent' | 'deposit' | 'fee';
}

// Student Dashboard Types
export interface StudentDashboardData {
  rentStatus: RentStatusInfo;
  profileCompletion: number;
  unreadMessages: number;
  activeTickets: number;
  recentTransactions: Transaction[];
  activityFeed: ActivityEvent[];
  hostelInfo: HostelInfo | null;
  roommates: RoommateSnapshot[];
  inventoryStatus: InventoryStatusSummary | null;
}

export interface RentStatusInfo {
  status: 'paid' | 'due_soon' | 'overdue';
  nextPaymentDate: string;
  daysUntilDue: number;
  totalOutstanding: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'rent' | 'deposit' | 'penalty' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  method: string;
  reference: string;
  description?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'invoice' | 'payment' | 'message' | 'roommate' | 'ticket' | 'booking' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  actionUrl?: string;
}

export interface HostelInfo {
  id: string;
  name: string;
  roomNumber: string;
  buildingPhoto?: string;
  address: string;
  caretakerName?: string;
  caretakerPhone?: string;
}

export interface RoommateSnapshot {
  id: string;
  name: string;
  avatar?: string;
  program: string;
  year: string;
  compatibilityScore?: number;
  isPrimaryContact?: boolean;
}

export interface InventoryStatusSummary {
  totalItems: number;
  goodCondition: number;
  damaged: number;
  missing: number;
  lastUpdated: string;
}

export interface SupportTicketSummary {
  id: string;
  subject: string;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
  lastUpdated: string;
}

export interface PaymentMethod {
  id: string;
  type: 'mpesa' | 'bank' | 'card';
  label: string;
  details: string;
  isDefault: boolean;
  createdAt: string;
}

export interface RecurringPayment {
  id: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly';
  nextPaymentDate: string;
  status: 'active' | 'paused' | 'cancelled';
  paymentMethod: PaymentMethod;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  categories: {
    payments: boolean;
    messages: boolean;
    bookings: boolean;
    maintenance: boolean;
    announcements: boolean;
  };
}

export interface StudentProfile extends User {
  university?: string;
  program?: string;
  yearOfStudy?: number;
  studentId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bio?: string;
  preferences?: NotificationPreferences;
}
