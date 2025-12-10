'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

export default function Loading() {
  const reducedMotion = useReducedMotion();

  const containerVariants: Variants = useMemo(() => {
    if (reducedMotion) return { initial: {}, animate: {} };

    return {
      initial: { opacity: 0, y: 8 },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        },
      },
    };
  }, [reducedMotion]);

  const pulseVariants: Variants = useMemo(() => {
    if (reducedMotion) return { animate: {} };

    return {
      animate: {
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1] as const,
        },
      },
    };
  }, [reducedMotion]);

  const dotVariants: Variants = {
    animate: {
      y: ['0%', '-50%', '0%'],
    },
  };

  const dotTransition = {
    duration: 0.6,
    repeat: Infinity,
    ease: [0.4, 0, 0.2, 1] as const,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading content"
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background px-4"
    >
      <motion.div
        initial="initial"
        animate="animate"
        variants={containerVariants}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          variants={pulseVariants}
          className="relative flex items-center justify-center"
        >
          {/* Background accent */}
          <div className="absolute h-20 w-20 rounded-full bg-primary/10" />

          {/* Loader */}
          <Loader2
            className="relative h-10 w-10 animate-spin text-primary"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </motion.div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-base font-medium text-foreground">
            Preparing your RUMI experience
          </p>
          <p className="text-center text-sm text-muted-foreground">
            This will only take a moment...
          </p>
        </div>

        {/* Animated dots */}
        {!reducedMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-primary/40"
                variants={dotVariants}
                animate="animate"
                transition={{
                  ...dotTransition,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      <span className="sr-only">Loading page content, please wait</span>
    </div>
  );
}
