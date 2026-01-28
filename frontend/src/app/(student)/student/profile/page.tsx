'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Mail,
  Phone,
  Edit,
  Settings,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  School,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const profileCompletion = React.useMemo(() => {
    if (!user) return 0;
    let score = 0;
    if (user.first_name) score += 20;
    if (user.last_name) score += 20;
    if (user.email) score += 20;
    if (user.phone_number) score += 20;
    if (user.profile_picture || user.avatar) score += 20;
    return Math.min(score, 100);
  }, [user]);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }; 
  
  const accountSections = [
    {
      icon: User,
      title: 'Identity Verification',
      description: 'Review and update your legal registry information including contact endpoints.',
      href: '/student/profile/edit',
      completion: user?.first_name && user?.last_name && user?.email && user?.phone_number ? 100 : 0,
    },
    {
      icon: School,
      title: 'Academic Credentials',
      description: 'Institutional affiliation, program of study, and academic year settings.',
      href: '/student/roommates/preferences',
      completion: 0,
    },
    {
       icon: FileText,
       title: 'Roommate Preferences',
       description: 'Configure behavioral and operational preferences for dormitory matching.',
       href: '/student/roommates/preferences',
       completion: 0,
    },
    {
      icon: Bell,
      title: 'Communication Routing',
      description: 'Configure automated alert systems for billing and facility operations.',
      href: '/student/notifications',
      completion: 100,
    },
    {
      icon: Shield,
      title: 'Security Protocols',
      description: 'Credential management, multi-factor authentication, and data access logs.',
      href: '/student/settings',
      completion: 100,
    },
    {
      icon: CreditCard,
      title: 'Financial Integration',
      description: 'Manage clearing accounts, recurring payment nodes, and billing history.',
      href: '/student/payments/methods',
      completion: 100,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16">
      {/* Identity Card */}
      <div className="relative border-b border-border/50 pb-12 pt-4">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start max-w-5xl">
          <div className="relative shrink-0">
            <Avatar className="h-40 w-40 border-4 border-background shadow-lg rounded-2xl">
              <AvatarImage src={user?.profile_picture || user?.avatar} className="object-cover" />
              <AvatarFallback className="bg-muted text-muted-foreground text-5xl font-bold rounded-2xl">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-lg border-2 border-background shadow-sm">
                <UserCheck className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4 pt-2">
            <div className="space-y-1">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        {user?.first_name} {user?.last_name}
                    </h1>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 h-6 border-border/50 bg-muted/30">
                        Student Account
                    </Badge>
                </div>
                <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-4 h-4 opacity-50" /> {user?.email}
                </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <Button asChild className="font-bold h-10 px-6 rounded-xl shadow-sm">
                    <Link href="/student/profile/edit">
                        <Edit className="w-4 h-4 mr-2" />
                        Modify Registry
                    </Link>
                </Button>
                <Button asChild variant="outline" className="font-bold h-10 px-6 rounded-xl border-border/50">
                    <Link href="/student/settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                    </Link>
                </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-12">
        {/* Left Column - Stats & Status */}
        <div className="xl:col-span-4 space-y-8">
          {/* Integrity Metric Card */}
          <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center justify-between uppercase tracking-widest text-muted-foreground">
                Registry Integrity
                <span className={cn("text-lg font-black", profileCompletion === 100 ? "text-primary" : "text-amber-600")}>
                  {profileCompletion}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Progress value={profileCompletion} className="h-2 mb-6" />
              {profileCompletion < 100 && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-amber-900 leading-relaxed pr-2">
                        Institutional data completeness is required for optimal roommate matching. 
                        Please provide your academic affiliation.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full font-bold h-8 border-amber-500/20 text-amber-600 hover:bg-amber-500/10">
                    <Link href="/student/roommates/preferences">Complete Record</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Directory Card */}
          <Card className="border border-border/50 bg-card shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Contact Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/30 rounded-xl">
                    <div className="flex items-center gap-4">
                        <Phone className="w-4 h-4 text-muted-foreground opacity-50" />
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mobile Contact</p>
                            <p className="text-sm font-bold text-foreground">{user?.phone_number || 'N/A'}</p>
                        </div>
                    </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/30 rounded-xl">
                    <div className="flex items-center gap-4">
                        <Mail className="w-4 h-4 text-muted-foreground opacity-50" />
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Mail</p>
                            <p className="text-sm font-bold text-foreground">{user?.email}</p>
                        </div>
                    </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Nav Grid */}
        <div className="xl:col-span-8 space-y-8">
            <div className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Management Registry</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                {accountSections.map((section) => (
                    <Link key={section.title} href={section.href}>
                    <Card className="h-full bg-card border border-border/50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-2.5 rounded-lg bg-muted border border-border/50 text-foreground opacity-80 group-hover:opacity-100 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                    <section.icon className="w-5 h-5" />
                                </div>
                                {section.completion === 100 ? (
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider text-primary border-primary/20 bg-primary/5">
                                        Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider text-muted-foreground border-border/50">
                                        Pending
                                    </Badge>
                                )}
                            </div>
                            
                            <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                                {section.title}
                            </h3>
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed pr-8 line-clamp-2">
                                {section.description}
                            </p>
                            
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
                                <div className="flex-1 max-w-[80px]">
                                    <Progress value={section.completion} className="h-1" />
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardContent>
                    </Card>
                    </Link>
                ))}
                </div>
            </div>

            {/* Termination Zone */}
            <div className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 px-1">Identity Termination</h2>
                <Card className="border border-destructive/20 bg-destructive/5 shadow-none overflow-hidden">
                    <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="flex-1 font-bold h-11 border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Close Active Session
                        </Button>
                        <Button
                            onClick={() => setShowDeleteDialog(true)}
                            variant="ghost"
                            className="flex-1 font-bold h-11 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                        >
                            Terminate Identity Registry
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Termination Confirmation */}
            {showDeleteDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteDialog(false)}>
                    <div className="bg-background p-10 border border-border/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-destructive">Registry Deletion?</h3>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                Confirmation of identity termination is irreversible. Historical tenancy data, financial logs, and institutional affiliations will be purged from the active registry.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                            <Button variant="outline" className="font-bold rounded-xl h-10 px-6 border-border/50" onClick={() => setShowDeleteDialog(false)}>
                                Abort
                            </Button>
                            <Button variant="destructive" className="font-bold rounded-xl h-10 px-6" onClick={handleDeleteAccount}>
                                Confirm Termination
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
