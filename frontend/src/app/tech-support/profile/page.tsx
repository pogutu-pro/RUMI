'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Edit, 
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Award,
  CheckCircle2,
  Clock,
  Activity,
  LifeBuoy
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getUserInitials } from '@/lib/utils/user';

export default function TechSupportProfilePage() {
  const { user, logout } = useAuth();

  const profileCompletion = 85; // Mock data

  const settingsSections = [
    {
      icon: User,
      title: 'Personal Information',
      description: 'Update your name, email, and contact details',
      href: '/tech-support/settings#profile',
      completion: 100,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage email and system notifications',
      href: '/tech-support/settings#notifications',
      completion: 100,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Password and 2FA settings',
      href: '/tech-support/settings#security',
      completion: 80,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    },
    {
      icon: Settings,
      title: 'Platform Preferences',
      description: 'Language, timezone, and dashboard settings',
      href: '/tech-support/settings#platform',
      completion: 60,
      color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'
    },
  ];

  const displayName = React.useMemo(() => {
    if (!user) return 'Tech Support';
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return user.email.split('@')[0];
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : 'TS';
  }, [displayName]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed', error);
    }
  }, [logout]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-4 border-background ring-4 ring-indigo-100 dark:ring-indigo-900/50">
            <AvatarImage src={user?.avatar || user?.profileImage} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {displayName}
            </h1>
            <p className="text-muted-foreground mt-1">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <LifeBuoy className="h-3 w-3 mr-1" />
                Tech Support
              </Badge>
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900">
                Active
              </Badge>
            </div>
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
          <Link href="/tech-support/settings">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Profile Completion Banner */}
      <Card className="border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10">
          <Award className="h-32 w-32" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-indigo-100">Profile Strength</p>
              <p className="text-3xl font-bold mt-1">{profileCompletion}%</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <User className="h-8 w-8" />
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20 mb-3">
            <div
              className="h-full rounded-full bg-white transition-all duration-1000"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <p className="text-sm text-white/90">
            {profileCompletion < 80 
              ? 'Complete your profile to access all features'
              : 'Excellent! Your profile is looking professional'}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resolved Tickets</p>
                <p className="font-semibold text-sm">142</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Response</p>
                <p className="font-semibold text-sm">8.5m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Users Verified</p>
                <p className="font-semibold text-sm">38</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Performance</p>
                <p className="font-semibold text-sm">Top 5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Sections */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Account Settings</h2>
        <div className="grid gap-4">
          {settingsSections.map((section) => (
            <Link key={section.title} href={section.href}>
              <Card className="group hover:shadow-md transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", section.color)}>
                        <section.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold group-hover:text-indigo-600 transition-colors">
                            {section.title}
                          </h3>
                          {section.completion === 100 && (
                            <Badge variant="secondary" className="h-5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                              Complete
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-indigo-600"
                              style={{ width: `${section.completion}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{section.completion}%</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
