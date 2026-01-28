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
import { Bell, Moon, Sun, Globe, Smartphone, Mail, Shield, Key, Lock, Monitor, User } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordSetupModal } from '@/features/auth/components/password-setup-modal';
import { cn } from '@/lib/utils';

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
          <TabsTrigger value="general" className="font-bold text-xs uppercase tracking-wider px-8">General</TabsTrigger>
          <TabsTrigger value="notifications" className="font-bold text-xs uppercase tracking-wider px-8">Alerts</TabsTrigger>
          <TabsTrigger value="privacy" className="font-bold text-xs uppercase tracking-wider px-8">Security</TabsTrigger>
        </TabsList>

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
