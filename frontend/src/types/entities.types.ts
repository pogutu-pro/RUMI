// Re-export types from features to maintain backward compatibility during migration
export * from '@/features/users/types';

export type {
  LifestylePreferences,
  BudgetPreferences,
  AvailabilityPreferences,
} from '@/features/profile/types';
