'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="bg-zinc-100 dark:bg-zinc-800/50 p-6 rounded-full mb-6">
        <WifiOff className="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        You are offline
      </h1>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
        It seems you have lost your internet connection. We have saved some pages for you to browse offline, but this one is not available yet.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="w-full sm:w-auto"
        >
          Try Again
        </Button>
        
        <Button asChild className="w-full sm:w-auto">
          <Link href="/">
            Go to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
