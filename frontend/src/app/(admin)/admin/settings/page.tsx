"use client";

import { useState } from "react";
import { 
  User, 
  Bell, 
  Mail,
  Loader2,
  Lock,
  Globe,
  ShieldAlert,
  QrCode,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/features/users";
import { useUpdateProfile, useUploadProfileImage } from "@/features/profile";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/features/notifications";
import { useEnable2FA, useVerify2FA, useDisable2FA, useChangePassword } from "@/features/auth/hooks/use-security"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const { user } = useUser();
  const updateProfileMutation = useUpdateProfile();
  const uploadImageMutation = useUploadProfileImage();
  
  const { data: preferences, isLoading: isLoadingPrefs } = useNotificationPreferences();
  const updatePreferencesMutation = useUpdateNotificationPreferences();

  const enable2FAMutation = useEnable2FA();
  const verify2FAMutation = useVerify2FA();
  const disable2FAMutation = useDisable2FA();
  const changePasswordMutation = useChangePassword();

  const [formData, setFormData] = useState({
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
  });
  
  const [passwordData, setPasswordData] = useState({
      current: "", 
      new: "", 
      confirm: ""
  });

  const [otpCode, setOtpCode] = useState("");
  const [setupData, setSetupData] = useState<{ qr_code?: string, secret?: string } | null>(null);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handlAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      uploadImageMutation.mutate(file);
    } else if (file) {
        toast.error("Image too large");
    }
  };

  const handleStart2FA = () => {
      enable2FAMutation.mutate(undefined, {
          onSuccess: (data: any) => {
              // Assuming payload has qr_code (base64 or url)
              setSetupData(data?.data || data); 
          }
      });
  };

  const handleVerify2FA = () => {
      verify2FAMutation.mutate(otpCode, {
          onSuccess: () => setSetupData(null) // Close setup UI on success
      });
  };

  const handleChangePassword = () => {
      if (passwordData.new !== passwordData.confirm) {
          toast.error("New passwords do not match");
          return;
      }
      changePasswordMutation.mutate({
          current_password: passwordData.current,
          new_password: passwordData.new
      });
  };

  const isProfileLoading = updateProfileMutation.isPending || uploadImageMutation.isPending;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account, security, and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted p-1 border border-border w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="security"><Lock className="w-4 h-4 mr-2" /> Security</TabsTrigger>
          <TabsTrigger value="platform"><Globe className="w-4 h-4 mr-2" /> Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="flex flex-col items-center gap-4">
                       <Avatar className="w-24 h-24 border-2 border-border">
                           <AvatarImage src={user?.avatar || user?.profile_picture} />
                           <AvatarFallback>{user?.first_name?.[0]}</AvatarFallback>
                       </Avatar>
                       <Label htmlFor="avatar-upload" className="cursor-pointer border border-input bg-background hover:bg-accent h-9 px-3 flex items-center rounded-md text-sm">Change</Label>
                       <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handlAvatarUpload} />
                   </div>
                   <div className="grid gap-4 flex-1 w-full">
                       <div className="grid gap-4 md:grid-cols-2">
                           <div className="space-y-2">
                               <Label htmlFor="firstName">First Name</Label>
                               <Input id="firstName" value={formData.firstName} onChange={handleProfileChange} />
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="lastName">Last Name</Label>
                               <Input id="lastName" value={formData.lastName} onChange={handleProfileChange} />
                           </div>
                       </div>
                       <div className="space-y-2">
                           <Label>Email</Label>
                           <Input value={user?.email} disabled className="bg-muted/50" />
                       </div>
                   </div>
               </div>
            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4 flex justify-end">
                <Button onClick={() => updateProfileMutation.mutate(formData)} disabled={isProfileLoading}>
                    {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
                <CardHeader>
                    <CardTitle>Email Preferences</CardTitle>
                    <CardDescription>Control which emails you receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                         <Label>Marketing Emails</Label>
                         <Switch 
                            checked={preferences?.marketingEmails} 
                            onCheckedChange={(c) => updatePreferencesMutation.mutate({ ...preferences, marketingEmails: c } as any)} 
                         />
                     </div>
                     <div className="flex items-center justify-between">
                         <Label>Security Alerts</Label>
                         <Switch checked={true} disabled /> {/* Always on */}
                     </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
            {/* 2FA Section */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
                <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {user?.is_2fa_enabled ? (
                        <div className="flex items-center justify-between p-4 border border-emerald-500/20 bg-emerald-500/10 rounded-lg">
                             <div className="flex items-center gap-3">
                                 <ShieldAlert className="text-emerald-600 h-6 w-6" />
                                 <div>
                                     <p className="font-medium text-emerald-900 dark:text-emerald-100">2FA is Enabled</p>
                                     <p className="text-xs text-emerald-700 dark:text-emerald-300">Your account is secure.</p>
                                 </div>
                             </div>
                             <Button variant="destructive" size="sm" onClick={() => disable2FAMutation.mutate()}>Disable</Button>
                        </div>
                    ) : setupData ? (
                        <div className="space-y-4 border p-4 rounded-lg bg-background/50">
                             <div className="flex flex-col items-center gap-4">
                                 <p className="text-sm text-center">Scan this QR code with your authenticator app.</p>
                                 {setupData.qr_code && (
                                     <img src={setupData.qr_code} alt="2FA QR Code" className="w-48 h-48 border rounded-lg" />
                                 )}
                                 <div className="flex gap-2 w-full max-w-xs">
                                     <Input placeholder="Enter 6-digit code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                                     <Button onClick={handleVerify2FA} disabled={verify2FAMutation.isPending}>Verify</Button>
                                 </div>
                             </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium">Enable 2FA</p>
                                <p className="text-sm text-muted-foreground">Use an authenticator app to generate OTPs.</p>
                            </div>
                            <Button onClick={handleStart2FA} disabled={enable2FAMutation.isPending}>Setup 2FA</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} /></div>
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} /></div>
                </CardContent>
                <CardFooter className="bg-muted/30 px-6 py-4 flex justify-end">
                    <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>Update Password</Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="platform" className="space-y-6">
            <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
                <CardHeader><CardTitle>Platform Controls</CardTitle></CardHeader>
                <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Maintenance Mode</Label>
                            <p className="text-sm text-muted-foreground">Disable system access.</p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
