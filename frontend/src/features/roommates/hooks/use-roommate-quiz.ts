/**
 * Roommate Quiz State Management Hook
 * Handles quiz flow, answer persistence, and submission
 */

import { useState, useEffect, useCallback } from 'react';
import { RoommatePreferences } from '@/features/roommates';
import { QUIZ_QUESTIONS, QuestionId, QUIZ_METADATA } from '@/lib/constants/roommate-quiz-constants';
import { useUpdateRoommatePreferences } from './use-roommates';

const STORAGE_KEY = 'roommate-quiz-progress';

export interface QuizAnswer {
  questionId: QuestionId;
  answerId: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  isComplete: boolean;
  startedAt?: string;
  completedAt?: string;
}

export function useRoommateQuiz() {
  // Load progress from localStorage on mount (lazy initialization)
  const [quizState, setQuizState] = useState<QuizState>(() => {
    if (typeof window === 'undefined') {
      return {
        currentQuestionIndex: 0,
        answers: [],
        isComplete: false,
      };
    }

    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        return JSON.parse(savedProgress);
      }
    } catch (error) {
      console.error('Failed to load quiz progress', error);
    }

    return {
      currentQuestionIndex: 0,
      answers: [],
      isComplete: false,
    };
  });

  const updatePreferencesMutation = useUpdateRoommatePreferences();

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (quizState.answers.length > 0 || quizState.startedAt) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quizState));
    }
  }, [quizState]);

  // Start quiz
  const startQuiz = useCallback(() => {
    setQuizState({
      currentQuestionIndex: 0,
      answers: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
    });
  }, []);

  // Answer current question
  const answerQuestion = useCallback((answerId: string) => {
    setQuizState((prev) => {
      const currentQuestion = QUIZ_QUESTIONS[prev.currentQuestionIndex];
      const existingAnswerIndex = prev.answers.findIndex(
        (a) => a.questionId === currentQuestion.id
      );

      let newAnswers = [...prev.answers];
      if (existingAnswerIndex >= 0) {
        // Update existing answer
        newAnswers[existingAnswerIndex] = {
          questionId: currentQuestion.id,
          answerId,
        };
      } else {
        // Add new answer
        newAnswers.push({
          questionId: currentQuestion.id,
          answerId,
        });
      }

      return {
        ...prev,
        answers: newAnswers,
      };
    });
  }, []);

  // Navigate to specific question
  const goToQuestion = useCallback((index: number) => {
    setQuizState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, Math.min(QUIZ_QUESTIONS.length - 1, index)),
    }));
  }, []);

  // Next question
  const nextQuestion = useCallback(() => {
    setQuizState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= QUIZ_QUESTIONS.length) {
        // Quiz complete
        return {
          ...prev,
          isComplete: true,
          completedAt: new Date().toISOString(),
        };
      }
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
      };
    });
  }, []);

  // Previous question
  const previousQuestion = useCallback(() => {
    setQuizState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  }, []);

  // Random answer (Surprise Me feature)
  const randomAnswer = useCallback(() => {
    const currentQuestion = QUIZ_QUESTIONS[quizState.currentQuestionIndex];
    const randomOption = currentQuestion.options[
      Math.floor(Math.random() * currentQuestion.options.length)
    ];
    answerQuestion(randomOption.id);
  }, [quizState.currentQuestionIndex, answerQuestion]);

  // Submit quiz
  const submitQuiz = useCallback(async () => {
    // Convert answers to RoommatePreferences format
    const preferences: Partial<RoommatePreferences> = {
      quizCompleted: true,
      quizCompletedAt: quizState.completedAt || new Date().toISOString(),
      quizVersion: QUIZ_METADATA.version,
    };

    quizState.answers.forEach((answer) => {
      preferences[answer.questionId as keyof RoommatePreferences] = answer.answerId as any;
    });

    try {
      await updatePreferencesMutation.mutateAsync(preferences);
      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      return false;
    }
  }, [quizState, updatePreferencesMutation]);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setQuizState({
      currentQuestionIndex: 0,
      answers: [],
      isComplete: false,
    });
  }, []);

  // Get current question
  const currentQuestion = QUIZ_QUESTIONS[quizState.currentQuestionIndex];
  
  // Get current answer for current question
  const currentAnswer = quizState.answers.find(
    (a) => a.questionId === currentQuestion?.id
  );

  // Calculate progress
  const progress = {
    current: quizState.currentQuestionIndex + 1,
    total: QUIZ_QUESTIONS.length,
    percentage: Math.round(
      ((quizState.currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100
    ),
    answeredCount: quizState.answers.length,
  };

  return {
    // State
    quizState,
    currentQuestion,
    currentAnswer,
    progress,
    isSubmitting: updatePreferencesMutation.isPending,

    // Actions
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    randomAnswer,
    submitQuiz,
    resetQuiz,

    // Computed
    canGoNext: !!currentAnswer || quizState.isComplete,
    canGoPrevious: quizState.currentQuestionIndex > 0,
    isFirstQuestion: quizState.currentQuestionIndex === 0,
    isLastQuestion: quizState.currentQuestionIndex === QUIZ_QUESTIONS.length - 1,
  };
}
