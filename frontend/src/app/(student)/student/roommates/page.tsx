'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRoommates } from '@/hooks/use-roommates';
import { getQuizCompletionPercentage } from '@/lib/utils/roommate-compatibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  UserPlus, 
  Heart, 
  Users, 
  MessageSquare,
  Settings,
  TrendingUp,
  Calendar,
  MapPin,
  CheckCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function RoommatesPage() {
  const { data: roommates, isLoading } = useRoommates();
  const router = useRouter();

  // Calculate quiz completion from user preferences (would come from API)
  const [quizCompleted, setQuizCompleted] = React.useState(false);
  const [quizProgress, setQuizProgress] = React.useState(0);

  React.useEffect(() => {
    // This would be populated from actual user preferences API
    // For now, check if user has viewed the quiz
    const savedProgress = localStorage.getItem('roommate-quiz-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setQuizProgress((parsed.answers?.length || 0) * 10);
        setQuizCompleted(parsed.isComplete || false);
      } catch (e) {
        setQuizProgress(0);
      }
    }
  }, []);

  const currentRoommates = React.useMemo(() => {
    return roommates?.filter((r: any) => r.status === 'active') || [];
  }, [roommates]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roommates</h1>
          <p className="text-muted-foreground mt-1">
            Connect with compatible roommates and manage your living community.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student/profile/preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Link>
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20" asChild>
            <Link href="/student/roommates/matches">
              <Search className="h-4 w-4 mr-2" />
              Find Matches
            </Link>
          </Button>
        </div>
      </div>

      {/* Quiz CTA (if not completed) */}
      {!quizCompleted && quizProgress < 100 && (
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-purple-950/20">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-2 flex items-center gap-2">
                  {quizProgress > 0 ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Complete Your Personality Quiz
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      Find Your Perfect Roommate Match
                    </>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mb-4">
                  {quizProgress > 0 
                    ? `You're ${quizProgress}% done! Complete the quiz to unlock your top compatible matches.`
                    : 'Take our fun 10-question personality quiz to discover roommates who match your lifestyle and preferences.'
                  }
                </p>
                {quizProgress > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium">{quizProgress}%</span>
                    </div>
                    <Progress value={quizProgress} className="h-2" />
                  </div>
                )}
                <Button 
                  className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 text-white shadow-lg"
                  asChild
                >
                  <Link href="/student/roommates/matches">
                    <Heart className="h-4 w-4 mr-2" />
                    {quizProgress > 0 ? 'Continue Quiz' : 'Start Personality Quiz'}
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-background border-emerald-100 dark:border-emerald-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Roommates</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                  {currentRoommates.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Compatibility</p>
                <p className="text-3xl font-bold mt-2">
                  {currentRoommates[0]?.compatibilityScore || 85}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" />
              <span>+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold mt-2">2</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <Button variant="link" className="mt-3 h-auto p-0 text-xs" asChild>
              <Link href="/student/roommates/requests">View all requests →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Current Roommates (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600" />
              Your Roommates
            </h2>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : currentRoommates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {currentRoommates.map((roommate: any) => (
                <Card key={roommate.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-background ring-2 ring-emerald-100 dark:ring-emerald-900/50">
                        <AvatarImage src={roommate.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-blue-500 text-white text-lg font-bold">
                          {roommate.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg truncate group-hover:text-emerald-600 transition-colors">
                              {roommate.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {roommate.program}
                            </p>
                          </div>
                          {roommate.isPrimaryContact && (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Year {roommate.year}
                          </Badge>
                          {roommate.compatibilityScore && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                              <span className="font-medium">{roommate.compatibilityScore}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="bg-muted/30 p-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild>
                      <Link href={`/student/roommates/${roommate.id}`}>
                        View Profile
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No roommates yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Start by finding compatible roommates through our matching system.
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                  <Link href="/student/roommates/matches">
                    <Search className="h-4 w-4 mr-2" />
                    Find Roommates
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Actions (1/3) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                <Link href="/student/roommates/matches">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                      <Search className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">Browse Matches</div>
                      <div className="text-xs text-muted-foreground">Find compatible roommates</div>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                <Link href="/student/roommates/requests">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">Manage Requests</div>
                      <div className="text-xs text-muted-foreground">View sent & received</div>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                      2
                    </Badge>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                <Link href="/student/profile/preferences">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">Preferences</div>
                      <div className="text-xs text-muted-foreground">Update matching criteria</div>
                    </div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-900/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Complete your profile to get better matches
                </p>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Update preferences regularly for accurate matching
                </p>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Message potential roommates before sending requests
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
