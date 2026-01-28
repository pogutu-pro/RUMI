'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, UserPlus, Check, ChevronRight } from 'lucide-react';
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
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Compatibility';
    if (score >= 60) return 'Stable Compatibility';
    if (score >= 40) return 'Moderate Compatibility';
    return 'Low Compatibility';
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-sm transition-shadow border border-border/50">
        <CardHeader className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border border-border/50">
              <AvatarImage src={match.matchedUser.avatar} />
              <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                {match.matchedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate text-sm">{match.matchedUser.name}</h3>
              <p className="text-xs text-muted-foreground truncate font-medium">
                {match.matchedUser.program} • Year {match.matchedUser.year}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-foreground">
                {score}%
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Score</p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="text-center pb-6 border-b border-border/50 bg-muted/20">
        <div className="flex flex-col items-center gap-4 pt-4">
          <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
            <AvatarImage src={match.matchedUser.avatar} />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
              {match.matchedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h3 className="text-xl font-bold">{match.matchedUser.name}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
              {match.matchedUser.program} • Year {match.matchedUser.year}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="text-4xl font-black tracking-tight text-foreground">
              {score}%
            </span>
            <Badge variant="outline" className="font-bold border-primary/20 text-primary text-[10px] uppercase tracking-wider px-3">
              {getScoreLabel(score)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-6 px-5 space-y-6">
        {match.compatibilityBreakdown?.strengths && match.compatibilityBreakdown.strengths.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 border-b border-border/50 pb-2">
              Primary Strengths
            </h4>
            <div className="space-y-2.5">
              {match.compatibilityBreakdown.strengths.slice(0, showDetails ? undefined : 3).map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs font-medium">
                  <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-foreground/80">{strength}</span>
                </div>
              ))}
            </div>
            
            {match.compatibilityBreakdown.strengths.length > 3 && !showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="text-xs h-8 font-bold text-primary hover:bg-primary/5"
              >
                Expand Analysis <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {showDetails && match.compatibilityBreakdown?.concerns && match.compatibilityBreakdown.concerns.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 border-b border-border/50 pb-2">
              Points for discussion
            </h4>
            <div className="space-y-2.5">
              {match.compatibilityBreakdown.concerns.map((concern, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                  <span className="text-muted-foreground">{concern}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/30 p-4 gap-3 border-t border-border/50">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 font-bold h-9"
          asChild
        >
          <Link href={`/student/messages?user=${match.matchedUser.id}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Link>
        </Button>
        
        {isRequestSent ? (
          <Button size="sm" className="flex-1 h-9 font-bold" disabled>
            <Check className="h-4 w-4 mr-2" strokeWidth={3} />
            Sent
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 h-9 font-bold shadow-sm"
            onClick={onSendRequest}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
