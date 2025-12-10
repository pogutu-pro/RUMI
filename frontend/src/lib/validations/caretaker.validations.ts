import { z } from 'zod';

// ==================== Check-In Validation ====================

export const checkInSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  bookingCode: z.string().min(1, 'Booking code is required'),
  roomId: z.string().uuid('Invalid room ID'),
  bedNumber: z.string().optional(),
  actualCheckInDate: z.string().datetime('Invalid date format'),
  identityVerified: z.boolean().refine((val) => val === true, {
    message: 'Identity must be verified',
  }),
  bookingVerified: z.boolean().refine((val) => val === true, {
    message: 'Booking must be verified',
  }),
  photoProof: z.array(z.string().url()).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

// ==================== Check-Out Validation ====================

export const checkOutSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  roomId: z.string().uuid('Invalid room ID'),
  actualCheckOutDate: z.string().datetime('Invalid date format'),
  reason: z.enum(['semester_end', 'transfer', 'graduation', 'voluntary', 'eviction', 'other']),
  reasonDetails: z.string().max(500).optional(),
  roomCondition: z.enum(['clean', 'needs_cleaning', 'damaged']),
  damages: z.array(
    z.object({
      type: z.enum(['furniture', 'appliance', 'wall', 'floor', 'window', 'door', 'other']),
      description: z.string().min(1, 'Damage description is required').max(500),
      severity: z.enum(['minor', 'moderate', 'severe']),
      photos: z.array(z.string().url()).min(1, 'At least one photo is required for each damage'),
    })
  ).optional(),
  photoProof: z.array(z.string().url()).optional(),
  notes: z.string().max(1000).optional(),
});

export type CheckOutFormData = z.infer<typeof checkOutSchema>;

// ==================== Damage Report Validation ====================

export const damageReportSchema = z.object({
  type: z.enum(['furniture', 'appliance', 'wall', 'floor', 'window', 'door', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  severity: z.enum(['minor', 'moderate', 'severe']),
  photos: z.array(z.instanceof(File)).min(1, 'At least one photo is required'),
});

export type DamageReportFormData = z.infer<typeof damageReportSchema>;

// ==================== Room Assignment Validation ====================

export const roomAssignmentSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  tenantId: z.string().uuid('Invalid tenant ID'),
  bedNumber: z.string().optional(),
  assignedDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export type RoomAssignmentFormData = z.infer<typeof roomAssignmentSchema>;

// ==================== Maintenance Request Validation ====================

export const maintenanceRequestSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  category: z.enum(['plumbing', 'electrical', 'furniture', 'appliance', 'structural', 'cleaning', 'other']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  photosBefore: z.array(z.instanceof(File)).optional(),
});

export type MaintenanceRequestFormData = z.infer<typeof maintenanceRequestSchema>;

// ==================== Visitor Log Validation ====================

export const visitorLogSchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required').max(100),
  visitorPhone: z.string().optional(),
  visitorIdNumber: z.string().optional(),
  tenantId: z.string().uuid('Invalid tenant ID'),
  tenantName: z.string().min(1),
  roomNumber: z.string().min(1, 'Room number is required'),
  purpose: z.string().min(1, 'Purpose of visit is required').max(200),
  timeIn: z.string().datetime('Invalid time format'),
  notes: z.string().max(500).optional(),
});

export type VisitorLogFormData = z.infer<typeof visitorLogSchema>;

// ==================== Night Check Report Validation ====================

export const nightCheckReportSchema = z.object({
  checkDate: z.string().datetime('Invalid date format'),
  checkTime: z.string().datetime('Invalid time format'),
  floorsChecked: z.array(z.number()).min(1, 'At least one floor must be checked'),
  issues: z.array(
    z.object({
      type: z.enum(['noise', 'unauthorized_visitor', 'safety_hazard', 'security_breach', 'other']),
      location: z.string().min(1, 'Location is required').max(100),
      description: z.string().min(1, 'Description is required').max(500),
      severity: z.enum(['low', 'medium', 'high']),
      actionTaken: z.string().min(1, 'Action taken is required').max(300),
      timestamp: z.string().datetime(),
    })
  ).optional(),
  totalTenantsPresent: z.number().int().min(0),
  totalTenantsAbsent: z.number().int().min(0),
  notes: z.string().max(1000).optional(),
});

export type NightCheckReportFormData = z.infer<typeof nightCheckReportSchema>;

// ==================== Late Entry Log Validation ====================

export const lateEntryLogSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  tenantName: z.string().min(1),
  roomNumber: z.string().min(1, 'Room number is required'),
  entryTime: z.string().datetime('Invalid time format'),
  reason: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

export type LateEntryLogFormData = z.infer<typeof lateEntryLogSchema>;

// ==================== Roommate Assignment Validation ====================

export const roommateAssignmentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  roomId: z.string().uuid('Invalid room ID'),
  roommateIds: z.array(z.string().uuid()).min(0),
  assignedDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export type RoommateAssignmentFormData = z.infer<typeof roommateAssignmentSchema>;
