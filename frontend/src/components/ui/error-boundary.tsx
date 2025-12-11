'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw, AlertOctagon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Shell } from '@/components/layouts/shell';
import { logger } from '@/lib/logger';

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
    logger.error('Uncaught error in ErrorBoundary:', { error, errorInfo });
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
        <Shell variant="centered" className="min-h-[80vh] flex items-center justify-center p-4">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-lg"
            >
              <Card className="border-border/50 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <CardHeader className="text-center pb-2">
                   <div className="mx-auto bg-destructive/10 p-4 rounded-full mb-4 w-fit">
                        <AlertOctagon className="h-10 w-10 text-destructive" />
                   </div>
                   <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Something went wrong
                   </h1>
                   <p className="text-muted-foreground mt-2">
                        We encountered an unexpected error. Our team has been notified.
                   </p>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Dev-only error details */}
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-md bg-muted p-4 text-xs font-mono text-left overflow-auto max-h-[200px] border border-border"
                    >
                      <p className="font-semibold text-destructive mb-1">Debug Error:</p>
                      {this.state.error.message}
                      {this.state.error.stack && (
                          <pre className="mt-2 opacity-70 whitespace-pre-wrap">{this.state.error.stack}</pre>
                      )}
                    </motion.div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pb-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={this.reset}
                      className="w-full sm:w-auto min-w-[140px]"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button 
                        size="lg" 
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto min-w-[140px]"
                        variant="secondary"
                    >
                      Reload Page
                    </Button>
                    <Button variant="default" size="lg" asChild className="w-full sm:w-auto min-w-[140px]">
                      <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Shell>
      );
    }

    return this.props.children;
  }
}
