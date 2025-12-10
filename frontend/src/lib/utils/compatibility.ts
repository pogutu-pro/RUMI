/**
 * Roommate matching and compatibility algorithm utilities
 */

export interface RoommatePreferences {
  sleepSchedule?: 'early' | 'late' | 'flexible';
  cleanliness?: 'very_clean' | 'clean' | 'moderate';
  socialLevel?: 'very_social' | 'social' | 'quiet';
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  guestsAllowed?: boolean;
  musicPreference?: 'quiet' | 'moderate' | 'loud';
  studyHabits?: 'library' | 'room' | 'flexible';
  budget?: { min: number; max: number };
  location?: string;
  interests?: string[];
}

/**
 * Calculate compatibility score between two roommates
 * Returns a score from 0-100
 */
export function calculateCompatibilityScore(
  user1: RoommatePreferences,
  user2: RoommatePreferences
): number {
  let totalScore = 0;
  let consideredFactors = 0;

  // Sleep schedule compatibility (weight: 15%)
  if (user1.sleepSchedule && user2.sleepSchedule) {
    if (user1.sleepSchedule === user2.sleepSchedule) {
      totalScore += 15;
    } else if (
      user1.sleepSchedule === 'flexible' ||
      user2.sleepSchedule === 'flexible'
    ) {
      totalScore += 10;
    }
    consideredFactors++;
  }

  // Cleanliness compatibility (weight: 20%)
  if (user1.cleanliness && user2.cleanliness) {
    if (user1.cleanliness === user2.cleanliness) {
      totalScore += 20;
    } else {
      // Partial match
      totalScore += 10;
    }
    consideredFactors++;
  }

  // Social level compatibility (weight: 15%)
  if (user1.socialLevel && user2.socialLevel) {
    if (user1.socialLevel === user2.socialLevel) {
      totalScore += 15;
    } else if (
      (user1.socialLevel === 'social' && user2.socialLevel !== 'quiet') ||
      (user2.socialLevel === 'social' && user1.socialLevel !== 'quiet')
    ) {
      totalScore += 8;
    }
    consideredFactors++;
  }

  // Deal breakers (smoking, pets)
  if (user1.smokingAllowed !== undefined && user2.smokingAllowed !== undefined) {
    if (user1.smokingAllowed === user2.smokingAllowed) {
      totalScore += 15;
    } else if (!user1.smokingAllowed || !user2.smokingAllowed) {
      // One allows, one doesn't - major incompatibility
      totalScore -= 20;
    }
    consideredFactors++;
  }

  if (user1.petsAllowed !== undefined && user2.petsAllowed !== undefined) {
    if (user1.petsAllowed === user2.petsAllowed) {
      totalScore += 10;
    }
    consideredFactors++;
  }

  // Guests compatibility (weight: 10%)
  if (user1.guestsAllowed !== undefined && user2.guestsAllowed !== undefined) {
    if (user1.guestsAllowed === user2.guestsAllowed) {
      totalScore += 10;
    }
    consideredFactors++;
  }

  // Music preference (weight: 10%)
  if (user1.musicPreference && user2.musicPreference) {
    if (user1.musicPreference === user2.musicPreference) {
      totalScore += 10;
    } else if (user1.musicPreference === 'moderate' || user2.musicPreference === 'moderate') {
      totalScore += 5;
    }
    consideredFactors++;
  }

  // Study habits (weight: 10%)
  if (user1.studyHabits && user2.studyHabits) {
    if (user1.studyHabits === user2.studyHabits) {
      totalScore += 10;
    } else if (user1.studyHabits === 'flexible' || user2.studyHabits === 'flexible') {
      totalScore += 7;
    }
    consideredFactors++;
  }

  // Interests overlap (weight: 5%)
  if (user1.interests && user2.interests) {
    const commonInterests = user1.interests.filter((interest) =>
      user2.interests!.includes(interest)
    );
    if (commonInterests.length > 0) {
      totalScore += Math.min(5, commonInterests.length * 2);
    }
    consideredFactors++;
  }

  // Normalize score to 0-100 range
  const maxPossibleScore = 100;
  const normalizedScore = Math.max(0, Math.min(100, totalScore));

  return Math.round(normalizedScore);
}

/**
 * Find compatible roommates from a list
 */
export function findCompatibleRoommates(
  userPreferences: RoommatePreferences,
  candidates: Array<{ id: string; preferences: RoommatePreferences }>,
  minScore: number = 60
): Array<{ id: string; score: number; preferences: RoommatePreferences }> {
  return candidates
    .map((candidate) => ({
      id: candidate.id,
      score: calculateCompatibilityScore(userPreferences, candidate.preferences),
      preferences: candidate.preferences,
    }))
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get compatibility insights
 */
export function getCompatibilityInsights(
  user1: RoommatePreferences,
  user2: RoommatePreferences
): {
  strengths: string[];
  concerns: string[];
  suggestions: string[];
} {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const suggestions: string[] = [];

  // Check for strengths
  if (user1.sleepSchedule === user2.sleepSchedule) {
    strengths.push('Similar sleep schedules');
  }
  if (user1.cleanliness === user2.cleanliness) {
    strengths.push('Same cleanliness standards');
  }
  if (user1.socialLevel === user2.socialLevel) {
    strengths.push('Compatible social preferences');
  }

  // Check for concerns
  if (user1.smokingAllowed !== user2.smokingAllowed) {
    concerns.push('Different views on smoking');
  }
  if (
    user1.musicPreference === 'loud' &&
    user2.musicPreference === 'quiet'
  ) {
    concerns.push('Very different music preferences');
  }

  // Suggestions
  if (concerns.length > 0) {
    suggestions.push('Consider discussing these differences before committing');
  }
  if (strengths.length >= 3) {
    suggestions.push('High compatibility - would make great roommates!');
  }

  return { strengths, concerns, suggestions };
}
