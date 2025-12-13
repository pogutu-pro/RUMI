import { RoommatePreview } from '@/features/roommates/types';

// Transfer reason categories
export type TransferReason = 
  | 'better_environment'
  | 'roommate_conflict'
  | 'noise_issues'
  | 'upgrade'
  | 'downgrade'
  | 'other';

export type TransferStatus = 'active' | 'inactive' | 'completed' | 'cancelled';
export type TransferRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

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
