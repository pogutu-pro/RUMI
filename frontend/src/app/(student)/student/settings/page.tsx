'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/features/auth';
import { useCheckPasswordStatus } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Moon, Sun, Globe, Smartphone, Mail, Shield, Key, Lock, Monitor, User, ChevronRight, Edit, Phone, School, FileText, CreditCard, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordSetupModal } from '@/features/auth/components/password-setup-modal';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { data: passwordStatus } = useCheckPasswordStatus();
  const [mounted, setMounted] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hasPassword = passwordStatus?.has_password ?? false;

  const handleNotificationToggle = (type: string, enabled: boolean) => {
    // Silent update or toast with professional language
  };

  const handleSetPassword = () => {
    setShowPasswordModal(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-16">
      <div className="border-b border-border/50 pb-8 pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Configuration</h1>
        <p className="text-sm font-medium text-muted-foreground mt-2">
          Manage your institutional preferences, security protocols, and system-wide notifications.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="h-11 p-1 bg-muted/50 border border-border/50">
          <TabsTrigger value="profile" className="font-bold text-xs uppercase tracking-wider px-6">Profile</TabsTrigger>
          <TabsTrigger value="general" className="font-bold text-xs uppercase tracking-wider px-6">General</TabsTrigger>
          <TabsTrigger value="notifications" className="font-bold text-xs uppercase tracking-wider px-6">Alerts</TabsTrigger>
          <TabsTrigger value="privacy" className="font-bold text-xs uppercase tracking-wider px-6">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
          {/* Profile Summary Card */}
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg rounded-2xl">
                  <AvatarImage src={user?.profile_picture || user?.avatar} className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-3xl font-bold rounded-2xl">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{user?.first_name} {user?.last_name}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
                    {user?.phone_number && (
                      <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                        <Phone className="h-3.5 w-3.5" /> {user.phone_number}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">
                    Student Account
                  </Badge>
                </div>
                <Button asChild className="font-bold h-10 px-6 rounded-xl shrink-0">
                  <Link href="/student/profile">
                    <Edit className="w-4 h-4 mr-2" />
                    View Full Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Profile Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/student/profile/edit">
              <Card className="h-full border border-border/50 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">Edit Personal Info</p>
                    <p className="text-xs text-muted-foreground">Update name, email, and phone</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/student/roommates/preferences">
              <Card className="h-full border border-border/50 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">Roommate Preferences</p>
                    <p className="text-xs text-muted-foreground">Configure matching preferences</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-8">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Monitor className="h-4 w-4" />
                Interface Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between gap-8">
                <div className="space-y-1">
                  <Label className="text-sm font-bold">System Theme</Label>
                  <p className="text-xs font-medium text-muted-foreground">
                    Select the visual mode for the application environment.
                  </p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[200px] h-10 border-border/50 font-bold">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" className="font-medium">Standard (Light)</SelectItem>
                    <SelectItem value="dark" className="font-medium">High Contrast (Dark)</SelectItem>
                    <SelectItem value="system" className="font-medium">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Globe className="h-4 w-4" />
                Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between gap-8">
                <div className="space-y-1">
                  <Label className="text-sm font-bold">Primary Language</Label>
                  <p className="text-xs font-medium text-muted-foreground">
                    The language setting for the institutional interface.
                  </p>
                </div>
                <Select defaultValue="en">
                  <SelectTrigger className="w-[200px] h-10 border-border/50 font-bold">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en" className="font-medium">English (Universal)</SelectItem>
                    <SelectItem value="sw" className="font-medium">Swahili (Regional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-8">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Bell className="h-4 w-4" />
                Alert Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 divide-y divide-border/50">
              <div className="flex items-center justify-between gap-8 pt-0">
                <div className="space-y-1">
                  <Label className="text-sm font-bold flex items-center gap-2">
                     Electronic Mail
                  </Label>
                  <p className="text-xs font-medium text-muted-foreground">
                    Official communications regarding bookings, billing, and system updates.
                  </p>
                </div>
                <Switch 
                  defaultChecked 
                  onCheckedChange={(checked) => handleNotificationToggle('Email', checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-8 pt-8">
                <div className="space-y-1">
                  <Label className="text-sm font-bold flex items-center gap-2">
                     SMS / Mobile Text
                  </Label>
                  <p className="text-xs font-medium text-muted-foreground">
                    Critical alerts and urgent facility notifications.
                  </p>
                </div>
                <Switch 
                  defaultChecked 
                  onCheckedChange={(checked) => handleNotificationToggle('SMS', checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-8 pt-8">
                <div className="space-y-1">
                  <Label className="text-sm font-bold flex items-center gap-2">
                     Desktop Push
                  </Label>
                  <p className="text-xs font-medium text-muted-foreground">
                    Real-time operational alerts within the browser environment.
                  </p>
                </div>
                <Switch 
                  defaultChecked 
                  onCheckedChange={(checked) => handleNotificationToggle('Push', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-8">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Lock className="h-4 w-4" />
                Authentication Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {!hasPassword ? (
                <div className="flex items-center justify-between p-6 border-2 border-primary/20 bg-primary/5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-background border border-border/50 text-primary flex items-center justify-center">
                      <Key className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">Initialize Account Password</h4>
                      <p className="text-xs font-medium text-muted-foreground">
                        Secure your account access with a primary password.
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleSetPassword} size="sm" className="font-bold h-9 px-6 rounded-lg">
                    Setup Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 divide-y divide-border/50">
                  <div className="flex items-center justify-between pt-0">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold">Primary Credentials</Label>
                      <p className="text-xs font-medium text-muted-foreground">
                        Your account is currently secured with a set password.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="font-bold h-9 border-border/50">
                      Update Password
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-8">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold">Secondary Verification (2FA)</Label>
                      <p className="text-xs font-medium text-muted-foreground">
                        Add an additional layer of security to your authentication flow.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="font-bold h-9 border-border/50">
                      Configure MFA
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Shield className="h-4 w-4" />
                Privacy & Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 divide-y divide-border/50">
              <div className="flex items-center justify-between pt-0">
                <div className="space-y-1">
                  <Label className="text-sm font-bold">Registry Visibility</Label>
                  <p className="text-xs font-medium text-muted-foreground">
                    Control how your profile is indexed within the student directory.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between pt-8">
                <div className="space-y-1">
                  <Label className="text-sm font-bold">Operational Status</Label>
                  <p className="text-xs font-medium text-muted-foreground">
                    Display your current active status to other institutional members.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PasswordSetupModal 
        open={showPasswordModal} 
        onOpenChange={setShowPasswordModal} 
      />
    </div>
  );
}
