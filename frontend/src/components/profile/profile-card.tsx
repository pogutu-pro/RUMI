'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Edit } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';

export function ProfileCard() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : '?';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.profileImage} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-2xl font-bold">
              {profile?.firstName} {profile?.lastName}
            </h3>
            <Badge className="mt-2 capitalize">{profile?.role}</Badge>
          </div>

          <div className="w-full space-y-2 text-sm">
            {profile?.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
            )}

            {profile?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
            )}

            {profile?.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          <Button className="w-full">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
