'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Shield, 
  Settings,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Mail,
  Smartphone,
  CheckCircle2,
  User,
  LifeBuoy
} from 'lucide-react';
import { useAuth } from '@/features/auth';

// Validation schemas
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function TechSupportSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash || 'profile';
    }
    return 'profile';
  });
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = React.useState({
    newTickets: true,
    ticketUpdates: true,
    mentions: true,
    systemAlerts: true,
    weeklyDigest: false,
  });

  const [pushNotifications, setPushNotifications] = React.useState({
    newTickets: true,
    criticalAlerts: true,
  });

  // Platform preferences
  const [preferences, setPreferences] = React.useState({
    language: 'en',
    timezone: 'kenya/Nairobi',
    autoAssign: true,
    showOnlineStatus: true,
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      console.log('Password change:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully',
      });
      passwordForm.reset();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      console.log('Saving notifications:', { emailNotifications, pushNotifications });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSavePreferences = async () => {
    try {
      console.log('Saving preferences:', preferences);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Preferences saved',
        description: 'Your platform preferences have been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast({
      title: twoFactorEnabled ? '2FA Disabled' : '2FA Enabled',
      description: twoFactorEnabled 
        ? 'Two-factor authentication has been disabled' 
        : 'Two-factor authentication has been enabled',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>First Name</FormLabel>
                  <Input defaultValue={user?.first_name} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <FormLabel>Last Name</FormLabel>
                  <Input defaultValue={user?.last_name} className="bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <FormLabel>Email Address</FormLabel>
                <Input defaultValue={user?.email} disabled className="bg-muted/30" />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
              <div className="space-y-2">
                <FormLabel>Role</FormLabel>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <LifeBuoy className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">Tech Support Agent</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showCurrentPassword ? 'text' : 'password'} 
                              placeholder="Enter current password"
                              className="bg-background/50"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? 'text' : 'password'} 
                              placeholder="Enter new password"
                              className="bg-background/50"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          At least 8 characters with a mix of letters and numbers
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? 'text' : 'password'} 
                              placeholder="Confirm new password"
                              className="bg-background/50"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Enable 2FA</label>
                  <p className="text-xs text-muted-foreground">
                    Require a code from your phone in addition to your password
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleEnable2FA}
                />
              </div>
              {twoFactorEnabled && (
                <>
                  <Separator />
                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="flex gap-2 items-start">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-400">
                          2FA is Active
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-500 mt-1">
                          Your account is protected with two-factor authentication
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Email Notifications */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Notifications
              </CardTitle>
              <CardDescription>Manage which emails you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">New Ticket Alerts</label>
                  <p className="text-xs text-muted-foreground">
                    Receive emails when new tickets are assigned to you
                  </p>
                </div>
                <Switch
                  checked={emailNotifications.newTickets}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({ ...emailNotifications, newTickets: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Ticket Updates</label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when users reply to your tickets
                  </p>
                </div>
                <Switch
                  checked={emailNotifications.ticketUpdates}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({ ...emailNotifications, ticketUpdates: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">System Alerts</label>
                  <p className="text-xs text-muted-foreground">
                    Critical system health and security alerts
                  </p>
                </div>
                <Switch
                  checked={emailNotifications.systemAlerts}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({ ...emailNotifications, systemAlerts: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Push Notifications
              </CardTitle>
              <CardDescription>Real-time browser notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Real-time Ticket Alerts</label>
                  <p className="text-xs text-muted-foreground">
                    Instant notifications for new tickets
                  </p>
                </div>
                <Switch
                  checked={pushNotifications.newTickets}
                  onCheckedChange={(checked) => 
                    setPushNotifications({ ...pushNotifications, newTickets: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications}>
              Save Notification Preferences
            </Button>
          </div>
        </TabsContent>

        {/* Platform Tab */}
        <TabsContent value="platform" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Platform Preferences
              </CardTitle>
              <CardDescription>Customize your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kenya/Nairobi">East kenya Time (EAT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Auto-Assign Tickets</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically accept new tickets when online
                  </p>
                </div>
                <Switch
                  checked={preferences.autoAssign}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, autoAssign: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Show Online Status</label>
                  <p className="text-xs text-muted-foreground">
                    Visible to other agents and admins
                  </p>
                </div>
                <Switch
                  checked={preferences.showOnlineStatus}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, showOnlineStatus: checked })
                  }
                />
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
