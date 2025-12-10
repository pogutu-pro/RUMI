import type { ID, Timestamp } from './auth.types';

// ==================== Dashboard & Overview ====================

export interface CaretakerDashboardData {
  todayOverview: TodayOverview;
  maintenanceStats: MaintenanceStats;
  roomOccupancy: RoomOccupancyStats;
  upcomingEvents: UpcomingEvent[];
  recentActivity: CaretakerActivityEvent[];
}

export interface TodayOverview {
  checkInsToday: number;
  checkOutsToday: number;
  pendingApprovals: number;
  unresolvedIssues: number;
  lowAvailabilityRooms: number;
  overduePaymentsCount: number; // count only, no amounts
}

export interface MaintenanceStats {
  open: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  weeklyData: {
    day: string;
    new: number;
    resolved: number;
  }[];
}

export interface RoomOccupancyStats {
  total: number;
  occupied: number;
  available: number;
  underMaintenance: number;
  occupancyRate: number; // percentage
}

export interface UpcomingEvent {
  id: ID;
  type: 'check_in' | 'check_out' | 'inspection' | 'maintenance';
  title: string;
  description: string;
  scheduledTime: Timestamp;
  tenant?: TenantInfo;
  room?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface CaretakerActivityEvent {
  id: ID;
  type: 'check_in' | 'check_out' | 'maintenance' | 'room_change' | 'damage_report' | 'security';
  title: string;
  description: string;
  timestamp: Timestamp;
  tenant?: {
    id: ID;
    name: string;
  };
  room?: string;
  actionUrl?: string;
}

// ==================== Tenant Management ====================

export interface TenantInfo {
  id: ID;
  userId: ID;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  
  // Accommodation details
  roomId: ID;
  roomNumber: string;
  checkInDate: Timestamp;
  expectedCheckOutDate: Timestamp;
  durationMonths: number;
  
  // Guardian/Emergency contact
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Payment status (status only, no amounts)
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: Timestamp;
  
  // Academic info
  university: string;
  course?: string;
  yearOfStudy?: number;
  
