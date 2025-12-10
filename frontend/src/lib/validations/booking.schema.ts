import { z } from 'zod';


export const createBookingSchema = z.object({
  roomId: z.string().min(1, 'Room is required'),
  checkInDate: z.date({
    message: 'Check-in date is required',
  }),
  checkOutDate: z.date({
    message: 'Check-out date is required',
  }),
  numberOfGuests: z.number().min(1, 'At least one guest is required').max(10),
  specialRequests: z.string().optional(),
  paymentMethodId: z.string().optional(),
}).refine((data) => data.checkOutDate > data.checkInDate, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOutDate'],
});

export const updateBookingSchema = z.object({
  checkInDate: z.date().optional(),
  checkOutDate: z.date().optional(),
  numberOfGuests: z.number().min(1).max(10).optional(),
  specialRequests: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
});

export const cancelBookingSchema = z.object({
  cancellationReason: z.string().min(10, 'Please provide a reason (min 10 characters)'),
});

export const extendBookingSchema = z.object({
  newCheckOutDate: z.date({
    message: 'New check-out date is required',
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type ExtendBookingInput = z.infer<typeof extendBookingSchema>;

export const bookingSchema = {
  create: createBookingSchema,
  update: updateBookingSchema,
  cancel: cancelBookingSchema,
  extend: extendBookingSchema,
};
