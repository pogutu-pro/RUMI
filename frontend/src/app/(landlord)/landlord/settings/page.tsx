'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
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
import { Bell, Moon, Sun, Globe, Smartphone, Mail, Shield, Lock, Eye, EyeOff, Laptop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleNotificationToggle = (type: string, enabled: boolean) => {
    toast({
      title: "Notification Settings Updated",
      description: `${type} notifications have been ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your application preferences, notifications, and security.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-muted/50 p-1">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Security</TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Communication Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important updates.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" /> Email Alerts
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Receive daily summaries and important alerts via email.
                  </span>
                </div>
                <Switch 
                  defaultChecked 
                  onCheckedChange={(checked) => handleNotificationToggle('Email', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" /> SMS Alerts
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Get text messages for urgent security or maintenance issues.
                  </span>
                </div>
                <Switch 
                  defaultChecked 
                  onCheckedChange={(checked) => handleNotificationToggle('SMS', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" /> Push Notifications
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Receive real-time push notifications on your devices.
                  </span>
                </div>
                <Switch 
                  defaultChecked 
                  onCheckedChange={(checked) => handleNotificationToggle('Push', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Categories</CardTitle>
              <CardDescription>
                Select which types of events you want to be notified about.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                <Label className="flex-1 cursor-pointer" htmlFor="new-tenant">New Tenant Applications</Label>
                <Switch id="new-tenant" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                <Label className="flex-1 cursor-pointer" htmlFor="rent-payment">Rent Payments</Label>
                <Switch id="rent-payment" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                <Label className="flex-1 cursor-pointer" htmlFor="maintenance">Maintenance Requests</Label>
                <Switch id="maintenance" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                <Label className="flex-1 cursor-pointer" htmlFor="marketing">Marketing & Tips</Label>
                <Switch id="marketing" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Password Management</CardTitle>
                  <CardDescription>
                    Ensure your account is secure by using a strong password.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="current-password" 
                      type={showCurrentPassword ? "text" : "password"} 
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showNewPassword ? "text" : "password"} 
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long and contain special characters.
                  </p>
                </div>
                <Button type="submit" className="mt-2">Update Password</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">Authenticator App</span>
                  <span className="text-sm text-muted-foreground">
                    Use an app like Google Authenticator or Authy to generate verification codes.
                  </span>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">SMS Verification</span>
                  <span className="text-sm text-muted-foreground">
                    Receive verification codes via SMS to your registered phone number.
                  </span>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your dashboard.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col space-y-1">
                  <Label>Theme Preference</Label>
                  <span className="text-sm text-muted-foreground">
                    Select a theme that suits your working environment.
                  </span>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" /> Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" /> Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Laptop className="h-4 w-4" /> System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Regional Settings</CardTitle>
                  <CardDescription>
                    Set your preferred language and timezone.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="en-gb">English (UK)</SelectItem>
                      <SelectItem value="sw">Swahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="eat">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                      <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
