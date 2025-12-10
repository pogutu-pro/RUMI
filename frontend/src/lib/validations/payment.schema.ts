import { z } from 'zod';

export const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['mpesa', 'bank']),
  transactionId: z.string().optional(),
});
