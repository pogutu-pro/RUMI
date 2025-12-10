'use client';

import { Variants, useReducedMotion, motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

// Animation variants
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      when: 'beforeChildren',
      staggerDirection: 1,
    },
  },
};

// Reusable animation components
interface AnimatedSectionProps extends Omit<HTMLMotionProps<'section'>, 'initial' | 'variants' | 'viewport'> {
  children: ReactNode;
  variant?: 'fadeUp' | 'stagger';
  viewport?: {
    once?: boolean;
    amount?: number | 'some' | 'all';
    margin?: string;
  };
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children, 
  variant = 'fadeUp',
  viewport = { once: true, amount: 0.1 },
  ...props 
}) => {
  const variants = variant === 'fadeUp' ? fadeUp : staggerContainer;
  const reducedMotion = useReducedMotion() ?? false;
  const motionVariants = withReducedMotion(variants, reducedMotion);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      // @ts-ignore - viewport is a valid prop
      viewport={viewport}
      variants={motionVariants}
      {...props}
    >
      {children}
    </motion.section>
  );
};

AnimatedSection.displayName = 'AnimatedSection';

// Animated Card component for dashboard previews and features
interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'variants'> {
  children: ReactNode;
  custom?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, custom, ...props }, ref) => {
    const reducedMotion = useReducedMotion() ?? false;
    const motionVariants = withReducedMotion(fadeUp, reducedMotion);

    return (
      <motion.div
        ref={ref}
        custom={custom}
        initial="hidden"
        whileInView="visible"
        variants={motionVariants}
        viewport={{ once: true }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Utility function to handle reduced motion preferences
function withReducedMotion(
  variants: Variants,
  reducedMotion: boolean,
): Variants {
  if (!reducedMotion) return variants;

  const accessibleVariants: Variants = {};
  for (const key in variants) {
    accessibleVariants[key] = {
      ...variants[key],
      transition: { duration: 0 },
    };
    if ('filter' in accessibleVariants[key]) {
      delete accessibleVariants[key].filter;
    }
  }
  return accessibleVariants;
}

// Animation variants hook for more complex scenarios
export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0)',
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function useStaggerChildVariants() {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };
}

export function useFadeInVariants() {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };
}

export function useScaleUpVariants() {
  return {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };
}

export function useSlideUpVariants() {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };
}
