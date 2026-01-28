'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRoommateQuiz } from '@/features/roommates';
import { QuestionCard } from '@/features/roommates';
import { QuizProgress } from '@/features/roommates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StandaloneQuizPage() {
  const router = useRouter();
  const quiz = useRoommateQuiz();
  
  // States to track the UX flow
  const [phase, setPhase] = React.useState<'intro' | 'quiz' | 'results'>('intro');

  // Sync phase with quiz state on mount/change
  React.useEffect(() => {
    if (quiz.quizState.isComplete) {
      setPhase('results');
    } else if (quiz.quizState.startedAt && phase === 'intro') {
      setPhase('quiz');
    }
  }, [quiz.quizState, phase]);

  const handleStart = () => {
    quiz.startQuiz();
    setPhase('quiz');
  };

  const handleFinish = async () => {
    const success = await quiz.submitQuiz();
    if (success) {
      router.push('/student/roommates');
    }
  };

  // --- INTRO PHASE ---
  if (phase === 'intro') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          <Card className="border border-border/50 shadow-sm overflow-hidden relative">
            <CardHeader className="text-center pt-10 pb-6 space-y-6">
              <div className="inline-block mx-auto relative">
                <Image
                    src="/images/logo/logo.svg"
                    alt="RUMI Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Compatibility Assessment
                </h1>
                <p className="text-muted-foreground text-sm font-medium px-4">
                  Complete this brief questionnaire to help us identify potential roommates who match your academic and lifestyle preferences.
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 px-8 pb-10">
              <div className="grid grid-cols-3 gap-4">
                 <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
                    <span className="block text-xl font-bold text-foreground">10</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Questions</span>
                 </div>
                 <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
                    <span className="block text-xl font-bold text-foreground">~3</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Minutes</span>
                 </div>
                 <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
                    <span className="block text-xl font-bold text-foreground">High</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Precision</span>
                 </div>
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full h-12 font-bold text-base"
                  onClick={handleStart}
                >
                  Start Assessment
                </Button>

                {quiz.quizState.answers.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full h-12 font-bold text-muted-foreground"
                    onClick={() => setPhase('quiz')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resume Assessment ({quiz.progress.answeredCount}/{quiz.progress.total})
                  </Button>
                )}
                
                <Button variant="ghost" className="w-full text-muted-foreground text-xs" asChild>
                    <Link href="/student/roommates">Skip for now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- QUIZ PHASE ---
  if (phase === 'quiz' && quiz.currentQuestion) {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 py-12 bg-background">
         <div className="w-full max-w-3xl space-y-10">
            {/* Progress Wrapper */}
            <div className="px-4">
               <QuizProgress
                current={quiz.progress.current}
                total={quiz.progress.total}
                percentage={quiz.progress.percentage}
                isComplete={quiz.quizState.isComplete}
              />
            </div>

            {/* Premium Card Area */}
            <div className="min-h-[400px]">
                <QuestionCard
                    key={quiz.currentQuestion.id}
                    question={quiz.currentQuestion}
                    selectedAnswer={quiz.currentAnswer?.answerId}
                    onSelect={(id) => quiz.answerQuestion(id)}
                    onNext={() => {
                       if (quiz.isLastQuestion) setPhase('results');
                       else quiz.nextQuestion();
                    }}
                    showRandomButton={false}
                />
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between px-4 gap-4 border-t border-border/50 pt-8 mt-4">
                <Button
                    variant="ghost"
                    onClick={quiz.previousQuestion}
                    disabled={!quiz.canGoPrevious}
                    className="px-6 font-bold"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                </Button>

                <div className="hidden md:flex gap-2">
                    {Array.from({ length: quiz.progress.total }).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => quiz.goToQuestion(idx)}
                        className={cn(
                        'w-2 h-2 rounded-full transition-all duration-300',
                        idx === quiz.quizState.currentQuestionIndex
                            ? 'bg-primary w-6'
                            : quiz.quizState.answers.some(a => a.questionId === quiz.currentQuestion?.id)
                            ? 'bg-primary/30'
                            : 'bg-muted'
                        )}
                    />
                    ))}
                </div>

                <Button
                    onClick={() => {
                        if (quiz.isLastQuestion) setPhase('results');
                        else quiz.nextQuestion();
                    }}
                    disabled={!quiz.canGoNext}
                    className={cn(
                        "px-8 font-bold",
                        quiz.isLastQuestion ? "bg-primary" : ""
                    )}
                >
                    {quiz.isLastQuestion ? 'Review Summary' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
         </div>
      </div>
    );
  }

  // --- RESULTS PHASE (Celebration) ---
  if (phase === 'results') {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-10">
            <div className="space-y-8">
                <div className="inline-block relative mx-auto">
                    <Image
                        src="/images/logo/logo.svg"
                        alt="RUMI Logo"
                        width={96}
                        height={96}
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="space-y-3">
                    <h2 className="text-4xl font-bold tracking-tight text-foreground">Assessment Complete</h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto">
                        Your compatibility profile has been updated. We are now identifying potential matches for you.
                    </p>
                </div>

                <div className="flex flex-col gap-3 max-w-sm mx-auto pt-6">
                    <Button
                        size="lg"
                        onClick={handleFinish}
                        disabled={quiz.isSubmitting}
                        className="h-14 rounded-xl font-bold text-lg"
                    >
                        {quiz.isSubmitting ? 'Processing...' : 'View My Matches'}
                        <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => { quiz.resetQuiz(); setPhase('intro'); }}>
                        Retake Assessment
                    </Button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return null;
}
