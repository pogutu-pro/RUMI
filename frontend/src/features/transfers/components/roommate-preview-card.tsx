import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  User,
  GraduationCap,
  Heart,
Moon,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { RoommatePreview } from '@/features/roommates';

interface RoommatePreviewCardProps {
  roommate: RoommatePreview;
  showCompatibility?: boolean;
  compact?: boolean;
  className?: string;
}

const getSleepIcon = (schedule?: string) => {
  if (schedule === 'early_bird') return '🌅';
  if (schedule === 'night_owl') return '🦉';
  return '⏰';
};

const getCleanlinessIcon = (level?: string) => {
  if (level === 'ocd_level') return '✨';
  if (level === 'neat') return '🧹';
  if (level === 'average') return '👌';
  return '🌀';
};

const getNoiseIcon = (tolerance?: string) => {
  if (tolerance === 'silent') return '🤫';
  if (tolerance === 'moderate') return '🎵';
  return '🎸';
};

export function RoommatePreviewCard({
  roommate,
  showCompatibility = true,
  compact = false,
  className,
}: RoommatePreviewCardProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {roommate.avatar ? (
            <Image
              src={roommate.avatar}
              alt={roommate.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {roommate.name}
          </p>
          {roommate.program && (
            <p className="text-xs text-muted-foreground truncate">
              {roommate.program}
              {roommate.year && ` • ${roommate.year}`}
            </p>
          )}
        </div>
        {showCompatibility && roommate.compatibilityScore && (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          >
            <Heart className="h-3 w-3 mr-1 fill-current" />
            {roommate.compatibilityScore}%
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('bg-card', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            {roommate.avatar ? (
              <Image
                src={roommate.avatar}
                alt={roommate.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h4 className="font-semibold text-foreground">{roommate.name}</h4>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>
                  {roommate.program || 'Student'}
                  {roommate.year && ` • ${roommate.year}`}
                </span>
              </div>
            </div>

            {/* Preferences */}
            {(roommate.sleepSchedule || roommate.cleanliness || roommate.noiseTolerance) && (
              <div className="flex flex-wrap gap-2">
                {roommate.sleepSchedule && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1">{getSleepIcon(roommate.sleepSchedule)}</span>
                    {roommate.sleepSchedule.replace('_', ' ')}
                  </Badge>
                )}
                {roommate.cleanliness && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1">{getCleanlinessIcon(roommate.cleanliness)}</span>
                    {roommate.cleanliness.replace('_', ' ')}
                  </Badge>
                )}
                {roommate.noiseTolerance && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1">{getNoiseIcon(roommate.noiseTolerance)}</span>
                    {roommate.noiseTolerance.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            )}

            {/* Compatibility */}
            {showCompatibility && roommate.compatibilityScore && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${roommate.compatibilityScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {roommate.compatibilityScore}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Profile Link */}
        <Link
          href={`/student/roommates/${roommate.userId}`}
          className="mt-3 block text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
        >
          View Full Profile →
        </Link>
      </CardContent>
    </Card>
  );
}
