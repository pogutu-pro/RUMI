'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Settings, 
  LogOut, 
  ChevronRight,
  ClipboardCheck,
  Wrench,
  Users,
  Bell,
  Lock,
  AlertTriangle,
  UserX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserInitials } from '@/lib/utils/user';

export default function CaretakerProfilePage() {
  const { user, logout } = useAuth();

  const profileCompletion = 85; // TODO: Calculate from actual data

  const settingsSections = [
    {
      icon: User,
      title: 'Personal Information',
      description: 'Update your name, email, and contact details',
      href: '/caretaker/profile/edit',
      completion: 100,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage alerts for maintenance and security',
      href: '/caretaker/settings#notifications',
      completion: 100,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    },
    {
      icon: Lock,
      title: 'Security Settings',
      description: 'Change password and 2FA settings',
      href: '/caretaker/settings#security',
      completion: 80,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    },
    {
      icon: Settings,
      title: 'App Preferences',
      description: 'Theme, language, and display settings',
      href: '/caretaker/settings#preferences',
      completion: 60,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    },
  ];

  const displayName = React.useMemo(() => {
    if (!user) return 'Caretaker';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email.split('@')[0];
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : 'CT';
  }, [displayName]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed', error);
    }
  }, [logout]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 md:p-12 shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Shield className="h-64 w-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl">
            <AvatarImage src={user?.avatar || user?.profile_picture || undefined} />
            <AvatarFallback className="bg-slate-700 text-white text-4xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {displayName || "Loading..."}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30">
                  Active Status
                </Badge>
              </div>
              <p className="text-slate-300 text-lg flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4" /> {user?.email || "No email provided"}
              </p>
              <p className="text-slate-400 text-sm flex items-center justify-center md:justify-start gap-2 mt-1">
                <Phone className="h-3 w-3" /> {user?.phone_number || "No phone number"}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0" asChild>
                <Link href="/caretaker/profile/edit">
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/caretaker/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 min-w-[200px] border border-white/10">
            <p className="text-sm font-medium text-slate-300 mb-2">Profile Completion</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{profileCompletion}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tasks Completed</p>
                <h3 className="text-2xl font-bold">128</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tenants Managed</p>
                <h3 className="text-2xl font-bold">45</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-all border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Pending Repairs</p>
                <h3 className="text-2xl font-bold">3</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Navigation */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Account Management</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Link key={section.title} href={section.href}>
              <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-border h-full bg-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors", section.color)}>
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {section.title}
                        </h3>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {section.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-600 dark:bg-slate-400 rounded-full"
                            style={{ width: `${section.completion}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {section.completion}% Set up
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Manage your active session and sensitive account actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
            >
              <UserX className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
