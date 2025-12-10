/**
 * Transfer business rules and constants
 */

import { TransferReason } from '@/types/entities.types';

export const TRANSFER_REASONS: Record<TransferReason, { label: string; icon: string; description: string }> = {
  better_environment: {
    label: 'Better Environment',
    icon: '🌟',
    description: 'Need a more conducive living or study environment',
  },
  roommate_conflict: {
    label: 'Roommate Conflict',
    icon: '👥',
    description: 'Incompatibility or issues with current roommate',
  },
  noise_issues: {
    label: 'Noise Issues',
    icon: '🔇',
    description: 'Current room is too noisy for studying or sleeping',
  },
  upgrade: {
    label: 'Upgrade Room',
    icon: '⬆️',
    description: 'Moving to a higher quality or larger room',
  },
  downgrade: {
    label: 'Downgrade Room',
    icon: '⬇️',
    description: 'Moving to a more affordable room option',
  },
  other: {
    label: 'Other Reason',
    icon: '✏️',
    description: 'Specify your reason for the transfer',
  },
};

export const ROOM_TYPES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  TRIPLE: 'triple',
  QUAD: 'quad',
} as const;

export const ROOM_TYPE_LABELS: Record<string, string> = {
  single: 'Single Room',
  double: 'Double Room',
  triple: 'Triple Room',
  quad: 'Quad Room',
};

export const ROOMMATE_PREFERENCES = {
  SAME: 'same',
  NEW: 'new',
  ANY: 'any',
} as const;

export const ROOMMATE_PREFERENCE_LABELS: Record<string, string> = {
  same: 'Keep Current Roommate',
  new: 'Find New Roommate',
  any: 'No Preference',
};

// Microservice constants
export const TRANSFER_POLICY_DEFAULTS = {
  transferFee: 500,
  minDaysNotice: 14,
  maxTransfersPerYear: 2,
  averageProcessingDays: 7,
  requiresCaretakerApproval: true,
  requiresLandlordApproval: false,
};

// UI constants
export const MAX_TRANSFER_REQUESTS_PER_HOSTEL = 1; // One active request per hostel
export const TRANSFER_REQUEST_EXPIRY_DAYS = 30; // Auto-expire after 30 days if no response
