import { z } from 'zod';

/**
 * Roommate validation schemas
 */

export const roommatePreferencesSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  isLookingForRoommate: z.boolean(),
  preferredGender: z.enum(['male', 'female', 'any']).optional(),
  ageRange: z.string().optional(),
  interests: z.string().optional(),
  sleepSchedule: z.enum(['early', 'late', 'flexible']).optional(),
  cleanliness: z.enum(['very_clean', 'clean', 'moderate']).optional(),
  socialLevel: z.enum(['very_social', 'social', 'quiet']).optional(),
  smokingAllowed: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  guestsAllowed: z.boolean().optional(),
  musicPreference: z.enum(['quiet', 'moderate', 'loud']).optional(),
  studyHabits: z.enum(['library', 'room', 'flexible']).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: 'Maximum budget must be greater than minimum budget',
    path: ['budgetMax'],
  }
);

export const sendRoommateRequestSchema = z.object({
  roommateId: z.string().min(1, 'Roommate ID is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const respondToRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  response: z.enum(['accept', 'reject']),
  message: z.string().optional(),
});

export const searchRoommatesSchema = z.object({
  minBudget: z.number().min(0).optional(),
  maxBudget: z.number().min(0).optional(),
  location: z.string().optional(),
  minCompatibilityScore: z.number().min(0).max(100).optional(),
});

export type RoommatePreferencesInput = z.infer<typeof roommatePreferencesSchema>;
export type SendRoommateRequestInput = z.infer<typeof sendRoommateRequestSchema>;
export type RespondToRequestInput = z.infer<typeof respondToRequestSchema>;
export type SearchRoommatesInput = z.infer<typeof searchRoommatesSchema>;

export const roommateSchema = {
  preferences: roommatePreferencesSchema,
  sendRequest: sendRoommateRequestSchema,
  respondToRequest: respondToRequestSchema,
  search: searchRoommatesSchema,
};
