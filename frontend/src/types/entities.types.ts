// Re-export types from features to maintain backward compatibility during migration
// Users
export * from '@/features/users/types';



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
export * from '@/features/support/types/types';

// Student Dashboard elements
export * from '@/features/student/types';

// Inventory (only had small summaries)
export * from '@/features/inventory/types';

// Analytics
export * from '@/features/analytics/types/types';

export type {
  LifestylePreferences,
  BudgetPreferences,
  AvailabilityPreferences,
} from '@/features/profile/types';
