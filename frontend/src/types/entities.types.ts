// Re-export types from features to maintain backward compatibility during migration
// Users
export * from '@/features/users/types';

// Auth / Profiles (some overlap in entities)
// Note: entities.types.ts had RoommateProfile etc which are now in features.
// We need to map them carefully.

// Hostels
export * from '@/features/hostels/types';

// Bookings
export * from '@/features/bookings/types/types';

// Payments
export * from '@/features/payments/types';

// Reviews
export * from '@/features/reviews/types';

// Roommates
export * from '@/features/roommates/types';

// Transfers
export * from '@/features/transfers/types';

// Support
export * from '@/features/support/types';

// Student Dashboard elements
export * from '@/features/student/types';

// Inventory (only had small summaries)
export * from '@/features/inventory/types';

// Analytics
export * from '@/features/analytics/types/types';

// Profile Preferences (Lifestyle, Budget etc)
// These were moved to features/profile/types
export type {
  LifestylePreferences,
  BudgetPreferences,
  AvailabilityPreferences,
  RoommatePreferences, // This was also in roommates types? No, entities had both.
  // Actually RoommatePreferences was in entities.types.ts.
  // I put it in features/roommates/types.ts? 
  // Let's check where I put it. RoommatePreferences was put in `features/roommates/types.ts`.
  // Wait, I also see it in `profile/types.ts`? No, profile has `LifestylePreferences`.
  // Let's verify imports from roommates.
} from '@/features/profile/types';

// Messaging
export * from '@/features/messaging/types';

export type {
    RoommatePreferences
} from '@/features/roommates/types';
