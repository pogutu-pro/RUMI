/**
 * Enhanced Roommate Compatibility Algorithm
 * Calculates compatibility based on personality quiz + profile data
 */

import { RoommatePreferences } from '@/types/entities.types';
import { QUIZ_QUESTIONS, QuestionId } from '@/lib/constants/roommate-quiz-constants';

export interface CompatibilityResult {
  score: number; // 0-100
  breakdown: {
    strengths: string[];
    concerns: string[];
    suggestions: string[];
  };
  categoryScores: {
    lifestyle: number;
    personality: number;
    preferences: number;
    aesthetics: number;
  };
}

/**
 * Calculate compatibility score between two users
 * Combines weighted quiz answers + basic preferences
 */
export function calculateCompatibility(
  user1: RoommatePreferences,
  user2: RoommatePreferences
): CompatibilityResult {
  let totalScore = 0;
  const strengths: string[] = [];
  const concerns: string[] = [];
  const suggestions: string[] = [];
  const categoryScores = {
    lifestyle: 0,
    personality: 0,
    preferences: 0,
    aesthetics: 0,
  };

  // Calculate quiz-based compatibility (weighted)
  QUIZ_QUESTIONS.forEach((question) => {
    const user1Answer = user1[question.id as keyof RoommatePreferences];
    const user2Answer = user2[question.id as keyof RoommatePreferences];

    if (!user1Answer || !user2Answer) return;

    const questionScore = calculateQuestionScore(
      question.id,
      user1Answer as string,
      user2Answer as string,
      question.weight
    );

    totalScore += questionScore.score;
    categoryScores[question.category] += questionScore.score;

    if (questionScore.strength) {
      strengths.push(questionScore.strength);
    }
    if (questionScore.concern) {
      concerns.push(questionScore.concern);
    }
  });

  // Check deal-breakers from basic preferences
  const dealBreakerPenalty = checkDealBreakers(user1, user2, concerns);
  totalScore = Math.max(0, totalScore - dealBreakerPenalty);

  // Generate suggestions
  if (totalScore >= 80) {
    suggestions.push('🎉 Excellent match! You have highly compatible lifestyles.');
  } else if (totalScore >= 60) {
    suggestions.push('✨ Good match! Communication will help bridge small differences.');
  } else if (totalScore >= 40) {
    suggestions.push('⚠️ Moderate compatibility. Discuss differences before committing.');
  } else {
    suggestions.push('❌ Low compatibility. Consider other matches for better harmony.');
  }

  if (concerns.length > 0) {
    suggestions.push('💬 Have an honest conversation about potential concerns.');
  }

  return {
    score: Math.round(Math.min(100, Math.max(0, totalScore))),
    breakdown: { strengths, concerns, suggestions },
    categoryScores,
  };
}

/**
 * Calculate score for a single question
 */
