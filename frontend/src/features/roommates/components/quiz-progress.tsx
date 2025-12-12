'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface QuizProgressProps {
  current: number;
  total: number;
  percentage: number;
  isComplete?: boolean;
  className?: string;
}

export function QuizProgress({
  current,
  total,
  percentage,
  isComplete = false,
  className,
}: QuizProgressProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    if (isComplete) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Confetti Celebration */}
      {showConfetti && width && height && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Question Counter */}
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-muted-foreground">
          Question {current} of {total}
        </span>
        <motion.span
          key={percentage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'font-bold',
            isComplete
              ? 'text-emerald-600'
              : percentage >= 50
              ? 'text-blue-600'
              : 'text-muted-foreground'
          )}
        >
          {percentage}%
        </motion.span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full relative',
            isComplete
              ? 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500'
              : 'bg-gradient-to-r from-emerald-500 to-blue-500'
          )}
        >
          {/* Shimmer Effect */}
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>

      {/* Completion Message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-2"
        >
          <p className="text-emerald-600 font-bold text-lg">
            🎉 Quiz Complete! Great job!
          </p>
        </motion.div>
      )}

      {/* Motivational Messages */}
      {!isComplete && (
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground"
        >
          {getMotivationalMessage(current, total)}
        </motion.div>
      )}
    </div>
  );
}

function getMotivationalMessage(current: number, total: number): string {
  const progress = current / total;
  
  if (current === 1) {
    return "You've got this! 💪";
  } else if (progress < 0.3) {
    return 'Just getting started...';
  } else if (progress < 0.5) {
    return "You're doing great! Keep going! ⭐";
  } else if (progress < 0.8) {
    return "Halfway there! You're on fire! 🔥";
  } else if (progress < 1) {
    return 'Almost done! Just a few more! 🚀';
  }
  return '';
}
