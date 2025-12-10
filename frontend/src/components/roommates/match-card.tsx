'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, MessageSquare, UserPlus, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MatchCardProps {
  match: {
    id: string;
    matchedUser: {
      id: string;
      name: string;
      avatar?: string;
      program?: string;
      year?: string;
    };
    compatibilityScore: number;
    compatibilityBreakdown?: {
      strengths: string[];
      concerns: string[];
      suggestions: string[];
    };
  };
  onSendRequest?: () => void;
  isRequestSent?: boolean;
  variant?: 'default' | 'compact';
}

export function MatchCard({
  match,
  onSendRequest,
  isRequestSent = false,
  variant = 'default',
}: MatchCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const score = match.compatibilityScore;
  
  // Determine score color and label
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
   if (score >= 40) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Moderate Match';
    return 'Low Match';
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-emerald-100">
                <AvatarImage src={match.matchedUser.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-blue-500 text-white font-bold">
                  {match.matchedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{match.matchedUser.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {match.matchedUser.program} • Year {match.matchedUser.year}
                </p>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  getScoreColor(score)
                )}>
                  {score}%
                </div>
                <Badge variant="outline" className="text-xs">
                  {getScoreLabel(score)}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-emerald-200 dark:hover:border-emerald-800">
        <CardHeader className="text-center pb-4 relative">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-purple-950/20 opacity-50" />
          
          <div className="relative z-10">
            {/* Avatar with Compatibility Ring */}
            <div className="relative inline-block mb-4">
              <svg className="absolute -inset-4 w-32 h-32" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted/20"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - score / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="rotate-[-90deg] origin-center"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className="text-emerald-500" stopColor="currentColor" />
                    <stop offset="50%" className="text-blue-500" stopColor="currentColor" />
                    <stop offset="100%" className="text-purple-500" stopColor="currentColor" />
                  </linearGradient>
                </defs>
              </svg>
              
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={match.matchedUser.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 text-white text-2xl font-bold">
                  {match.matchedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Info */}
            <h3 className="text-2xl font-bold mb-1">{match.matchedUser.name}</h3>
            <p className="text-muted-foreground mb-3">
              {match.matchedUser.program} • Year {match.matchedUser.year}
            </p>

            {/* Compatibility Score */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border-2 border-emerald-200 dark:border-emerald-800">
              <Heart className="h-4 w-4 text-pink-500 fill-pink-500 animate-pulse" />
              <span className={cn(
                "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                getScoreColor(score)
              )}>
                {score}%
              </span>
              <span className="text-sm text-muted-foreground">Compatible</span>
            </div>

            <Badge
              variant="secondary"
              className={cn(
                "mt-2",
                score >= 80 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
                score >= 60 && score < 80 && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
              )}
            >
              {getScoreLabel(score)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Compatibility Strengths */}
          {match.compatibilityBreakdown?.strengths && match.compatibilityBreakdown.strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span>Why you match</span>
              </div>
              <div className="space-y-1">
                {match.compatibilityBreakdown.strengths.slice(0, showDetails ? undefined : 3).map((strength, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{strength}</span>
                  </motion.div>
                ))}
              </div>
              
              {match.compatibilityBreakdown.strengths.length > 3 && !showDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="text-xs h-auto p-1 text-emerald-600"
                >
                  Show more...
                </Button>
              )}
            </div>
          )}

          {/* Concerns (if any) */}
          {showDetails && match.compatibilityBreakdown?.concerns && match.compatibilityBreakdown.concerns.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Points to discuss
              </div>
              <div className="space-y-1">
                {match.compatibilityBreakdown.concerns.map((concern, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-amber-500">•</span>
                    <span>{concern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/30 p-4 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link href={`/student/messages?user=${match.matchedUser.id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Link>
          </Button>
          
          {isRequestSent ? (
            <Button size="sm" className="flex-1 bg-emerald-600 text-white" disabled>
              <Check className="h-4 w-4 mr-2" />
              Request Sent
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              onClick={onSendRequest}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
