'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoommateQuiz } from '@/hooks/use-roommate-quiz';
import { useRoommateMatches, useSendRoommateRequest } from '@/hooks/use-roommates';
import { QuestionCard } from '@/components/roommates/question-card';
import { QuizProgress } from '@/components/roommates/quiz-progress';
import { MatchCard } from '@/components/roommates/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


export default function MatchesPage() {
  const quiz = useRoommateQuiz();
  const { data: matches, isLoading: matchesLoading } = useRoommateMatches();
  const sendRequest = useSendRoommateRequest();
  const [sentRequests, setSentRequests] = React.useState<Set<string>>(new Set());

  // Determine current phase
  const [currentPhase, setCurrentPhase] = React.useState<'intro' | 'quiz' | 'results' | 'matches'>('intro');

  React.useEffect(() => {
    if (quiz.quizState.isComplete) {
      setCurrentPhase('results');
    } else if (quiz.quizState.startedAt) {
      setCurrentPhase('quiz');
    } else if (matches && matches.length > 0) {
      // User has already completed quiz
      setCurrentPhase('matches');
    }
  }, [quiz.quizState, matches]);

  const handleSendRequest = async (matchId: string) => {
    try {
      await sendRequest.mutateAsync({ userId: matchId });
      setSentRequests(prev => new Set(prev).add(matchId));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleQuizSubmit = async () => {
    const success = await quiz.submitQuiz();
    if (success) {
      setTimeout(() => {
        setCurrentPhase('matches');
      }, 2000);
    }
  };

  // Intro Phase
  if (currentPhase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="text-center space-y-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block mx-auto"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-white fill-white" />
                </div>
              </motion.div>
              
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Find Your Perfect Roommate
                </h1>
                <p className="text-lg text-muted-foreground">
                  Take our fun 10-question personality quiz to discover highly compatible roommates!
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">10</div>
                  <div className="text-sm text-muted-foreground">Fun Questions</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-3xl font-bold text-blue-600 mb-1">~3</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="text-3xl font-bold text-purple-600 mb-1">100%</div>
                  <div className="text-sm text-muted-foreground">Personalized</div>
                </div>
              </div>

              {/* What We Match */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  What we match on:
                </h3>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Sleep schedules & daily routines
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Cleanliness & lifestyle preferences
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Social habits & study styles
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    Interests & personality traits
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 text-white shadow-xl shadow-emerald-600/20"
                onClick={quiz.startQuiz}
              >
                <Heart className="h-5 w-5 mr-2" />
                Start Personality Quiz
              </Button>

              {quiz.quizState.answers.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentPhase('quiz')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Continue Previous Quiz ({quiz.progress.answeredCount}/10 answered)
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Quiz Phase
  if (currentPhase === 'quiz' && quiz.currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-4xl space-y-8">
          {/* Progress */}
          <QuizProgress
            current={quiz.progress.current}
            total={quiz.progress.total}
            percentage={quiz.progress.percentage}
            isComplete={quiz.quizState.isComplete}
          />

          {/* Question */}
          <AnimatePresence mode="wait">
            <QuestionCard
              key={quiz.currentQuestion.id}
              question={quiz.currentQuestion}
              selectedAnswer={quiz.currentAnswer?.answerId}
              onSelect={quiz.answerQuestion}
              onNext={quiz.isLastQuestion ? undefined : quiz.nextQuestion}
              onRandom={quiz.randomAnswer}
            />
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={quiz.previousQuestion}
              disabled={!quiz.canGoPrevious}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: quiz.progress.total }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => quiz.goToQuestion(idx)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    idx === quiz.quizState.currentQuestionIndex
                      ? 'bg-emerald-600 w-8'
                      : quiz.quizState.answers.some(a => a.questionId === quiz.currentQuestion.id)
                      ? 'bg-emerald-300'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>

            {quiz.isLastQuestion ? (
              <Button
                onClick={() => setCurrentPhase('results')}
                disabled={!quiz.canGoNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                View Results
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={quiz.nextQuestion}
                disabled={!quiz.canGoNext}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/roommates">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roommates
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
  if (currentPhase === 'results') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full text-center space-y-8"
        >
          <QuizProgress
            current={quiz.progress.total}
            total={quiz.progress.total}
            percentage={100}
            isComplete={true}
          />

          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="inline-block"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            <h2 className="text-4xl font-bold">Quiz Complete!</h2>
            <p className="text-lg text-muted-foreground">
              We're now finding your best matches based on your personality...
            </p>

            <Button
              size="lg"
              onClick={handleQuizSubmit}
              disabled={quiz.isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl"
            >
              {quiz.isSubmitting ? 'Finding Matches...' : 'See My Matches'}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Matches Phase
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Roommate Matches</h1>
          <p className="text-muted-foreground mt-1">
            Based on your personality quiz results
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={quiz.resetQuiz}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Quiz
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/roommates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Matches */}
      {matchesLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto mt-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <>
          {/* Top 3 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
                <Sparkles className="h-3 w-3 mr-1" />
                Top Matches
              </Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches.slice(0, 3).map((match: any) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSendRequest={() => handleSendRequest(match.matchedUser?.id || match.id)}
                  isRequestSent={sentRequests.has(match.matchedUser?.id || match.id)}
                />
              ))}
            </div>
          </div>

          {/* All Other Matches */}
          {matches.length > 3 && (
            <div>
              <h2 className="text-xl font-bold mb-4">More Compatible Matches</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {matches.slice(3).map((match: any) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    variant="compact"
                    onSendRequest={() => handleSendRequest(match.matchedUser?.id || match.id)}
                    isRequestSent={sentRequests.has(match.matchedUser?.id || match.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Complete the personality quiz to find compatible roommates!
            </p>
            <Button onClick={() => setCurrentPhase('intro')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Heart className="h-4 w-4 mr-2" />
              Take Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
