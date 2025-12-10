import { z } from 'zod';

// Reuse validators from auth schema
const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform((s) => s.toLowerCase());

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\s+/g, ''))
  .pipe(
    z
      .string()
      .min(10, 'Phone number too short')
      .max(13, 'Phone number too long')
      .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number format'),
  );

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes',
  );

/**
 * Schema for landlord creating a caretaker account
 */
export const landlordCreateCaretakerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  hostelId: z.string().uuid('Please select a valid hostel'),
  permissions: z.object({
    canManageInventory: z.boolean(),
    canHandleReports: z.boolean(),
    canViewPayments: z.boolean(),
    canManageBookings: z.boolean(),
    canCommunicateWithTenants: z.boolean(),
  }),
  sendInvitationEmail: z.boolean(),
});

export type LandlordCreateCaretakerFormData = z.infer<typeof landlordCreateCaretakerSchema>;

/**
 * Schema for updating caretaker details
 */
export const landlordUpdateCaretakerSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  hostelId: z.string().uuid().optional(),
  permissions: z.object({
    canManageInventory: z.boolean(),
    canHandleReports: z.boolean(),
    canViewPayments: z.boolean(),
    canManageBookings: z.boolean(),
    canCommunicateWithTenants: z.boolean(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export type LandlordUpdateCaretakerFormData = z.infer<typeof landlordUpdateCaretakerSchema>;
