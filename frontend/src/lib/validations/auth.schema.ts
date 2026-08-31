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

export const passwordSchema = z
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

const commonRegisterFields = {
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
  first_name: nameSchema,
  last_name: nameSchema,
  phone_number: phoneSchema,
  agree_to_terms: z.boolean().default(true),
};

const studentIdentityFields = {
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select your gender',
  }),
  date_of_birth: z.union([z.string(), z.date()], {
    message: 'Please enter a valid date of birth',
  }).refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Please enter a valid date of birth').refine((val) => {
    const date = new Date(val);
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 16;
  }, 'You must be at least 16 years old to register'),
};

const passwordMatchRefinement = (data: any) => data.password === data.confirm_password;

const passwordMatchOptions = {
  message: "Passwords don't match",
  path: ['confirm_password'],
};

export const registerStudentSchema = z
  .object({
    ...commonRegisterFields,
    ...studentIdentityFields,
    role: z.literal(ROLES.STUDENT),
    university: requiredString(2, 100, 'University name'),
    preferred_hostel_id: z.coerce.number().int().optional(),
    room_number: z.string().max(20).optional(),
  })
  .refine(passwordMatchRefinement, passwordMatchOptions);

export type RegisterStudentFormData = z.infer<typeof registerStudentSchema>;

export const registerLandlordSchema = z
  .object({
    ...commonRegisterFields,
    role: z.literal(ROLES.LANDLORD),
    company_name: requiredString(2, 100, 'Property Name'),
    total_units: z.coerce.number().int().min(0).optional(),
  })
  .refine(passwordMatchRefinement, passwordMatchOptions);

export type RegisterLandlordFormData = z.infer<typeof registerLandlordSchema>;

export const registerCaretakerSchema = z
  .object({
    ...commonRegisterFields,
    role: z.literal(ROLES.CARETAKER),
    hostel_id: z.string().uuid('Invalid Hostel ID').optional(),
    employment_start_date: z.coerce.date().optional(),
    national_id: requiredString(6, 20, 'National ID')
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

/**
 * Schema for completing identity after Google OAuth role selection
 */
export const googleCompleteSchema = z.object({
  role: z.enum([ROLES.STUDENT, ROLES.LANDLORD]),
  gender: z.enum(['male', 'female', 'other']).optional(),
  date_of_birth: z.union([z.string(), z.date()]).optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 16;
  }, 'You must be at least 16 years old'),
  phone_number: phoneSchema.optional(),
  // Student fields
  university: z.string().min(2, 'University name is required').optional(),
  preferred_hostel_id: z.coerce.number().int().optional(),
  room_number: z.string().max(20).optional(),
  // Landlord fields
  company_name: z.string().optional(),
  total_units: z.coerce.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.role === ROLES.STUDENT) {
    if (!data.university || data.university.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "University name is required",
        path: ["university"],
      });
    }
    if (!data.gender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gender is required",
        path: ["gender"],
      });
    }
    if (!data.date_of_birth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of birth is required",
        path: ["date_of_birth"],
      });
    }
  }

  if (data.role === ROLES.LANDLORD) {
    if (!data.company_name || data.company_name.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Property/Company name is required",
        path: ["company_name"],
      });
    }
  }
});

export type GoogleCompleteFormData = z.infer<typeof googleCompleteSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is missing'),
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your password'),
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
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(
    (data) => data.new_password === data.confirm_password,
    {
      message: "Passwords don't match",
      path: ['confirm_password'],
    },
  )
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
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
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  phone_number: phoneSchema.optional(),
  profile_picture: z.union([z.string().url(), z.literal('')]).optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const updateStudentProfileSchema = updateProfileSchema.extend({
  university: z.string().min(2).max(100).optional(),
  year_of_study: z.coerce.number().min(1).max(7).optional(),
  emergency_contact_name: nameSchema.optional(),
  emergency_contact_phone: phoneSchema.optional(),
  emergency_contact_relationship: requiredString(2, 50, 'Relationship').optional(),
  preferences: lifestylePreferencesSchema.optional(),
});

export type UpdateStudentProfileFormData = z.infer<
  typeof updateStudentProfileSchema
>;

export const updateLandlordProfileSchema = updateProfileSchema.extend({
  bank_account_number: z
    .string()
    .min(10)
    .max(20)
    .regex(/^[0-9]+$/)
    .optional(),
  bank_name: z.string().min(2).max(100).optional(),
  business_license: emptyStringToUndefined,
});

export type UpdateLandlordProfileFormData = z.infer<
  typeof updateLandlordProfileSchema
>;

export const studentOnboardingSchema = z.object({
  university: requiredString(2, 100, 'University Name'),
  student_id_number: requiredString(2, 50, 'Student ID Number')
    .regex(/^[a-zA-Z0-9-/]+$/, 'Student ID can only contain letters, numbers, hyphens, and slashes'),
  year_of_study: z.number().int().min(1, 'Year 1 minimum').max(6, 'Year 6 maximum'),
  course: requiredString(2, 100, 'Course Name'),
  campus: requiredString(2, 100, 'Campus Name').optional(),
  high_school: requiredString(2, 100, 'High School').optional(),
  graduation_year: z.number().min(2020).max(2035).optional(),
  phone_number: phoneSchema,
  date_of_birth: z.date().refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 16;
  }, 'You must be at least 16 years old'),
  emergency_contact_name: nameSchema,
  emergency_contact_phone: phoneSchema,
  emergency_contact_relationship: requiredString(2, 50, 'Relationship'),
});

export type StudentOnboardingFormData = z.infer<typeof studentOnboardingSchema>;

export const landlordOnboardingSchema = z.object({
  company_name: requiredString(2, 100, 'Property Name'),
  national_id: requiredString(5, 20, 'National ID')
    .regex(/^[0-9]+$/, 'National ID must contain only digits'),
  phone_number: phoneSchema,
  bank_name: requiredString(2, 100, 'Bank Name').optional(), // Optional for now
  bank_account_number: z.string().min(10).max(20).regex(/^[0-9]+$/).optional(), // Optional for now
});

export type LandlordOnboardingFormData = z.infer<typeof landlordOnboardingSchema>;

/**
 * Landlord onboarding wizard — org/property/payout step schemas (Phase 4,
 * Plan 03). Reuses the same `requiredString`/`phoneSchema` helpers as the
 * rest of this file rather than redefining validation rules.
 */
export const wizardOrgSchema = z.object({
  name: requiredString(2, 255, 'Organization name'),
});

export type WizardOrgFormData = z.infer<typeof wizardOrgSchema>;

export const wizardPropertySchema = z.object({
  name: requiredString(2, 255, 'Property name'),
  address: requiredString(5, 500, 'Address'),
  city: z.string().max(100).optional(),
});

export type WizardPropertyFormData = z.infer<typeof wizardPropertySchema>;

/**
 * Mirrors Backend/organizations/serializers.py
 * PayoutBankDetailsInputSerializer's max_length constraints exactly
 * (100/20/10) so client-side validation never accepts something the server
 * would 400 on.
 */
export const wizardPayoutSchema = z.object({
  bank_name: requiredString(2, 100, 'Bank name'),
  bank_account_number: z
    .string()
    .trim()
    .min(10, 'Account number too short')
    .max(20, 'Account number too long')
    .regex(/^[0-9]+$/, 'Account number must be numeric'),
  bank_code: requiredString(2, 10, 'Bank code'),
});

export type WizardPayoutFormData = z.infer<typeof wizardPayoutSchema>;
