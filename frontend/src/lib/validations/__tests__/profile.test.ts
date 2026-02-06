/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals';
import { studentProfileSchema } from '../profile.schema';

describe('Profile Validation Schemas', () => {
  const validStudentProfile = {
    institution: 'University of Nairobi',
    course: 'Computer Science',
    yearOfStudy: 3,
    studentId: 'CIT-001',
    emergencyContact: '+254712345678',
    emergencyContactName: 'John Doe',
  };

  describe('studentProfileSchema', () => {
    it('should validate a valid student profile', () => {
      const result = studentProfileSchema.safeParse(validStudentProfile);
      expect(result.success).toBe(true);
    });

    it('should fail if institution is missing', () => {
      const { institution, ...invalidProfile } = validStudentProfile;
      const result = studentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should fail if studentId is missing', () => {
      const { studentId, ...invalidProfile } = validStudentProfile;
      const result = studentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid phone number', () => {
      const invalidProfile = { ...validStudentProfile, emergencyContact: 'not-a-phone' };
      const result = studentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should fail if yearOfStudy is out of range', () => {
      const invalidProfile = { ...validStudentProfile, yearOfStudy: 8 };
      const result = studentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });
});
