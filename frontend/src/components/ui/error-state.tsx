import * as React from 'react';
import Link from 'next/link';
import { Frown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Shell } from '@/components/layouts/shell';
import { cn } from '@/lib/utils/cn';

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  statusCode: 404 | 403 | 500 | 400;
  title?: string;
  message?: string;
}

const ERROR_DETAILS: Record<
  ErrorStateProps['statusCode'],
  { title: string; message: string }
> = {
  404: {
    title: 'Page Not Found',
    message:
      "Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.",
  },
  403: {
    title: 'Access Denied',
    message:
      "You don't have permission to view this page. Please check your account privileges.",
  },
  500: {
    title: 'Server Error',
    message:
      "We're experiencing internal server issues. Please try again later.",
  },
  400: {
    title: 'Bad Request',
    message:
      'The request sent to the server was invalid. Please check the data you provided.',
  },
};

export function ErrorState({
  statusCode,
  title,
  message,
  className,
  ...props
}: ErrorStateProps) {
  const details = ERROR_DETAILS[statusCode] || ERROR_DETAILS[500];

  return (
    <Shell
      variant="centered"
      className={cn('min-h-[70vh] flex items-center justify-center', className)}
      {...props}
    >
      <div className="text-center p-8">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-7xl font-extrabold tracking-tight text-primary/10 mr-4">
            {statusCode}
          </h1>
          <Frown className="h-16 w-16 text-destructive" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
          {title || details.title}
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
          {message || details.message}
        </p>

        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Go to Home / Dashboard
          </Link>
        </Button>
      </div>
    </Shell>
  );
}
