// src/types/forms.types.ts
import type { z } from 'zod';
import type { hostelSchema } from '@/lib/validations/hostel.schema';
import type { roomSchema } from '@/lib/validations/room.schema';
import type { reviewSchema } from '@/lib/validations/review.schema';
import type { bookingSchema } from '@/lib/validations/booking.schema';

export type HostelFormData = z.infer<typeof hostelSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
