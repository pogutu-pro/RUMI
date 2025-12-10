'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizQuestion, QuizOption } from '@/lib/constants/roommate-quiz-constants';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedAnswer?: string;
  onSelect: (answerId: string) => void;
  onNext?: () => void;
  onRandom?: () => void;
  showRandomButton?: boolean;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  onNext,
  onRandom,
  showRandomButton = true,
}: QuestionCardProps) {
  const [justSelected, setJustSelected] = React.useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    onSelect(optionId);
    setJustSelected(optionId);
    
    // Auto-advance after animation
    setTimeout(() => {
      onNext?.();
      setJustSelected(null);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      {/* Question Header */}
      <div className="text-center mb-8 space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          {question.question}
        </motion.h2>
        {question.subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            {question.subtitle}
          </motion.p>
        )}
      </div>

      {/* Options Grid */}
      <div
        className={cn(
          'grid gap-4 mb-6',
          question.options.length === 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
        )}
      >
        {question.options.map((option, index) => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selectedAnswer === option.id}
            justSelected={justSelected === option.id}
            onClick={() => handleSelect(option.id)}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Random Button */}
      {showRandomButton && onRandom && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <Button
            variant="outline"
            onClick={onRandom}
            className="group hover:border-purple-500 hover:text-purple-600 transition-colors"
          >
            <Sparkles className="h-4 w-4 mr-2 group-hover:animate-spin" />
            Surprise Me
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

interface OptionCardProps {
  option: QuizOption;
  isSelected: boolean;
  justSelected: boolean;
  onClick: () => void;
  delay: number;
}

function OptionCard({ option, isSelected, justSelected, onClick, delay }: OptionCardProps) {
  const IconComponent = option.icon;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300',
        'border-2 bg-card hover:shadow-2xl',
        isSelected
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-lg shadow-emerald-500/20'
          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
      )}
    >
      {/* Selection Glow Effect */}
      <AnimatePresence>
        {justSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl"
          />
        )}
      </AnimatePresence>

      {/* Image Background (if available) */}
      {option.image && (
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <Image
            src={option.image}
            alt={option.label}
            fill
            className="object-cover rounded-2xl"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-emerald-500 text-white'
              : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30'
          )}
        >
          <IconComponent className="w-7 h-7" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-bold text-lg mb-1 transition-colors',
              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
            )}
          >
            {option.label}
          </h3>
          {option.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {option.description}
            </p>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
