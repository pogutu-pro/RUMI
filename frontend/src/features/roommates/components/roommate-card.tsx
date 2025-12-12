'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus } from 'lucide-react';

interface Roommate {
  id: string;
  name: string;
  avatar?: string;
  course?: string;
  yearOfStudy?: number;
  matchScore?: number;
}

interface RoommateCardProps {
  roommate: Roommate;
  onMessage?: () => void;
  onConnect?: () => void;
}

export function RoommateCard({ roommate, onMessage, onConnect }: RoommateCardProps) {
  const initials = roommate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={roommate.avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-semibold text-lg">{roommate.name}</h3>
            {roommate.course && (
              <p className="text-sm text-muted-foreground">{roommate.course}</p>
            )}
            {roommate.yearOfStudy && (
              <p className="text-xs text-muted-foreground">
                Year {roommate.yearOfStudy}
              </p>
            )}
          </div>

          {roommate.matchScore && (
            <Badge variant="secondary">
              {roommate.matchScore}% Match
            </Badge>
          )}

          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={onMessage}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button className="flex-1" onClick={onConnect}>
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
