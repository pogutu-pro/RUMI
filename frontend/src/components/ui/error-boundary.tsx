'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shell } from '@/components/layouts/shell';

interface ErrorBoundaryProps {
  children: React.ReactNode;

  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Send to Sentry / Datadog / LogRocket in production
    console.error('Uncaught error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Shell variant="centered" className="min-h-[70vh]">
          <Card className="max-w-lg mx-auto text-center shadow-2xl border-destructive/20">
            <CardContent className="pt-10 pb-12 px-8">
              <AlertTriangle
                className="h-16 w-16 mx-auto text-destructive mb-6"
                aria-hidden="true"
              />

              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Something went wrong
              </h1>

              <p className="text-muted-foreground text-base max-w-md mx-auto mb-8">
                We are sorry — an unexpected error occurred. You can try again,
                refresh the page, or return to the dashboard.
              </p>

              {/* Dev-only error details (never shown in production build) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-8 text-left bg-muted/50 rounded-lg p-4 text-sm">
                  <summary className="font-medium text-destructive cursor-pointer mb-2">
                    Debug info (dev only)
                  </summary>
                  <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={this.reset}
                  className="min-w-40"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button size="lg" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
                <Button variant="default" size="lg" asChild>
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Shell>
      );
    }

    return this.props.children;
  }
}
