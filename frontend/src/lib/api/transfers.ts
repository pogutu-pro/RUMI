import {
  TransferRequest,
  AvailableRoom,
  TransferPolicy,
  TransferReason,
} from '@/types/entities.types';
import { FilterRoomsInput } from '@/lib/validations/transfer.schema';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Get user's transfer history for a specific hostel
 */
export const getMyTransfers = async (hostelId: string): Promise<TransferRequest[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE}/hostels/${hostelId}/transfers/my-transfers/`);
  // return response.json();

  // Mock data for development
  return Array.from({ length: 3 }).map((_, i) => ({
    id: `trans-${i}`,
    hostelId: hostelId,
    bookingId: `booking-${i}`,
    fromRoomId: `room-${i}`,
    toRoomId: `room-${i + 1}`,
    requesterId: 'student-123',
    reason: (['better_environment', 'noise_issues', 'upgrade'][i] as TransferReason),
    reasonDetails: 'Need a quieter environment for studies',
    proposedTransferDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: (['pending', 'approved', 'completed'][i] as any),
    priceDifference: [0, 2000, -1500][i],
    oldRoom: {
      roomNumber: `20${i}`,
      price: 12000,
    },
    newRoom: {
      roomNumber: `30${i}`,
      price: [12000, 14000, 10500][i],
    },
    createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
  }));
};

/**
 * Get available rooms for transfer in a specific hostel
 */
export const getAvailableRooms = async (
  hostelId: string,
  filters?: FilterRoomsInput
): Promise<AvailableRoom[]> => {
  // TODO: Replace with actual API call
  // const queryParams = new URLSearchParams(filters as any);
  // const response = await fetch(`${API_BASE}/hostels/${hostelId}/transfers/available-rooms/?${queryParams}`);
  // return response.json();

  // Mock data for development
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `room-${i}`,
    hostelId: hostelId,
    hostelName: 'Sunshine Hostel',
    roomNumber: `${Math.floor(i / 4) + 2}0${(i % 4) + 1}`,
    roomType: (['single', 'double', 'double', 'triple', 'single'][i % 5] as any),
    floor: Math.floor(i / 4) + 2,
    basePrice: [8000, 12000, 12000, 15000, 10000][i % 5],
    currentPrice: [8000, 12000, 12000, 15000, 10000][i % 5],
    priceDifference: [8000, 12000, 12000, 15000, 10000][i % 5] - 12000,
    capacity: [1, 2, 2, 3, 1][i % 5],
    currentOccupancy: i % 2,
    amenities: ['Desk', 'Chair', 'Bed', 'Wardrobe', 'Window'],
    images: [
      `/images/grid-image/grid-${(i % 8) + 1}.jpg`,
      `/images/grid-image/grid-${((i + 1) % 8) + 1}.jpg`,
    ],
    distanceToWashroom: (i % 3) + 1,
    isQuietFloor: i % 3 === 0,
    availableFrom: new Date(Date.now() + (i % 30) * 24 * 60 * 60 * 1000),
    currentRoommate: i % 2 === 0 ? {
      id: `roommate-${i}`,
      userId: `user-${i}`,
      name: ['Alice Johnson', 'Bob Smith', 'Carol White'][i % 3],
      avatar: `/images/grid-image/grid-${(i % 4) + 1}.jpg`,
      program: 'Computer Science',
      year: '3rd Year',
      compatibilityScore: 75 + (i % 20),
      sleepSchedule: (['early_bird', 'night_owl', 'flexible'][i % 3] as any),
      cleanliness: (['neat', 'ocd_level', 'average'][i % 3] as any),
      noiseTolerance: (['silent', 'moderate', 'background_chatter'][i % 3] as any),
    } : undefined,
    transferEligible: true,
  }));
};

/**
 * Get transfer policy for a specific hostel
 */
export const getTransferPolicy = async (hostelId: string): Promise<TransferPolicy> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE}/hostels/${hostelId}/transfer-policy/`);
  // return response.json();

  // Mock data for development
  return {
    hostelId: hostelId,
    hostelName: 'Sunshine Hostel',
    transferFee: 500,
    allowedPeriods: ['start_of_semester', 'mid_semester', 'anytime'],
    minDaysNotice: 14,
    maxTransfersPerYear: 2,
    requiresCaretakerApproval: true,
    requiresLandlordApproval: false,
    averageProcessingDays: 5,
    additionalRules: 'Transfer requests are reviewed within 5 business days. Fees are non-refundable.',
  };
};

/**
 * Create a new transfer request
 */
export const createTransferRequest = async (
  hostelId: string,
  data: {
    bookingId: string;
    fromRoomId: string;
    toRoomId: string;
    reason: TransferReason;
    reasonDetails?: string;
    transferDate: Date;
  }
): Promise<TransferRequest> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE}/hostels/${hostelId}/transfers/request/`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // return response.json();

  // Mock response for development
  return {
    id: `trans-${Date.now()}`,
    hostelId: hostelId,
    bookingId: data.bookingId,
    fromRoomId: data.fromRoomId,
    toRoomId: data.toRoomId,
    requesterId: 'student-123',
    reason: data.reason,
    reasonDetails: data.reasonDetails,
    proposedTransferDate: data.transferDate,
    status: 'pending',
    priceDifference: 0,
    createdAt: new Date(),
  };
};

/**
 * Cancel a pending transfer request
 */
export const cancelTransferRequest = async (
  hostelId: string,
  transferId: string
): Promise<void> => {
  // TODO: Replace with actual API call
  // await fetch(`${API_BASE}/hostels/${hostelId}/transfers/${transferId}/cancel/`, {
  //   method: 'DELETE',
  // });

  console.log(`Cancelled transfer ${transferId} in hostel ${hostelId}`);
};

/**
 * Update existing transfer functions to maintain backward compatibility
 */
export const getTransfers = async (): Promise<TransferRequest[]> => {
  // This function is kept for backward compatibility
  // In production, always use getMyTransfers with hostelId
  return getMyTransfers('default-hostel');
};

export const updateTransferStatus = async (
  id: string,
  status: TransferRequest['status']
): Promise<void> => {
  console.log(`Updated transfer ${id} to ${status}`);
};
