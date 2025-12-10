import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '@/components/ui/button';
import type { cardVariants } from '@/components/ui/card';

export type ButtonVariant = VariantProps<typeof buttonVariants>;
export type CardVariant = VariantProps<typeof cardVariants>;

// Add more UI variant types as needed
