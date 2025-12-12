'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Edit } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';

export function ProfileCard() {
  const { data: profileData, isLoading } = useProfile();

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  const user = profileData?.user;
  const userProfile = profileData?.profile;

  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : '?';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.profile_picture || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-2xl font-bold">
              {user?.first_name} {user?.last_name}
            </h3>
            <Badge className="mt-2 capitalize">{user?.role}</Badge>
          </div>

          <div className="w-full space-y-2 text-sm">
            {user?.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}

            {user?.phone_number && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{user.phone_number}</span>
              </div>
            )}

            {/* Location might be in profile or not available securely */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Nairobi, Kenya</span>
            </div>
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
