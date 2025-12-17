'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { useStudentDashboard } from '@/features/student/hooks/use-student-dashboard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Settings,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  Award,
  School,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  // const { data: dashboardData } = useStudentDashboard(); // calculate locally instead
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Calculate profile completion dynamically
  const profileCompletion = React.useMemo(() => {
    if (!user) return 0;
    let score = 0;
    const totalWeight = 100;
    
    // Basic Info (40%)
    if (user.first_name) score += 10;
    if (user.last_name) score += 10;
    if (user.email) score += 10;
    if (user.phone_number) score += 10;
    
    // Profile Picture (20%)
    if (user.avatar || (user as any).profile?.avatar) score += 20;

    // Check for educational details
    if ((user as any).university) score += 20;
    if ((user as any).student_id) score += 20;

    // Cap at 100
    // Simplify for now: Just check basic fields
    const filledFields = [
        user.first_name, 
        user.last_name, 
        user.email, 
        user.phone_number,
        user.avatar
    ].filter(Boolean).length;
    
    return Math.min(Math.round((filledFields / 5) * 100), 100);
  }, [user]);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion API when available
    console.log('Delete account requested');
    setShowDeleteDialog(false);
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }; 
  
  const settingsSections = [
    {
      icon: User,
      title: 'Personal Information',
      description: 'Update your name, email, and contact details',
      href: '/student/profile/edit',
      completion: user?.first_name && user?.last_name && user?.email ? 100 : 50,
    },
    {
      icon: School,
      title: 'Student Details',
      description: 'University, program, and year of study',
      href: '/student/profile/student-info',
      completion: (user as any)?.university ? 100 : 0,
    },
    {
      icon: Settings,
      title: 'Preferences',
      description: 'Roommate matching and living preferences',
      href: '/student/profile/preferences',
      completion: 0, 
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage email, SMS, and push notifications',
      href: '/student/notifications',
      completion: 100,
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Password, 2FA, and privacy settings',
      href: '/student/settings',
      completion: 100,
    },
    {
      icon: CreditCard,
      title: 'Payment Methods',
      description: 'Manage cards, M-PESA, and billing info',
      href: '/student/payments/methods',
      completion: 100,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* Header Section */}
      <motion.div variants={item} className="relative rounded-3xl overflow-hidden bg-card border shadow-sm p-8">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={user?.avatar} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 bg-emerald-500 rounded-full p-1.5 border-2 border-background shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {user?.first_name} {user?.last_name}
              </h1>
              <Badge variant="secondary" className="backdrop-blur-md">
                <Award className="w-3 h-3 mr-1" />
                Student
              </Badge>
            </div>
            
            <p className="text-muted-foreground text-lg font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>


          <div className="flex flex-col gap-3 min-w-[200px]">
            <Button 
              asChild 
              className="font-semibold shadow-md"
            >
              <Link href="/student/profile/edit">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="bg-background/50 backdrop-blur-sm hover:bg-muted"
            >
              <Link href="/student/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column - Stats & Completion */}
        <motion.div variants={item} className="space-y-6">
          {/* Profile Completion Card */}
          <Card className="overflow-hidden border-0 shadow-lg bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                Profile Strength
                <span className={cn("text-2xl font-bold", profileCompletion === 100 ? "text-primary" : "text-amber-500")}>
                  {profileCompletion}%
                </span>
              </CardTitle>
              <CardDescription>Complete your profile to get better matches</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={profileCompletion} className="h-3 mb-4" />
              <div className="space-y-3">
                {profileCompletion < 100 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Action Required</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Add your university details and preferences to reach 100%
                      </p>
                      <Link href="/student/profile/student-info" className="text-xs font-semibold text-amber-600 hover:underline flex items-center mt-1">
                        Complete now <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-xs text-muted-foreground">{user?.phone_number || 'Not added'}</p>
                  </div>
                </div>
                {!user?.phone_number && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                    <Link href="/student/profile/edit"><Edit className="w-3 h-3" /></Link>
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">University</p>
                    <p className="text-xs text-muted-foreground">{(user as any)?.university || 'Not set'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <Link href="/student/profile/student-info"><Edit className="w-3 h-3" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Navigation Grid */}
        <motion.div variants={item} className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-4">Profile & Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {settingsSections.map((section) => (
                <Link key={section.title} href={section.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/50 group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300 opacity-0 group-hover:opacity-100 bg-primary" />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 bg-primary/5 text-primary">
                          <section.icon className="w-6 h-6" />
                        </div>
                        {section.completion === 100 ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {section.completion}% Done
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {section.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="w-full max-w-[100px]">
                          <Progress value={section.completion} className="h-1.5" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex-1 justify-start text-destructive hover:bg-destructive hover:text-white border-destructive/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                className="flex-1 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account Confirmation Dialog */}
          {showDeleteDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteDialog(false)}>
              <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2 text-destructive">Delete Account?</h3>
                <p className="text-muted-foreground mb-6">
                  This action cannot be undone. All your data, bookings, and payment history will be permanently deleted.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Delete My Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
