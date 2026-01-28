'use client';

import * as React from 'react';
import { QuizQuestion, QuizOption } from '@/lib/constants/roommate-quiz-constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
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
  showRandomButton = false,
}: QuestionCardProps) {
  const [justSelected, setJustSelected] = React.useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    onSelect(optionId);
    setJustSelected(optionId);
    
    // Auto-advance after animation
    setTimeout(() => {
      onNext?.();
      setJustSelected(null);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Question Header */}
      <div className="text-center mb-10 space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          {question.question}
        </h2>
        {question.subtitle && (
          <p className="text-muted-foreground text-lg font-medium">
            {question.subtitle}
          </p>
        )}
      </div>

      {/* Options Grid */}
      <div
        className={cn(
          'grid gap-6 mb-8',
          question.options.length === 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
        )}
      >
        {question.options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selectedAnswer === option.id}
            onClick={() => handleSelect(option.id)}
          />
        ))}
      </div>

      {/* Random Button */}
      {showRandomButton && onRandom && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onRandom}
            className="font-bold border-border/50 hover:bg-muted"
          >
            Select for me
          </Button>
        </div>
      )}
    </div>
  );
}

interface OptionCardProps {
  option: QuizOption;
  isSelected: boolean;
  onClick: () => void;
}

function OptionCard({ option, isSelected, onClick }: OptionCardProps) {
  const IconComponent = option.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl p-6 text-left transition-all duration-200',
        'border-2 bg-card hover:bg-muted/50',
        isSelected
          ? 'border-primary ring-1 ring-primary/20 bg-primary/5'
          : 'border-border'
      )}
    >
      {/* Image Background (if available) */}
      {option.image && (
        <div className="absolute inset-0 opacity-5">
          <Image
            src={option.image}
            alt={option.label}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-xl"
            priority={false}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-bold text-lg mb-1',
              isSelected ? 'text-foreground' : 'text-foreground'
            )}
          >
            {option.label}
          </h3>
          {option.description && (
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              {option.description}
            </p>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-in zoom-in-50 duration-200">
            <Check className="w-4 h-4" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}
