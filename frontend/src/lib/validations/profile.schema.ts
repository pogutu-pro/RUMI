import { z } from 'zod';

/**
 * Profile validation schemas
 */

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  dateOfBirth: z.date().optional(),
});

export const studentProfileSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  course: z.string().min(1, 'Course is required'),
  yearOfStudy: z.number().min(1).max(7),
  studentId: z.string().min(1, 'Student ID is required'),
  emergencyContact: z.string().regex(phoneRegex, 'Invalid phone number'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
});

export const landlordProfileSchema = z.object({
  companyName: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  taxPin: z.string().optional(),
  numberOfProperties: z.number().min(0),
  bankAccount: z.string().optional(),
  bio: z.string().max(1000).optional(),
});

export const caretakerProfileSchema = z.object({
  yearsOfExperience: z.number().min(0),
  specializations: z.string().optional(),
  certifications: z.string().optional(),
  availability: z.string().optional(),
});

export const uploadProfileImageSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be JPEG, PNG, or WebP'
    ),
});

export const bankDetailsSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Invalid account number'),
  accountName: z.string().min(1, 'Account name is required'),
  branchCode: z.string().optional(),
  swiftCode: z.string().optional(),
});

export const lifestylePreferencesSchema = z.object({
  sleepSchedule: z.enum(['early', 'late', 'flexible']),
  cleanliness: z.enum(['very_clean', 'clean', 'moderate']),
  socialLevel: z.enum(['very_social', 'social', 'quiet']),
  smokingAllowed: z.boolean(),
  petsAllowed: z.boolean(),
  guestsAllowed: z.boolean(),
  musicPreference: z.enum(['quiet', 'moderate', 'loud']),
  studyHabits: z.enum(['library', 'room', 'flexible']),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type LandlordProfileInput = z.infer<typeof landlordProfileSchema>;
export type CaretakerProfileInput = z.infer<typeof caretakerProfileSchema>;
export type UploadProfileImageInput = z.infer<typeof uploadProfileImageSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type LifestylePreferencesInput = z.infer<typeof lifestylePreferencesSchema>;

export const profileSchema = {
  update: updateProfileSchema,
  student: studentProfileSchema,
  landlord: landlordProfileSchema,
  caretaker: caretakerProfileSchema,
  uploadImage: uploadProfileImageSchema,
  bankDetails: bankDetailsSchema,
  lifestylePreferences: lifestylePreferencesSchema,
};
