import type { Metadata } from 'next';
import Link from 'next/link';
import { User, LogIn, Heart, Calendar, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AUTH_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your RumiaRent profile, bookings, and preferences',
};

export default function ProfilePage() {
  // TODO: Check auth status from session/cookies
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <User className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Sign in to view your profile
            </h1>
            <p className="text-gray-600">
              Access your bookings, saved hostels, and account settings
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild size="lg" className="w-full">
              <Link href={AUTH_ROUTES.LOGIN}>
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href={AUTH_ROUTES.REGISTER}>
                Create Account
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Don't have an account yet?{' '}
              <Link 
                href={AUTH_ROUTES.REGISTER} 
                className="text-primary hover:underline font-medium"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Authenticated view (to be implemented with real user data)
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-600">Manage your account and bookings</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-red-100 p-3">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Saved Hostels</h3>
                <p className="text-sm text-gray-600">View your favorites</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">My Bookings</h3>
                <p className="text-sm text-gray-600">Track reservations</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-purple-100 p-3">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
                <p className="text-sm text-gray-600">Account preferences</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Help \u0026 Support</h3>
                <p className="text-sm text-gray-600">Get assistance</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
