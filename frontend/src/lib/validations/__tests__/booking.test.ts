/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals';
import { createBookingSchema } from '../booking.schema';
import { addDays } from 'date-fns';

describe('Booking Validation Schemas', () => {
  const validBooking = {
    roomId: 'room-123',
    checkInDate: new Date(),
    checkOutDate: addDays(new Date(), 30),
    numberOfGuests: 1,
  };

  describe('createBookingSchema', () => {
    it('should validate a valid booking', () => {
      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it('should fail if roomId is missing', () => {
      const { roomId, ...invalidBooking } = validBooking as any;
      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it('should fail if checkOutDate is before checkInDate', () => {
      const invalidBooking = {
        ...validBooking,
        checkInDate: addDays(new Date(), 10),
        checkOutDate: new Date(),
      };
      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Check-out date must be after check-in date');
      }
    });

    it('should fail if numberOfGuests is less than 1', () => {
      const invalidBooking = { ...validBooking, numberOfGuests: 0 };
      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it('should fail if numberOfGuests exceeds 10', () => {
      const invalidBooking = { ...validBooking, numberOfGuests: 11 };
      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });
  });
});
