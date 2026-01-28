'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building, GraduationCap } from 'lucide-react';
import { useCompleteGoogleLogin } from '../hooks/use-auth';

interface GoogleRoleSelectionProps {
  userInfo: {
    email: string;
    name: string;
    picture: string;
  };
  accessToken: string;
  onBack: () => void;
}

export function GoogleRoleSelection({ userInfo, accessToken, onBack }: GoogleRoleSelectionProps) {
  const { mutate: completeGoogleLogin, isPending } = useCompleteGoogleLogin();

  const handleRoleSelect = (role: 'student' | 'landlord') => {
    completeGoogleLogin({ token: accessToken, role });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
          <img 
            src={userInfo.picture} 
            alt={userInfo.name}
            className="w-full h-full object-cover"
          />
        </div>
        <CardTitle className="text-xl">Welcome, {userInfo.name}!</CardTitle>
        <CardDescription>
          Select your role to continue with {userInfo.email}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-center justify-start space-x-3"
            onClick={() => handleRoleSelect('student')}
            disabled={isPending}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Student</div>
              <div className="text-sm text-gray-600">Find and book hostels</div>
            </div>
            <Badge variant="secondary" className="ml-auto">Popular</Badge>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-center justify-start space-x-3"
            onClick={() => handleRoleSelect('landlord')}
            disabled={isPending}
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Landlord</div>
              <div className="text-sm text-gray-600">List and manage properties</div>
            </div>
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={onBack}
          disabled={isPending}
        >
          Back to sign in options
        </Button>

        {isPending && (
          <div className="text-center text-sm text-gray-600">
            Creating your account...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
