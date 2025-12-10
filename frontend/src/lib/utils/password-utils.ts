export type StrengthLevel = 'weak' | 'medium' | 'strong';

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

export const DEFAULT_MIN_LENGTH = 8;
export const MAX_SCORE = 5;

function normalize(password: unknown): string {
  return typeof password === 'string' ? password : '';
}

export function getStrengthScore(password: unknown): number {
  const p = normalize(password);

  let score = 0;
  if (p.length >= DEFAULT_MIN_LENGTH) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  return score;
}

export function getStrengthLevel(score: number): StrengthLevel {
  if (score <= 2) return 'weak';
  if (score === 3) return 'medium';
  return 'strong';
}

export function getStrengthPercentage(score: number): number {
  const pct = (score / MAX_SCORE) * 100;
  return Math.min(100, Math.max(0, pct)); // clamp to 0–100
}

export function getRequirements(
  password: unknown,
  minLength: number = DEFAULT_MIN_LENGTH,
): readonly PasswordRequirement[] {
  const p = normalize(password);

  return [
    {
      key: 'length',
      label: `At least ${minLength} characters`,
      met: p.length >= minLength,
    },
    {
      key: 'upper',
      label: 'One uppercase letter',
      met: /[A-Z]/.test(p),
    },
    {
      key: 'lower',
      label: 'One lowercase letter',
      met: /[a-z]/.test(p),
    },
    {
      key: 'number',
      label: 'One number',
      met: /[0-9]/.test(p),
    },
    {
      key: 'special',
      label: 'One special character',
      met: /[^A-Za-z0-9]/.test(p),
    },
  ] as const;
}