  // Status
  status: 'active' | 'checked_out' | 'suspended';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TenantFilters {
  search?: string;
  paymentStatus?: 'paid' | 'pending' | 'overdue' | 'all';
  roomNumber?: string;
  status?: 'active' | 'checked_out' | 'suspended' | 'all';
  checkInDateFrom?: Timestamp;
  checkInDateTo?: Timestamp;
}

// ==================== Roommate Management ====================

export interface RoommateGroup {
  id: ID;
  roomId: ID;
  roomNumber: string;
  tenants: TenantInfo[];
  compatibility: {
    overall: number; // 0-100
    lifestyle: number;
    studyHabits: number;
    cleanliness: number;
  };
  issues: RoommateIssue[];
  createdAt: Timestamp;
}

export interface RoommateIssue {
  id: ID;
  reportedBy: ID;
  reportedByName: string;
  category: 'noise' | 'cleanliness' | 'boundaries' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  resolution?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface RoommateMatchRequest {
  id: ID;
  studentId: ID;
  studentName: string;
  preferredRoommateId?: ID;
  preferredRoommateName?: string;
  preferences: RoommatePreferences;
  status: 'pending' | 'approved' | 'rejected' | 'matched';
  suggestedMatches: SuggestedMatch[];
  caretakerNotes?: string;
  createdAt: Timestamp;
}

export interface RoommatePreferences {
  gender?: 'male' | 'female' | 'any';
  ageRange?: [number, number];
  smoking: boolean;
  pets: boolean;
  cleanliness: 'very_clean' | 'clean' | 'moderate' | 'relaxed';
  studyHabits: 'quiet' | 'moderate' | 'social';
  sleepSchedule: 'early' | 'moderate' | 'late';
  socialLevel: 'introvert' | 'moderate' | 'extrovert';
}

export interface SuggestedMatch {
  studentId: ID;
  studentName: string;
  compatibilityScore: number; // 0-100
  matchingFactors: string[];
  conflictingFactors: string[];
  currentRoom?: string;
}

export interface RoommateAssignment {
  studentId: ID;
  roomId: ID;
  roommateIds: ID[];
  assignedDate: Timestamp;
  notes?: string;
}

// ==================== Check-In / Check-Out ====================

export interface CheckInData {
  tenantId: ID;
  bookingCode: string;
  roomId: ID;
  bedNumber?: string;
  actualCheckInDate: Timestamp;
  identityVerified: boolean;
  bookingVerified: boolean;
  photoProof?: string[]; // URLs to uploaded photos
  notes?: string;
  processedBy: ID;
  processedAt: Timestamp;
}

export interface CheckOutData {
  tenantId: ID;
  roomId: ID;
  actualCheckOutDate: Timestamp;
  reason: 'semester_end' | 'transfer' | 'graduation' | 'voluntary' | 'eviction' | 'other';
  reasonDetails?: string;
  roomCondition: 'clean' | 'needs_cleaning' | 'damaged';
  damages?: DamageItem[];
  photoProof?: string[];
  notes?: string;
  processedBy: ID;
  processedAt: Timestamp;
}

export interface DamageItem {
  id?: ID;
  type: 'furniture' | 'appliance' | 'wall' | 'floor' | 'window' | 'door' | 'other';
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  estimatedCost?: number; // Optional, landlord may fill this
  photos: string[];
  reportedAt: Timestamp;
}

export interface BookingVerification {
  isValid: boolean;
  bookingId?: ID;
  studentName?: string;
  roomNumber?: string;
  expectedCheckInDate?: Timestamp;
  error?: string;
}

// ==================== Room Management ====================

export interface RoomStatus {
  id: ID;
  roomNumber: string;
  floor?: number;
  capacity: number;
  currentOccupancy: number;
  status: 'available' | 'occupied' | 'full' | 'maintenance' | 'reserved';
  roomType: 'single' | 'double' | 'triple' | 'quad' | 'suite';
  amenities: string[];
  basePrice: number; // Show price but not tenant-specific amounts
  tenants: {
    id: ID;
    name: string;
    bedNumber?: string;
    checkInDate: Timestamp;
  }[];
  maintenanceIssues: number;
  lastInspection?: Timestamp;
  nextInspection?: Timestamp;
  notes?: string;
}

export interface RoomAssignment {
  roomId: ID;
  tenantId: ID;
  bedNumber?: string;
  assignedDate: Timestamp;
  assignedBy: ID;
  notes?: string;
}

export interface RoomChange {
  id: ID;
  tenantId: ID;
  tenantName: string;
  fromRoomId: ID;
  fromRoomNumber: string;
  toRoomId: ID;
  toRoomNumber: string;
  reason: string;
  requestedDate: Timestamp;
  status: 'pending_landlord' | 'approved' | 'rejected' | 'completed';
  approvedBy?: ID;
  approvalDate?: Timestamp;
  completedDate?: Timestamp;
  notes?: string;
}

export interface RoomMaintenanceMarker {
  roomId: ID;
  reason: string;
  startDate: Timestamp;
  expectedEndDate?: Timestamp;
  markedBy: ID;
  status: 'ongoing' | 'completed';
}

// ==================== Maintenance ====================

export interface MaintenanceRequest {
  id: ID;
  hostelId: ID;
  roomId: ID;
  roomNumber: string;
  reportedBy: ID;
  reportedByName: string;
  reporterType: 'tenant' | 'caretaker' | 'landlord';
  category: 'plumbing' | 'electrical' | 'furniture' | 'appliance' | 'structural' | 'cleaning' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'received' | 'in_progress' | 'resolved' | 'closed';
  photosBefore: string[];
  photosAfter: string[];
  updates: MaintenanceUpdate[];
  assignedTo?: ID;
  estimatedCost?: number;
  landlordNotified: boolean;
  landlordNotifiedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface MaintenanceUpdate {
  id: ID;
  requestId: ID;
  updatedBy: ID;
  updatedByName: string;
  status: MaintenanceRequest['status'];
  message: string;
  photos?: string[];
  timestamp: Timestamp;
}

export interface MaintenanceFilters {
  status?: MaintenanceRequest['status'] | 'all';
  priority?: MaintenanceRequest['priority'] | 'all';
  category?: MaintenanceRequest['category'] | 'all';
  roomNumber?: string;
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
}

// ==================== Security Monitoring ====================

export interface VisitorLog {
  id: ID;
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber?: string;
  tenantId: ID;
  tenantName: string;
  roomNumber: string;
  purpose: string;
  timeIn: Timestamp;
  timeOut?: Timestamp;
  loggedBy: ID;
  loggedByName: string;
  notes?: string;
  photoId?: string;
}

export interface NightCheckReport {
  id: ID;
  checkDate: Timestamp;
  checkTime: Timestamp;
  performedBy: ID;
  performedByName: string;
  floorsChecked: number[];
  issues: NightCheckIssue[];
  totalTenantsPresent: number;
  totalTenantsAbsent: number;
  notes?: string;
  createdAt: Timestamp;
}

export interface NightCheckIssue {
  type: 'noise' | 'unauthorized_visitor' | 'safety_hazard' | 'security_breach' | 'other';
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionTaken: string;
  timestamp: Timestamp;
}

export interface LateEntryLog {
  id: ID;
  tenantId: ID;
  tenantName: string;
  roomNumber: string;
  entryTime: Timestamp;
  reason?: string;
  loggedBy: ID;
  loggedByName: string;
  notes?: string;
  createdAt: Timestamp;
}

export interface SecurityFilters {
  type?: 'visitor' | 'night_check' | 'late_entry' | 'all';
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
  roomNumber?: string;
  tenantId?: ID;
}

// ==================== Messaging ====================

export interface CaretakerConversation {
  id: ID;
  participantId: ID;
  participantName: string;
  participantType: 'tenant' | 'landlord' | 'support';
  participantAvatar?: string;
  lastMessage?: {
    content: string;
    timestamp: Timestamp;
    senderId: ID;
  };
  unreadCount: number;
  isPinned: boolean;
  roomNumber?: string; // If participant is a tenant
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CaretakerMessage {
  id: ID;
  conversationId: ID;
  senderId: ID;
  senderName: string;
  senderType: 'caretaker' | 'tenant' | 'landlord';
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// ==================== Form States ====================

export interface CheckInFormState {
  step: 1 | 2 | 3 | 4; // 1: Verify, 2: Assign Room, 3: Photos, 4: Complete
  tenantId?: ID;
  bookingCode: string;
  verified: boolean;
  roomId?: ID;
  bedNumber?: string;
  photos: File[];
  notes: string;
}

export interface CheckOutFormState {
  step: 1 | 2 | 3 | 4; // 1: Select Tenant, 2: Assess Room, 3: Report Damages, 4: Complete
  tenantId?: ID;
  reason: CheckOutData['reason'];
  reasonDetails: string;
  roomCondition: CheckOutData['roomCondition'];
  damages: DamageItem[];
  photos: File[];
  notes: string;
}

// ==================== Extended Permissions ====================

export interface ExtendedCaretakerPermissions {
  // Existing
  viewInventory: boolean;
  manageInventory: boolean;
  viewTenants: boolean;
  approveCheckOut: boolean;
  handleMaintenance: boolean;
  viewFinancials: boolean; // Limited to status only
  
  // New additions
  viewSecurityLogs: boolean;
  manageSecurityLogs: boolean;
  manageRoommates: boolean;
  controlRoommateMatching: boolean;
  assignRooms: boolean;
  approveRoomChanges: boolean;
}
