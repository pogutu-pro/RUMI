import { z } from 'zod';

export const hostelSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  address: z.string().min(5),
  lat: z.number(),
  lng: z.number(),
  distanceToCampus: z.number().positive(),
  pricePerMonth: z.number().positive(),
  amenities: z.array(z.string()),
  images: z.array(z.string().url()),
  houseRules: z.string().optional(),
});
