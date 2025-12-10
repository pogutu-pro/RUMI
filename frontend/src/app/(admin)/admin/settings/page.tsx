"use client";

import { useState } from "react";
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe,
  Save,
  Mail,
  Smartphone
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";

export default function Page() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account settings and platform preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted p-1 border border-border w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:text-foreground relative">
            <User className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Lock className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="platform" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Globe className="w-4 h-4 mr-2" /> Platform
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-4">
                      <Avatar className="w-24 h-24 border-2 border-border">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>
                  <div className="grid gap-6 flex-1 w-full">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" defaultValue={user?.name || "Admin User"} />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" defaultValue={user?.email || "admin@rumi.app"} className="pl-9" />
                        </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input id="title" defaultValue="System Administrator" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input id="bio" placeholder="Tell us a little about yourself" />
                    </div>
                  </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 px-6 py-4 flex justify-end rounded-b-lg">
                <Button onClick={handleSave} disabled={loading}>
                  {loading && <User className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and authentication methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                    </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                      <Label className="text-base">Two-factor Authentication</Label>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">Recommended</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 px-6 py-4 flex justify-end rounded-b-lg">
                <Button onClick={handleSave}>Update Security</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive daily summaries and critical alerts.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New User Signups</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a new user registers.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Support Tickets</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts for high-priority tickets.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 px-6 py-4 flex justify-end rounded-b-lg">
                <Button onClick={handleSave}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                <CardTitle>Platform Configuration</CardTitle>
                <CardDescription>System-wide settings and maintenance mode.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                        <div className="space-y-0.5">
                            <Label className="text-base">Maintenance Mode</Label>
                            <p className="text-sm text-muted-foreground">Disable access to the platform for users.</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                        <div className="space-y-0.5">
                            <Label className="text-base">New Registrations</Label>
                            <p className="text-sm text-muted-foreground">Allow new users to sign up.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 px-6 py-4 flex justify-end rounded-b-lg">
                    <Button variant="destructive">Save System Changes</Button>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
