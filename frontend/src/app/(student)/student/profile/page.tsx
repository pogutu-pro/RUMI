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
  const { data: dashboardData } = useStudentDashboard();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Use real profile completion from dashboard API, fallback to 0
  const profileCompletion = dashboardData?.profileCompletion ?? 0;

  const handleLogout = () => {
    logout();
    // Redirect handled by logout function
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Connect to actual delete account API
    // For now, show confirmation and logout
    console.log('Delete account requested');
    setShowDeleteDialog(false);
    // After API call succeeds, logout
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
      completion: 100,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: School,
      title: 'Student Details',
      description: 'University, program, and year of study',
      href: '/student/profile/student-info',
      completion: 80,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      icon: Settings,
      title: 'Preferences',
      description: 'Roommate matching and living preferences',
      href: '/student/profile/preferences',
      completion: 60,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage email, SMS, and push notifications',
      href: '/student/settings?tab=notifications',
      completion: 50,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Password, 2FA, and privacy settings',
      href: '/student/profile/security',
      completion: 70,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      icon: CreditCard,
      title: 'Payment Methods',
      description: 'Manage cards, M-PESA, and billing info',
      href: '/student/payments/methods',
      completion: 100,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
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
      <motion.div variants={item} className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-900 dark:to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <User className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl">
              <AvatarImage src={user?.avatar} className="object-cover" />
              <AvatarFallback className="bg-white/10 text-white text-4xl font-bold backdrop-blur-sm">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 bg-emerald-500 rounded-full p-1.5 border-2 border-white shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {user?.first_name} {user?.last_name}
              </h1>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                <Award className="w-3 h-3 mr-1" />
                Student
              </Badge>
            </div>
            
            <p className="text-emerald-100 text-lg font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-sm text-emerald-50 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5" />
                Nairobi, Kenya
              </div>
              <div className="flex items-center gap-1.5 text-sm text-emerald-50 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5" />
                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <Button 
              asChild 
              className="bg-white text-emerald-700 hover:bg-emerald-50 border-0 shadow-lg font-semibold"
            >
              <Link href="/student/profile/edit">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
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
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profileCompletion}%</span>
              </CardTitle>
              <CardDescription>Complete your profile to get better matches</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={profileCompletion} className="h-3 mb-4" />
              <div className="space-y-3">
                {profileCompletion < 100 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
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
                    <p className="text-xs text-muted-foreground">Not set</p>
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
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-muted hover:border-emerald-200 dark:hover:border-emerald-800 group overflow-hidden relative">
                    <div className={cn("absolute top-0 left-0 w-1 h-full transition-all duration-300 opacity-0 group-hover:opacity-100", section.bgColor.replace('/20', ''))} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-300", section.color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/30'))}>
                          <section.icon className={cn("w-6 h-6", section.color)} />
                        </div>
                        {section.completion === 100 ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {section.completion}% Done
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
