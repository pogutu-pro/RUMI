'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAsync } from '@/hooks/use-async';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Shell } from '@/components/layouts/shell';
import { logger } from '@/lib/logger';
import { Spinner } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/error-state';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Skeleton } from '@/components/ui/skeleton';

export default function ErrorTestPage() {
  const [shouldExplode, setShouldExplode] = useState(false);
  const { run, ...asyncState } = useAsync();

  if (shouldExplode) {
    throw new Error('This is a manually triggered crash for testing the ErrorBoundary.');
  }

  const handleAsyncSuccess = () => {
    run(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve('Operation successful!');
        }, 2000);
      })
    );
  };

  const handleAsyncError = () => {
    run(
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('This is a simulated async error.'));
        }, 2000);
      })
    );
  };

  const handleLogTest = () => {
    logger.info('Info log test', { foo: 'bar' });
    logger.warn('Warning log test');
    logger.error('Error log test', new Error('Test error'));
    alert('Logs printed to console. Check DevTools.');
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold">Error Handling & UI/UX Debugger</h1>
            <p className="text-muted-foreground">Use this page to verify the premium error handling components.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
            <CardHeader>
                <CardTitle>Global Error Boundary</CardTitle>
                <CardDescription>Triggers a full page crash.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    variant="destructive" 
                    onClick={() => setShouldExplode(true)}
                    className="w-full"
                >
                Trigger React Crash
                </Button>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Global Logger</CardTitle>
                <CardDescription>Writes to console with custom styling.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    variant="outline" 
                    onClick={handleLogTest}
                    className="w-full"
                >
                Test Logger
                </Button>
            </CardContent>
            </Card>

            <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Async State Machine (useAsync & AsyncBoundary)</CardTitle>
                <CardDescription>Test the premium loading and error states for async operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4">
                    <Button onClick={handleAsyncSuccess} disabled={asyncState.isLoading}>
                        Trigger Success (2s)
                    </Button>
                     <Button onClick={() => run(new Promise(r => setTimeout(r, 3000)))} disabled={asyncState.isLoading}>
                        Trigger Long Load (Page Style)
                    </Button>
                    <Button variant="secondary" onClick={handleAsyncError} disabled={asyncState.isLoading}>
                        Trigger Error (2s)
                    </Button>
                    <Button variant="ghost" onClick={asyncState.reset} disabled={asyncState.isIdle}>
                        Reset
                    </Button>
                </div>

                <div className="border rounded-lg p-6 min-h-[300px] flex items-center justify-center bg-muted/10 relative">
                   {/* We can dynamically switch mode for demo purposes or just show one */}
                    <AsyncBoundary 
                        {...asyncState} 
                        onRetry={handleAsyncError}
                        mode="page" // Testing the page loader mode
                    >
                        {asyncState.data ? (
                            <div className="text-green-600 font-bold text-xl animate-in zoom-in">
                                🎉 {asyncState.data}
                            </div>
                        ) : (
                            <div className="text-muted-foreground">
                                Idle state. Click a button to start. (Using "Page" mode loader)
                            </div>
                        )}
                    </AsyncBoundary>
                </div>
            </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Component: Spinner & LogoLoader</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around items-center flex-wrap gap-4">
                    <div className="p-4 border rounded"><Spinner size="lg" /></div>
                    <div className="p-4 border rounded bg-slate-100"><LogoLoader width={40} height={40} /></div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Component: Skeleton</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-200 animate-pulse dark:bg-zinc-800" />
                        <div className="space-y-2">
                        <div className="h-4 w-[250px] bg-zinc-200 animate-pulse dark:bg-zinc-800 rounded" />
                        <div className="h-4 w-[200px] bg-zinc-200 animate-pulse dark:bg-zinc-800 rounded" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </Shell>
  );
}
