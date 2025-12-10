import { z } from 'zod';

export const idSchema = z.string().uuid();

export const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

export const priceSchema = z.number().positive();
