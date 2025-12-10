import { z } from 'zod';

export const roomSchema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
  beds: z.number().int().positive(),
  capacity: z.number().int().positive(),
  images: z.array(z.string().url()),
  available: z.boolean(),
});
