'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Bell } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';

export function ProfileHeader() {
  const { data: profile } = useProfile();

  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : '?';

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={profile?.profileImage} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-3xl font-bold">
                {profile?.firstName} {profile?.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {profile?.role}
                </Badge>
                {profile?.isVerified && (
                  <Badge variant="default">Verified</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
