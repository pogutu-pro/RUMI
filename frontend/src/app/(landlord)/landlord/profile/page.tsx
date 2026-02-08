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
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserInitials } from '@/lib/utils/user';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const profileCompletion = 65; // TODO: Calculate from actual data

  const settingsSections = [
    {
      icon: User,
      title: 'Personal Information',
      description: 'Update your name, email, and contact details',
      href: '/landlord/profile/edit',
      completion: 100,
      color: 'bg-success/10 text-success'
    },
    {
      icon: Briefcase,
      title: 'Business Details',
      description: 'Company information and tax details',
      href: '/landlord/profile/edit#business',
      completion: 60,
      color: 'bg-muted text-muted-foreground'
    },
    {
      icon: DollarSign,
      title: 'Banking Information',
      description: 'Bank account and payout details',
      href: '/landlord/profile/edit#banking',
      completion: 40,
      color: 'bg-muted text-muted-foreground'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage email, SMS, and push notifications',
      href: '/landlord/settings#notifications',
      completion: 70,
      color: 'bg-muted text-muted-foreground'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Password, 2FA, and privacy settings',
      href: '/landlord/settings#security',
      completion: 80,
      color: 'bg-muted text-muted-foreground'
    },
    {
      icon: Settings,
      title: 'Account Preferences',
      description: 'Language, timezone, and dashboard settings',
      href: '/landlord/settings#preferences',
      completion: 50,
      color: 'bg-muted text-muted-foreground'
    },
  ];

  const displayName = React.useMemo(() => {
    if (!user) return 'Landlord';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email.split('@')[0];
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : 'LL';
  }, [displayName]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed', error);
    }
  }, [logout]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between bg-card p-8 rounded-xl border shadow-sm">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-2 border-muted">
            <AvatarImage src={user?.avatar || user?.profile_picture || undefined} />
            <AvatarFallback className="bg-success text-success-foreground text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">
                {displayName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-success border-success/20 bg-success/10">
                  <Building2 className="h-3 w-3 mr-1" />
                  Property Owner
                </Badge>
                {user?.is_verified && (
                  <Badge variant="outline" className="text-info border-info/20 bg-info/10">
                    Verified Account
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {user?.phone_number || 'No phone number'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-muted-foreground">Profile Completion</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-2xl font-bold text-success">{profileCompletion}%</span>
            </div>
          </div>
          <div className="w-full md:w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-success" 
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <Button className="w-full md:w-auto" variant="default" asChild>
            <Link href="/landlord/profile/edit">
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-l-4 border-l-success shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Properties</p>
                <h3 className="text-2xl font-bold text-primary">7</h3>
              </div>
              <Building2 className="h-8 w-8 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-info shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <h3 className="text-lg font-bold text-primary">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </h3>
              </div>
              <Calendar className="h-8 w-8 text-info opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verification</p>
                <h3 className="text-lg font-bold text-primary">
                  {user?.is_verified ? 'Verified' : 'Pending'}
                </h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-warning shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <h3 className="text-lg font-bold text-primary">Premium</h3>
              </div>
              <DollarSign className="h-8 w-8 text-warning opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Sections */}
      <div>
        <h2 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Account Settings
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsSections.map((section) => (
            <Link key={section.title} href={section.href}>
              <Card className="group hover:shadow-md transition-all duration-200 h-full border-muted hover:border-success/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors", section.color)}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    {section.completion === 100 && (
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        Done
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-primary mb-1 group-hover:text-success transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 h-10">
                    {section.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-success transition-colors">
                    <span>Manage</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-8">
        <h2 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Danger Zone
        </h2>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-destructive">Sign Out</h3>
              <p className="text-sm text-destructive/70">
                Securely log out of your account on this device.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