function calculateQuestionScore(
  questionId: QuestionId,
  answer1: string,
  answer2: string,
  weight: number
): {
  score: number;
  strength?: string;
  concern?: string;
} {
  const isExactMatch = answer1 === answer2;
  
  // Question-specific logic
  switch (questionId) {
    case 'sleepSchedule':
      if (isExactMatch) {
        return {
          score: weight,
          strength: '😴 Same sleep schedule - no late-night disturbances!',
        };
      }
      // Compatible flexible combinations
      if (answer1 === 'flexible' || answer2 === 'flexible') {
        return { score: weight * 0.7, strength: '🕐 Flexible schedule works!' };
      }
      // Incompatible: early_bird + night_owl
      if (
        (answer1 === 'early_bird' && answer2 === 'night_owl') ||
        (answer1 === 'night_owl' && answer2 === 'early_bird')
      ) {
        return {
          score: weight * 0.2,
          concern: '⚠️ Very different sleep schedules might cause conflicts',
        };
      }
      return { score: weight * 0.5 };

    case 'cleanliness':
      if (isExactMatch) {
        return {
          score: weight,
          strength: '✨ Same cleanliness standards - peace of mind!',
        };
      }
      // One level difference is okay
      const cleanlinessLevels = ['messy', 'average', 'neat', 'ocd_level'];
      const idx1 = cleanlinessLevels.indexOf(answer1);
      const idx2 = cleanlinessLevels.indexOf(answer2);
      const difference = Math.abs(idx1 - idx2);
      
      if (difference === 1) {
        return { score: weight * 0.7 };
      }
      if (difference >= 2) {
        return {
          score: weight * 0.3,
          concern: '🧹 Very different cleanliness expectations',
        };
      }
      return { score: weight * 0.5 };

    case 'socialPreference':
      if (isExactMatch) {
        return {
          score: weight,
          strength: '👥 Aligned social energy levels!',
        };
      }
      // Sometimes social is compatible with most
      if (answer1 === 'sometimes_social' || answer2 === 'sometimes_social') {
        return { score: weight * 0.7 };
      }
      // Always social + mostly alone = concern
      if (
        (answer1 === 'always_social' && answer2 === 'mostly_alone') ||
        (answer1 === 'mostly_alone' && answer2 === 'always_social')
      ) {
        return {
          score: weight * 0.3,
          concern: '🤝 Different social needs - may need boundaries',
        };
      }
      return { score: weight * 0.5 };

    case 'noiseTolerance':
      if (isExactMatch) {
        return {
          score: weight,
          strength: '🔊 Same noise preferences!',
        };
      }
      // Silent + music_lover = bad
      if (
        (answer1 === 'silent' && answer2 === 'music_lover') ||
        (answer1 === 'music_lover' && answer2 === 'silent')
      ) {
        return {
          score: weight * 0.2,
          concern: '🎵 Conflicting noise tolerance levels',
        };
      }
      return { score: weight * 0.6 };

    case 'petPreference':
      if (isExactMatch) {
        return { score: weight, strength: '🐾 Same pet preferences!' };
      }
      // Allergic is a deal-breaker with love_pets
      if (
        (answer1 === 'allergic' && answer2 === 'love_pets') ||
        (answer1 === 'love_pets' && answer2 === 'allergic')
      ) {
        return {
          score: 0,
          concern: '🚫 Pet allergies vs. pet lover - incompatible',
        };
      }
      return { score: weight * 0.6 };

    case 'studySpot':
      if (isExactMatch) {
        return { score: weight, strength: '📚 Same study vibes!' };
      }
      // Different study spots can actually be good (less competition)
      return { score: weight * 0.8 };

    case 'weekendVibe':
    case 'foodMood':
    case 'fridayNight':
    case 'roomStyle':
      // Less critical - diversity can be good
      if (isExactMatch) {
        return { score: weight, strength: `Shared ${questionId} interests!` };
      }
      return { score: weight * 0.6 };

    default:
      return { score: isExactMatch ? weight : weight * 0.5 };
  }
}

/**
 * Check deal-breakers from basic preferences
 */
function checkDealBreakers(
  user1: RoommatePreferences,
  user2: RoommatePreferences,
  concerns: string[]
): number {
  let penalty = 0;

  // Smoking mismatch
  if (user1.smoking !== user2.smoking) {
    if (user1.smoking || user2.smoking) {
      concerns.push('🚬 Smoking preferences conflict');
      penalty += 15;
    }
  }

  // Pet allergies vs. having pets
  if (user1.pets !== user2.pets) {
    if (user1.petPreference === 'allergic' || user2.petPreference === 'allergic') {
      concerns.push('🐕 Pet allergies present');
      penalty += 20;
    }
  }

  return penalty;
}

/**
 * Get top matches from a list of candidates
 */
export function getTopMatches(
  userPreferences: RoommatePreferences,
  candidates: Array<{ id: string; preferences: RoommatePreferences; user: any }>,
  minScore: number = 40,
  limit: number = 10
): Array<{
  id: string;
  user: any;
  compatibility: CompatibilityResult;
}> {
  return candidates
    .map((candidate) => ({
      id: candidate.id,
      user: candidate.user,
      compatibility: calculateCompatibility(userPreferences, candidate.preferences),
    }))
    .filter((match) => match.compatibility.score >= minScore)
    .sort((a, b) => b.compatibility.score - a.compatibility.score)
    .slice(0, limit);
}

/**
 * Calculate quiz completion percentage
 */
export function getQuizCompletionPercentage(preferences: RoommatePreferences): number {
  const quizQuestions = QUIZ_QUESTIONS.map((q) => q.id);
  const answeredCount = quizQuestions.filter(
    (questionId) => preferences[questionId as keyof RoommatePreferences]
  ).length;

  return Math.round((answeredCount / quizQuestions.length) * 100);
}
