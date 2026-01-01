import { z } from 'zod';

/**
 * Transfer validation schemas
 */

// Transfer reason enum
export const transferReasonEnum = z.enum([
  'better_environment',
  'roommate_conflict',
  'noise_issues',
  'upgrade',
  'downgrade',
  'other',
]);

// Create transfer request schema
export const createTransferSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  fromRoomId: z.string().min(1, 'Current room is required'),
  toRoomId: z.string().min(1, 'New room is required'),
  reason: transferReasonEnum,
  reasonDetails: z.string().optional(),
  transferDate: z.date({
    message: 'Transfer date is required',
  }).refine((date) => date > new Date(), {
    message: 'Transfer date must be in the future',
  }),
  acceptRoommateChange: z.boolean().optional(), // For shared rooms
}).refine(
  (data) => {
    // If reason is 'other', require reasonDetails
    if (data.reason === 'other' && (!data.reasonDetails || data.reasonDetails.length < 10)) {
      return false;
    }
    return true;
  },
  {
    message: 'Please provide details when selecting "Other" reason (minimum 10 characters)',
    path: ['reasonDetails'],
  }
);

// Filter available rooms schema
export const filterRoomsSchema = z.object({
  hostelId: z.string().min(1).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  roomTypes: z.array(z.enum(['single', 'double', 'triple', 'quad'])).optional(),
  floors: z.array(z.number()).optional(),
  quietFloorOnly: z.boolean().optional(),
  roommatePreference: z.enum(['same', 'new', 'any']).optional(),
  searchQuery: z.string().optional(),
});

export const approveTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  approvalNote: z.string().optional(),
});

export const rejectTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  rejectionReason: z.string().min(10, 'Please provide a reason for rejection'),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type FilterRoomsInput = z.infer<typeof filterRoomsSchema>;
export type ApproveTransferInput = z.infer<typeof approveTransferSchema>;
export type RejectTransferInput = z.infer<typeof rejectTransferSchema>;
export type TransferReasonType = z.infer<typeof transferReasonEnum>;

export const transferSchema = {
  create: createTransferSchema,
  filter: filterRoomsSchema,
  approve: approveTransferSchema,
  reject: rejectTransferSchema,
};
