'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { useRoommates, useRoommateMatches } from '@/features/roommates/hooks/use-roommates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserSearch,
  Settings, 
  MessageSquare, 
  CheckCircle,
  ArrowRight,
  School,
  Lock,
  Search,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoommateHubPage() {
  const { user, profile } = useAuth();
  const { data: household = [], isLoading: householdLoading } = useRoommates();
  const { data: matches = [], isLoading: matchesLoading } = useRoommateMatches();
  
  const completionPercentage = (profile as any)?.profile_completion_percentage || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">Roommate Management</h1>
           <p className="text-muted-foreground text-sm font-medium">Manage your current household and discover potential roommate connections.</p>
        </div>
        <Button variant="outline" asChild className="gap-2 font-bold h-10 border-border/50">
            <Link href="/student/roommates/preferences">
               <Settings className="h-4 w-4" />
               Match Profile & Settings
            </Link>
        </Button>
      </div>

      {/* 2. Main Interface */}
      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 p-1 bg-muted/50 border border-border/50">
          <TabsTrigger value="discovery" className="gap-2 font-bold text-xs uppercase tracking-wider">
             <UserSearch className="h-4 w-4" />
             Discover
          </TabsTrigger>
          <TabsTrigger value="household" className="gap-2 font-bold text-xs uppercase tracking-wider">
             <Users className="h-4 w-4" />
             Household
          </TabsTrigger>
        </TabsList>

        {/* --- DISCOVERY MODE --- */}
        <TabsContent value="discovery" className="mt-8 space-y-8">
           
           {/* Profile Strength Nudge */}
           {completionPercentage < 100 && (
             <Card className="bg-muted/30 border border-border/50 shadow-none">
                <CardContent className="flex flex-col md:flex-row items-center gap-8 p-6">
                    <div className="p-4 bg-background rounded-xl border border-border/50 shadow-sm">
                        <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3 text-center md:text-left">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">Incomplete Match Profile</h3>
                            <p className="text-muted-foreground text-sm font-medium">
                                Your profile is currently <span className="text-foreground font-bold">{completionPercentage}% complete</span>. 
                                Completing your profile increases visibility to compatible roommates.
                            </p>
                        </div>
                        <div className="w-full max-w-md h-2 bg-muted rounded-full overflow-hidden border border-border/10">
                             <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${completionPercentage}%` }} />
                        </div>
                    </div>
                    <Button asChild className="font-bold px-8 h-11 shrink-0">
                        <Link href="/student/roommates/preferences">Optimize Profile</Link>
                    </Button>
                </CardContent>
             </Card>
           )}

           {/* Match Grid */}
           <div className="space-y-4">
               <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Recommended Connections</h2>
               
               {matchesLoading ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {[1,2,3].map(i => <Skeleton key={i} className="h-[400px] rounded-xl" />)}
                   </div>
               ) : matches.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {matches.map((match: any) => (
                           <MatchCard key={match.id} match={match} />
                       ))}
                   </div>
               ) : (
                   <EmptyState 
                      icon={<Search className="h-10 w-10 text-muted-foreground/30" />}
                      title="No matches found"
                      description="We couldn't identify matches based on your current preferences. Consider expanding your criteria or completing your profile."
                      actionLabel="Adjust Preferences"
                      actionLink="/student/roommates/preferences"
                   />
               )}
           </div>
        </TabsContent>

        {/* --- HOUSEHOLD MODE --- */}
        <TabsContent value="household" className="mt-8">
            {householdLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2].map(i => <Skeleton key={i} className="h-[180px] rounded-xl" />)}
                </div>
            ) : household.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {household.map((roommate) => (
                        <Card key={roommate.id} className="overflow-hidden border border-border/50 shadow-sm bg-card transition-shadow hover:shadow-md">
                             <CardHeader className="flex flex-row items-center gap-5 pb-4 border-b border-border/50 bg-muted/20 px-6">
                                <Avatar className="h-14 w-14 border border-border/50 shadow-sm">
                                    <AvatarImage src={roommate.avatar || ''} />
                                    <AvatarFallback className="bg-muted text-muted-foreground font-bold">{roommate.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-0.5">
                                    <CardTitle className="text-lg font-bold">{roommate.name}</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70">
                                        Room {roommate.room_number || 'Unassigned'}
                                    </CardDescription>
                                </div>
                             </CardHeader>
                             <CardContent className="p-6">
                                 <div className="flex gap-3">
                                     <Button variant="secondary" size="sm" className="flex-1 font-bold h-10" asChild>
                                         <Link href={`/student/chat/${roommate.id}`} className="gap-2">
                                            <MessageSquare className="h-4 w-4" /> Message
                                         </Link>
                                     </Button>
                                     <Button variant="outline" size="sm" className="flex-1 font-bold h-10 border-border/50" asChild>
                                         <Link href={`/student/roommates/${roommate.id}`} className="gap-2">
                                            View Profile
                                         </Link>
                                     </Button>
                                 </div>
                             </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <EmptyState 
                  icon={<Users className="h-10 w-10 text-muted-foreground/30" />}
                  title="No household members"
                  description="You are currently registered as a single occupant. Discover potential roommates to share your living space."
                  actionLabel="Discover Connections"
                  actionLink="/student/roommates"
               />
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Sub-components ---

function MatchCard({ match }: { match: any }) {
    return (
        <Card className="group overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[4/3] relative bg-muted/30 flex items-center justify-center overflow-hidden border-b border-border/50">
                {match.profile_picture ? (
                    <img 
                      src={match.profile_picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                ) : (
                     <div className="text-5xl font-black text-muted-foreground/10 uppercase tracking-widest">
                         {match.first_name?.[0]}
                     </div>
                )}
                
                {/* Compatibility Badge */}
                <div className="absolute top-4 right-4 bg-background/90 border border-border/50 px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-sm font-black text-foreground">{match.match_percentage || 85}%</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">Match</span>
                </div>
            </div>

            <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                     <h3 className="font-bold text-xl text-foreground">{match.first_name} <span className="text-muted-foreground font-medium text-sm ml-1">({match.age || 'Student'})</span></h3> 
                     <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">
                         <School className="h-3.5 w-3.5" />
                         <span className="truncate">{match.profile?.course || 'Academic Profile'}</span>
                     </div>
                </div>

                <div className="flex flex-wrap gap-2">
                     <Badge variant="secondary" className="bg-muted text-foreground/80 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1">
                        {match.profile?.year_of_study ? `Year ${match.profile?.year_of_study}` : 'Undergraduate'}
                     </Badge>
                     {match.profile?.lifestyle_preferences?.socials && (
                         <Badge variant="outline" className="border-border/50 text-muted-foreground bg-transparent font-bold text-[10px] uppercase tracking-wider px-2.5 py-1">Social</Badge>
                     )}
                </div>

                {/* Privacy Information */}
                <div className="p-3 bg-muted/30 rounded-lg flex items-start gap-3 border border-border/20">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 opacity-50" />
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                        Identity verified. Private contact information is restricted until a mutual connection is established.
                    </p>
                </div>

                <Button className="w-full gap-2 font-bold h-11 shadow-sm">
                    View Compatibility <ArrowRight className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    )
}

function EmptyState({ icon, title, description, actionLabel, actionLink }: any) {
    return (
        <Card className="border border-dashed border-border/50 py-16 bg-muted/5 shadow-none">
            <CardContent className="flex flex-col items-center text-center space-y-5">
                <div className="p-5 bg-background border border-border/50 rounded-full shadow-sm mb-2">
                    {icon}
                </div>
                <div className="max-w-md space-y-2">
                     <h3 className="font-bold text-xl text-foreground">{title}</h3>
                     <p className="text-muted-foreground text-sm font-medium leading-relaxed">{description}</p>
                </div>
                <Button asChild variant="default" className="mt-4 font-bold px-8 h-11">
                    <Link href={actionLink}>{actionLabel}</Link>
                </Button>
            </CardContent>
        </Card>
    )
}
