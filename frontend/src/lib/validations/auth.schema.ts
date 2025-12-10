import { z } from 'zod';

export const ROLES = {
  STUDENT: 'student',
  LANDLORD: 'landlord',
  CARETAKER: 'caretaker',
} as const;

const emptyStringToUndefined = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === '' ? undefined : val));

const requiredString = (min: number, max: number = 255, label = 'Field') =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} is too long`);

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform((s) => s.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

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

const nameSchema = requiredString(2, 50, 'Name').regex(
  /^[a-zA-Z\s'-]+$/,
  'Name can only contain letters, spaces, hyphens, and apostrophes',
);

const otpSchema = z
  .string()
  .trim()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^[0-9]+$/, 'OTP can only contain numbers');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

const baseRegisterFields = {
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  agreeToTerms: z
    .boolean()
    .refine((val) => val, {
      message: 'You must agree to the terms and conditions',
    }),
};

const passwordMatchRefinement = (data: {
  password: string;
  confirmPassword: string;
}) => data.password === data.confirmPassword;

const passwordMatchOptions = {
  message: "Passwords don't match",
  path: ['confirmPassword'],
};

export const registerStudentSchema = z
  .object({
    ...baseRegisterFields,
    role: z.literal(ROLES.STUDENT),
    university: requiredString(2, 100, 'University name'),
    studentIdNumber: requiredString(3, 50, 'Student ID').regex(
      /^[A-Z0-9/-]+$/i,
      'Invalid Student ID format',
    ),
    yearOfStudy: z
      .number()
      .int()
      .min(1, 'Year must be at least 1')
      .max(7, 'Year must not exceed 7'),
    course: requiredString(2, 100, 'Course name').optional(),
  })
  .refine(passwordMatchRefinement, passwordMatchOptions);

export type RegisterStudentFormData = z.infer<typeof registerStudentSchema>;

export const registerLandlordSchema = z
  .object({
    ...baseRegisterFields,
    role: z.literal(ROLES.LANDLORD),
    nationalId: requiredString(6, 20, 'National ID').regex(
      /^[a-zA-Z0-9]+$/,
      'Invalid National ID format',
    ),
    businessName: requiredString(2, 100, 'Business Name'),
    bankName: requiredString(2, 100, 'Bank Name'),
    bankAccountNumber: z
      .string()
      .min(10, 'Account number too short')
      .max(20, 'Account number too long')
      .regex(/^[0-9]+$/, 'Account number must contain only digits'),
    kraPin: emptyStringToUndefined.pipe(
      z
        .string()
        .regex(/^[A-Z]\d{9}[A-Z]$/, 'Invalid KRA PIN format')
        .optional(),
    ),
  })
  .refine(passwordMatchRefinement, passwordMatchOptions);

export type RegisterLandlordFormData = z.infer<typeof registerLandlordSchema>;

export const registerCaretakerSchema = z
  .object({
    ...baseRegisterFields,
    role: z.literal(ROLES.CARETAKER),
    hostelId: z.string().uuid('Invalid Hostel ID').optional(),
    employmentStartDate: z.coerce.date().optional(),
    nationalId: requiredString(6, 20, 'National ID')
      .regex(/^[0-9]+$/, 'National ID must contain only digits')
      .optional(),
  })
  .refine(passwordMatchRefinement, passwordMatchOptions);

export type RegisterCaretakerFormData = z.infer<typeof registerCaretakerSchema>;

export const registerSchema = z.discriminatedUnion('role', [
  registerStudentSchema,
  registerLandlordSchema,
  registerCaretakerSchema,
]);

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is missing'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(passwordMatchRefinement, passwordMatchOptions);

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  email: emailSchema.optional(),
  otp: otpSchema,
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export const verifyPhoneSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export type VerifyPhoneFormData = z.infer<typeof verifyPhoneSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    passwordMatchOptions,
  )
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const lifestylePreferencesSchema = z.object({
  sleepSchedule: z.enum(['early_bird', 'night_owl', 'flexible']).optional(),
  cleanliness: z.enum(['very_clean', 'moderate', 'relaxed']).optional(),
  smoking: z.boolean().optional(),
  guests: z.enum(['frequent', 'occasional', 'rare']).optional(),
  personalityType: z.enum(['introvert', 'extrovert', 'ambivert']).optional(),
  socialFrequency: z
    .enum(['daily', 'weekly', 'monthly', 'sporadic'])
    .optional(),
  dealbreakers: z.array(z.string()).optional(),
});

export type LifestylePreferencesFormData = z.infer<
  typeof lifestylePreferencesSchema
>;

export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  profileImage: z.union([z.string().url(), z.literal('')]).optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const updateStudentProfileSchema = updateProfileSchema.extend({
  university: z.string().min(2).max(100).optional(),
  yearOfStudy: z.coerce.number().min(1).max(7).optional(),
  emergencyContact: z
    .object({
      name: nameSchema,
      relationship: requiredString(2, 50, 'Relationship'),
      phone: phoneSchema,
    })
    .optional(),
  preferences: lifestylePreferencesSchema.optional(),
});

export type UpdateStudentProfileFormData = z.infer<
  typeof updateStudentProfileSchema
>;

export const updateLandlordProfileSchema = updateProfileSchema.extend({
  bankAccountNumber: z
    .string()
    .min(10)
    .max(20)
    .regex(/^[0-9]+$/)
    .optional(),
  bankName: z.string().min(2).max(100).optional(),
  businessLicense: emptyStringToUndefined,
});

export type UpdateLandlordProfileFormData = z.infer<
  typeof updateLandlordProfileSchema
>;
